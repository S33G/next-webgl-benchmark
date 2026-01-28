import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';

const GRID_SIZE = 128;
const CELL_SIZE = 0.5;
const UPDATE_INTERVAL = 100;

export function createConwayGameOfLifeScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  const shaderMaterials: THREE.ShaderMaterial[] = [];

  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = null;

  let grid: boolean[][] = [];
  let nextGrid: boolean[][] = [];
  let lastUpdateTime = 0;
  let mouseIsDown = false;
  let lastMouseX = -1;
  let lastMouseY = -1;

  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = [];
    nextGrid[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i][j] = Math.random() > 0.8;
      nextGrid[i][j] = false;
    }
  }

  const gridGroup = new THREE.Group();
  scene.add(gridGroup);
  objects.push(gridGroup);

  const cellGeometry = new THREE.PlaneGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95);
  
  const glowShader = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      glowColor: { value: new THREE.Color(0x00ff88) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 glowColor;
      varying vec2 vUv;
      
      void main() {
        float dist = distance(vUv, vec2(0.5));
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        float pulse = 0.8 + 0.2 * sin(time * 2.0);
        vec3 color = glowColor * glow * pulse;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: false,
  });
  
  const instancedMesh = new THREE.InstancedMesh(
    cellGeometry,
    glowShader,
    GRID_SIZE * GRID_SIZE
  );
  gridGroup.add(instancedMesh);
  objects.push(instancedMesh);
  shaderMaterials.push(glowShader);

  const gridLinesMaterial = new THREE.LineBasicMaterial({
    color: 0x222233,
    opacity: 0.3,
    transparent: true,
  });

  const horizontalLines = new THREE.Group();
  const verticalLines = new THREE.Group();

  for (let i = 0; i <= GRID_SIZE; i++) {
    const hGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-GRID_SIZE * CELL_SIZE / 2, (i - GRID_SIZE / 2) * CELL_SIZE, 0.01),
      new THREE.Vector3(GRID_SIZE * CELL_SIZE / 2, (i - GRID_SIZE / 2) * CELL_SIZE, 0.01),
    ]);
    const hLine = new THREE.Line(hGeo, gridLinesMaterial);
    horizontalLines.add(hLine);

    const vGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3((i - GRID_SIZE / 2) * CELL_SIZE, -GRID_SIZE * CELL_SIZE / 2, 0.01),
      new THREE.Vector3((i - GRID_SIZE / 2) * CELL_SIZE, GRID_SIZE * CELL_SIZE / 2, 0.01),
    ]);
    const vLine = new THREE.Line(vGeo, gridLinesMaterial);
    verticalLines.add(vLine);
  }

  gridGroup.add(horizontalLines);
  gridGroup.add(verticalLines);
  objects.push(horizontalLines, verticalLines);

  const updateInstancedMesh = () => {
    const dummy = new THREE.Object3D();
    let instanceIndex = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j]) {
          const x = (j - GRID_SIZE / 2) * CELL_SIZE;
          const y = (i - GRID_SIZE / 2) * CELL_SIZE;

          dummy.position.set(x, y, 0);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex++;
        }
      }
    }

    instancedMesh.count = instanceIndex;
    instancedMesh.instanceMatrix.needsUpdate = true;
  };

  updateInstancedMesh();

  const countNeighbors = (i: number, j: number): number => {
    let count = 0;
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        const ni = (i + di + GRID_SIZE) % GRID_SIZE;
        const nj = (j + dj + GRID_SIZE) % GRID_SIZE;
        if (grid[ni][nj]) count++;
      }
    }
    return count;
  };

  const updateGrid = () => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const neighbors = countNeighbors(i, j);
        if (grid[i][j]) {
          nextGrid[i][j] = neighbors === 2 || neighbors === 3;
        } else {
          nextGrid[i][j] = neighbors === 3;
        }
      }
    }

    [grid, nextGrid] = [nextGrid, grid];
    updateInstancedMesh();
  };

  const toggleCell = (mouseX: number, mouseY: number) => {
    const gridX = Math.floor((mouseX + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE);
    const gridY = Math.floor((mouseY + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      if (lastMouseX !== gridX || lastMouseY !== gridY) {
        grid[gridY][gridX] = true;
        lastMouseX = gridX;
        lastMouseY = gridY;
        updateInstancedMesh();
      }
    }
  };

  camera.position.set(0, 0, 50);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x00ff88, 1, 100);
  pointLight.position.set(0, 0, 20);
  scene.add(pointLight);

  const update = (time: number) => {
    const t = time * 0.001;

    glowShader.uniforms.time.value = t;

    if (time - lastUpdateTime > UPDATE_INTERVAL) {
      updateGrid();
      lastUpdateTime = time;
    }
  };

  const handleMouseMove = (x: number, y: number) => {
    if (mouseIsDown) {
      toggleCell(x, y);
    }
  };

  const handleMouseDown = (x: number, y: number, isDown: boolean) => {
    mouseIsDown = isDown;
    if (isDown) {
      lastMouseX = -1;
      lastMouseY = -1;
      toggleCell(x, y);
    }
  };

  const dispose = () => {
    objects.forEach(obj => {
      scene.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      } else if (obj instanceof THREE.Group) {
        obj.children.forEach(child => {
          if (child instanceof THREE.Line) {
            (child as THREE.Line).geometry.dispose();
            if (Array.isArray((child as THREE.Line).material)) {
              ((child as THREE.Line).material as THREE.Material[]).forEach(m => m.dispose());
            } else {
              ((child as THREE.Line).material as THREE.Material).dispose();
            }
          }
        });
      }
    });

    shaderMaterials.forEach(mat => mat.dispose());
    cellGeometry.dispose();
  };

  return {
    objects,
    shaderMaterials,
    update,
    dispose,
    handleMouseMove,
    handleMouseDown,
  };
}

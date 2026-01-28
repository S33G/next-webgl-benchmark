import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';

const TERRAIN_SIZE = 300;
const BLOCK_SIZE = 1;
const TERRAIN_HEIGHT = 150;
const SEA_LEVEL = 15;

function noise2D(x: number, y: number, seed: number = 0): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);

  const u = fade(x);
  const v = fade(y);

  const a = hash(X + seed) + Y;
  const b = hash(X + 1 + seed) + Y;

  return lerp(
    v,
    lerp(u, grad2D(hash(a), x, y), grad2D(hash(b), x - 1, y)),
    lerp(u, grad2D(hash(a + 1), x, y - 1), grad2D(hash(b + 1), x - 1, y - 1))
  );
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

function hash(n: number): number {
  n = (n << 13) ^ n;
  return (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
}

function grad2D(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
}

function getBiomeType(x: number, z: number): 'grass' | 'desert' | 'snow' {
  const biomeNoise = noise2D(x * 0.01, z * 0.01, 1000);
  const temperatureNoise = noise2D(x * 0.008, z * 0.008, 2000);

  const temperature = (temperatureNoise + 1) * 0.5;
  const humidity = (biomeNoise + 1) * 0.5;

  if (temperature < 0.3) return 'snow';
  if (humidity < 0.35 && temperature > 0.6) return 'desert';
  return 'grass';
}

function getTerrainHeight(x: number, z: number): number {
  const baseScale = 0.03;
  const mountainScale = 0.015;

  let baseHeight = 0;
  let baseAmplitude = 1;
  let baseFrequency = 1;
  let maxBaseValue = 0;

  for (let i = 0; i < 5; i++) {
    baseHeight += noise2D(x * baseScale * baseFrequency, z * baseScale * baseFrequency, i * 100) * baseAmplitude;
    maxBaseValue += baseAmplitude;
    baseAmplitude *= 0.45;
    baseFrequency *= 2.2;
  }

  baseHeight = (baseHeight / maxBaseValue + 1) * 0.5;

  const mountainNoise = Math.abs(noise2D(x * mountainScale, z * mountainScale, 500));
  const mountainMask = Math.pow(mountainNoise, 3);

  const ridgeNoise = 1 - Math.abs(noise2D(x * 0.02, z * 0.02, 700));
  const ridgeHeight = Math.pow(ridgeNoise, 2) * mountainMask;

  const finalHeight = baseHeight * 0.3 + mountainMask * 0.5 + ridgeHeight * 0.2;

  return Math.floor(finalHeight * TERRAIN_HEIGHT);
}

function createVoxelTree(scene: THREE.Scene, x: number, y: number, z: number): THREE.Group {
  const treeGroup = new THREE.Group();

  const trunkGeometries: THREE.BoxGeometry[] = [];
  const leavesGeometries: THREE.BoxGeometry[] = [];

  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    geo.translate(x, y + i, z);
    trunkGeometries.push(geo);
  }

  const leavesPositions = [
    [0, 4, 0], [1, 4, 0], [-1, 4, 0], [0, 4, 1], [0, 4, -1],
    [1, 4, 1], [-1, 4, 1], [1, 4, -1], [-1, 4, -1],
    [0, 5, 0], [1, 5, 0], [-1, 5, 0], [0, 5, 1], [0, 5, -1],
    [0, 6, 0]
  ];

  leavesPositions.forEach(([dx, dy, dz]) => {
    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    geo.translate(x + dx, y + dy, z + dz);
    leavesGeometries.push(geo);
  });

  const mergedTrunk = mergeGeometries(trunkGeometries);
  const mergedLeaves = mergeGeometries(leavesGeometries);

  if (mergedTrunk) {
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunkMesh = new THREE.Mesh(mergedTrunk, trunkMaterial);
    treeGroup.add(trunkMesh);
  }

  if (mergedLeaves) {
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leavesMesh = new THREE.Mesh(mergedLeaves, leavesMaterial);
    treeGroup.add(leavesMesh);
  }

  scene.add(treeGroup);
  return treeGroup;
}

function createVoxelSheep(): THREE.Mesh {
  const geometries: THREE.BoxGeometry[] = [];

  const bodyGeo = new THREE.BoxGeometry(BLOCK_SIZE * 1.5, BLOCK_SIZE, BLOCK_SIZE * 2);
  bodyGeo.translate(0, 0.5, 0);
  geometries.push(bodyGeo);

  const headGeo = new THREE.BoxGeometry(BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.8);
  headGeo.translate(0, 0.5, -1.2);
  geometries.push(headGeo);

  const legPositions = [
    [-0.4, -0.3, 0.6],
    [0.4, -0.3, 0.6],
    [-0.4, -0.3, -0.6],
    [0.4, -0.3, -0.6]
  ];

  legPositions.forEach(([x, y, z]) => {
    const legGeo = new THREE.BoxGeometry(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.6, BLOCK_SIZE * 0.3);
    legGeo.translate(x, y, z);
    geometries.push(legGeo);
  });

  const mergedSheep = mergeGeometries(geometries);
  const sheepMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

  return new THREE.Mesh(mergedSheep!, sheepMaterial);
}

function createTorch(x: number, y: number, z: number): { mesh: THREE.Group; light: THREE.PointLight } {
  const torchGroup = new THREE.Group();

  const stickGeometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.125, BLOCK_SIZE * 0.6, BLOCK_SIZE * 0.125);
  const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const stick = new THREE.Mesh(stickGeometry, stickMaterial);
  stick.position.set(x, y + 0.3, z);
  torchGroup.add(stick);

  const flameGeometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.25, BLOCK_SIZE * 0.25, BLOCK_SIZE * 0.25);
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xFFAA00 });
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.set(x, y + 0.725, z);
  torchGroup.add(flame);

  const light = new THREE.PointLight(0xFFAA00, 1.5, 12);
  light.position.set(x, y + 0.8, z);

  return { mesh: torchGroup, light };
}

export function createMinecraftScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  const shaderMaterials: THREE.ShaderMaterial[] = [];

  const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x3A8B3F });
  const dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
  const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
  const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const sandMaterial = new THREE.MeshLambertMaterial({ color: 0xE0C48C });
  const snowMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });

  const grassGeometries: THREE.BoxGeometry[] = [];
  const dirtGeometries: THREE.BoxGeometry[] = [];
  const stoneGeometries: THREE.BoxGeometry[] = [];
  const woodGeometries: THREE.BoxGeometry[] = [];
  const sandGeometries: THREE.BoxGeometry[] = [];
  const snowGeometries: THREE.BoxGeometry[] = [];
  const rockGeometries: THREE.BoxGeometry[] = [];

  const torchPositions: { x: number; y: number; z: number }[] = [];

  const centerX = 0;
  const centerZ = 0;

  for (let x = -TERRAIN_SIZE / 2; x < TERRAIN_SIZE / 2; x++) {
    for (let z = -TERRAIN_SIZE / 2; z < TERRAIN_SIZE / 2; z++) {
      const height = getTerrainHeight(x, z);
      const biome = getBiomeType(x, z);

      for (let y = 0; y <= height; y++) {
        const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        geo.translate(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);

        if (y === height) {
          if (height > SEA_LEVEL && Math.random() < 0.008 && biome !== 'snow') {
            torchPositions.push({ x: x * BLOCK_SIZE, y: (height + 1) * BLOCK_SIZE, z: z * BLOCK_SIZE });
          }

          if (height > 35 && biome !== 'desert') {
            snowGeometries.push(geo);
          } else if (height > 28) {
            rockGeometries.push(geo);
          } else if (biome === 'desert') {
            sandGeometries.push(geo);
          } else if (biome === 'snow') {
            snowGeometries.push(geo);
          } else {
            if (Math.random() < 0.002) {
              woodGeometries.push(geo);
            } else {
              grassGeometries.push(geo);
            }
          }
        } else if (y > height - 3 && height > SEA_LEVEL) {
          if (biome === 'desert') {
            sandGeometries.push(geo);
          } else {
            dirtGeometries.push(geo);
          }
        } else {
          stoneGeometries.push(geo);
        }
      }
    }
  }

  const mergedGrass = grassGeometries.length > 0 ? mergeGeometries(grassGeometries, false) : null;
  const mergedDirt = dirtGeometries.length > 0 ? mergeGeometries(dirtGeometries, false) : null;
  const mergedStone = stoneGeometries.length > 0 ? mergeGeometries(stoneGeometries, false) : null;
  const mergedWood = woodGeometries.length > 0 ? mergeGeometries(woodGeometries, false) : null;
  const mergedSand = sandGeometries.length > 0 ? mergeGeometries(sandGeometries, false) : null;
  const mergedSnow = snowGeometries.length > 0 ? mergeGeometries(snowGeometries, false) : null;
  const mergedRock = rockGeometries.length > 0 ? mergeGeometries(rockGeometries, false) : null;

  if (mergedGrass) {
    const grassMesh = new THREE.Mesh(mergedGrass, grassMaterial);
    scene.add(grassMesh);
    objects.push(grassMesh);
  }

  if (mergedDirt) {
    const dirtMesh = new THREE.Mesh(mergedDirt, dirtMaterial);
    scene.add(dirtMesh);
    objects.push(dirtMesh);
  }

  if (mergedStone) {
    const stoneMesh = new THREE.Mesh(mergedStone, stoneMaterial);
    scene.add(stoneMesh);
    objects.push(stoneMesh);
  }

  if (mergedWood) {
    const woodMesh = new THREE.Mesh(mergedWood, woodMaterial);
    scene.add(woodMesh);
    objects.push(woodMesh);
  }

  if (mergedSand) {
    const sandMesh = new THREE.Mesh(mergedSand, sandMaterial);
    scene.add(sandMesh);
    objects.push(sandMesh);
  }

  if (mergedSnow) {
    const snowMesh = new THREE.Mesh(mergedSnow, snowMaterial);
    scene.add(snowMesh);
    objects.push(snowMesh);
  }

  if (mergedRock) {
    const rockMesh = new THREE.Mesh(mergedRock, rockMaterial);
    scene.add(rockMesh);
    objects.push(rockMesh);
  }

  const treeHeight = getTerrainHeight(centerX, centerZ);
  const tree = createVoxelTree(scene, 0, treeHeight + 1, 0);
  objects.push(tree);

  const waterGeometry = new THREE.PlaneGeometry(TERRAIN_SIZE * BLOCK_SIZE, TERRAIN_SIZE * BLOCK_SIZE);
  waterGeometry.rotateX(-Math.PI / 2);
  waterGeometry.translate(0, SEA_LEVEL * BLOCK_SIZE, 0);
  const waterMaterial = new THREE.MeshLambertMaterial({
    color: 0x4080C0,
    transparent: true,
    opacity: 0.6
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  scene.add(water);
  objects.push(water);

  const sheep = createVoxelSheep();
  scene.add(sheep);
  objects.push(sheep);

  torchPositions.forEach(pos => {
    const torch = createTorch(pos.x, pos.y, pos.z);
    scene.add(torch.mesh);
    scene.add(torch.light);
    objects.push(torch.mesh);
    objects.push(torch.light);
  });

  let sheepPath = {
    active: false,
    startTime: 0,
    duration: 8000,
    startX: 0,
    startZ: 0,
    endX: 0,
    endZ: 0,
    startY: 0,
    endY: 0,
  };

  scene.fog = new THREE.Fog(0x87CEEB, 50, 120);

  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = false;
  scene.add(directionalLight);

  let orbitAngle = 0;
  const orbitRadius = 35;
  const orbitHeight = 30;
  const orbitSpeed = 0.00025;

  camera.position.set(orbitRadius, orbitHeight, 0);
  camera.lookAt(0, 15, 0);

  let timeOfDay = 0;

  const update = (time: number) => {
    orbitAngle += orbitSpeed;
    camera.position.x = Math.cos(orbitAngle) * orbitRadius;
    camera.position.z = Math.sin(orbitAngle) * orbitRadius;
    camera.position.y = orbitHeight;
    camera.lookAt(0, 15, 0);

    timeOfDay = (time * 0.0001) % (Math.PI * 2);

    const sunAngle = timeOfDay;
    const sunX = Math.cos(sunAngle) * 50;
    const sunY = Math.sin(sunAngle) * 100;
    const sunZ = 50;

    directionalLight.position.set(sunX, Math.max(sunY, 10), sunZ);

    let skyColor: THREE.Color;
    let fogColor: THREE.Color;
    let lightIntensity: number;
    let ambientIntensity: number;

    if (sunAngle < Math.PI / 2) {
      const t = sunAngle / (Math.PI / 2);
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0x191970),
        new THREE.Color(0x87CEEB),
        t
      );
      fogColor = skyColor;
      lightIntensity = 0.3 + t * 0.5;
      ambientIntensity = 0.1 + t * 0.2;
    } else if (sunAngle < Math.PI) {
      const t = (sunAngle - Math.PI / 2) / (Math.PI / 2);
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0x87CEEB),
        new THREE.Color(0xFF6347),
        t
      );
      fogColor = skyColor;
      lightIntensity = 0.8 - t * 0.5;
      ambientIntensity = 0.3 - t * 0.2;
    } else if (sunAngle < Math.PI * 1.5) {
      const t = (sunAngle - Math.PI) / (Math.PI / 2);
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0xFF6347),
        new THREE.Color(0x191970),
        t
      );
      fogColor = skyColor;
      lightIntensity = 0.3 - t * 0.2;
      ambientIntensity = 0.1;
    } else {
      const t = (sunAngle - Math.PI * 1.5) / (Math.PI / 2);
      skyColor = new THREE.Color(0x191970);
      fogColor = skyColor;
      lightIntensity = 0.1;
      ambientIntensity = 0.1;
    }

    scene.background = skyColor;
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color = fogColor;
    }
    directionalLight.intensity = lightIntensity;
    ambientLight.intensity = ambientIntensity;

    if (!sheepPath.active && Math.random() < 0.0005) {
      sheepPath.active = true;
      sheepPath.startTime = time;

      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 15;

      sheepPath.startX = Math.cos(angle) * distance;
      sheepPath.startZ = Math.sin(angle) * distance;
      sheepPath.endX = Math.cos(angle + Math.PI) * distance;
      sheepPath.endZ = Math.sin(angle + Math.PI) * distance;

      sheepPath.startY = getTerrainHeight(
        Math.floor(sheepPath.startX),
        Math.floor(sheepPath.startZ)
      ) + 1;
      sheepPath.endY = getTerrainHeight(
        Math.floor(sheepPath.endX),
        Math.floor(sheepPath.endZ)
      ) + 1;

      sheep.position.set(sheepPath.startX, sheepPath.startY, sheepPath.startZ);
      sheep.rotation.y = angle + Math.PI;
      sheep.visible = true;
    }

    if (sheepPath.active) {
      const elapsed = time - sheepPath.startTime;
      const progress = Math.min(elapsed / sheepPath.duration, 1);

      sheep.position.x = sheepPath.startX + (sheepPath.endX - sheepPath.startX) * progress;
      sheep.position.z = sheepPath.startZ + (sheepPath.endZ - sheepPath.startZ) * progress;
      sheep.position.y = sheepPath.startY + (sheepPath.endY - sheepPath.startY) * progress;

      if (progress >= 1) {
        sheepPath.active = false;
        sheep.visible = false;
      }
    }
  };

  const dispose = () => {
    objects.forEach(obj => {
      scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      } else if (obj instanceof THREE.Group) {
        obj.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    });

    shaderMaterials.forEach(mat => mat.dispose());
    grassMaterial.dispose();
    dirtMaterial.dispose();
    stoneMaterial.dispose();
    woodMaterial.dispose();
    sandMaterial.dispose();
    snowMaterial.dispose();
    rockMaterial.dispose();
    waterMaterial.dispose();
  };

  return {
    objects,
    shaderMaterials,
    update,
    dispose,
  };
}

import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import {
  noiseGlowShader,
  proceduralPatternShader,
  reflectionDistortionShader,
} from '@/shaders/customShaders';

export interface SceneObjects {
  objects: THREE.Object3D[];
  shaderMaterials: THREE.ShaderMaterial[];
  update: (time: number) => void;
  dispose: () => void;
  handleMouseMove?: (x: number, y: number) => void;
  handleMouseDown?: (x: number, y: number, isDown: boolean) => void;
}

export function createTrippyScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  const shaderMaterials: THREE.ShaderMaterial[] = [];

  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);

  const ambientLight = new THREE.AmbientLight(0x404060, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  const pointLight1 = new THREE.PointLight(0xff3366, 3, 20);
  pointLight1.position.set(-8, 3, -8);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x3366ff, 3, 20);
  pointLight2.position.set(8, 3, 8);
  scene.add(pointLight2);

  camera.position.set(0, 5, 15);

  const geometries = [
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.TorusGeometry(1, 0.4, 16, 32),
    new THREE.ConeGeometry(1, 2, 32),
    new THREE.OctahedronGeometry(1.2),
  ];

  for (let i = 0; i < 20; i++) {
    const geometry = geometries[i % geometries.length];
    let material: THREE.Material;

    if (settings.shaders && i % 3 === 0) {
      const shaderMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color().setHSL(Math.random(), 0.8, 0.5) },
        },
        vertexShader: noiseGlowShader.vertexShader,
        fragmentShader: noiseGlowShader.fragmentShader,
      });
      shaderMaterials.push(shaderMat);
      material = shaderMat;
    } else if (settings.shaders && i % 3 === 1) {
      const shaderMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color().setHSL(Math.random(), 0.8, 0.5) },
          color2: { value: new THREE.Color().setHSL(Math.random(), 0.8, 0.5) },
        },
        vertexShader: proceduralPatternShader.vertexShader,
        fragmentShader: proceduralPatternShader.fragmentShader,
      });
      shaderMaterials.push(shaderMat);
      material = shaderMat;
    } else if (settings.shaders && i % 3 === 2) {
      const shaderMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color().setHSL(Math.random(), 0.7, 0.6) },
        },
        vertexShader: reflectionDistortionShader.vertexShader,
        fragmentShader: reflectionDistortionShader.fragmentShader,
      });
      shaderMaterials.push(shaderMat);
      material = shaderMat;
    } else {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
        metalness: 0.3,
        roughness: 0.4,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);

    const angle = (i / 20) * Math.PI * 2;
    const radius = 5 + Math.random() * 3;
    mesh.position.x = Math.cos(angle) * radius;
    mesh.position.y = (Math.random() - 0.5) * 4;
    mesh.position.z = Math.sin(angle) * radius;

    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;

    const scale = 0.5 + Math.random() * 0.5;
    mesh.scale.set(scale, scale, scale);

    scene.add(mesh);
    objects.push(mesh);
  }

  const instancedMeshes: THREE.InstancedMesh[] = [];
  const instanceCount = settings.instanceCount;
  
  if (instanceCount > 0) {
    const cubeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      metalness: 0.6,
      roughness: 0.3,
    });

    const instancedCubes = new THREE.InstancedMesh(cubeGeo, cubeMat, instanceCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < instanceCount; i++) {
      const t = i / instanceCount;
      const radius = 12 + Math.sin(t * Math.PI * 8) * 2;
      const angle = t * Math.PI * 20;
      const height = Math.sin(t * Math.PI * 4) * 8;

      dummy.position.x = Math.cos(angle) * radius;
      dummy.position.y = height;
      dummy.position.z = Math.sin(angle) * radius;

      dummy.rotation.x = Math.random() * Math.PI;
      dummy.rotation.y = Math.random() * Math.PI;

      const scale = 0.5 + Math.random() * 0.5;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      instancedCubes.setMatrixAt(i, dummy.matrix);
    }

    instancedCubes.instanceMatrix.needsUpdate = true;
    scene.add(instancedCubes);
    instancedMeshes.push(instancedCubes);
    objects.push(instancedCubes);
  }

  const particleCount = settings.particleCount;
  let particleSystem: THREE.Points | null = null;

  if (particleCount > 0) {
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      const radius = 20 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true,
    });

    particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);
    objects.push(particleSystem);
  }

  const update = (time: number) => {
    objects.forEach((obj, i) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.rotation.x += 0.001 * (i + 1);
        obj.rotation.y += 0.002 * (i + 1);
      }
    });

    shaderMaterials.forEach(mat => {
      mat.uniforms.time.value = time;
    });

    camera.position.x = Math.sin(time * 0.0005) * 15;
    camera.position.z = Math.cos(time * 0.0005) * 15;
    camera.lookAt(0, 0, 0);

    if (particleSystem) {
      particleSystem.rotation.y = time * 0.0001;
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
      } else if (obj instanceof THREE.Points) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  };

  return {
    objects,
    shaderMaterials,
    update,
    dispose,
  };
}

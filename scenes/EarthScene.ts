import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';

export function createEarthScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  const shaderMaterials: THREE.ShaderMaterial[] = [];
  const textureLoader = new THREE.TextureLoader();

  scene.background = new THREE.Color(0x000000);
  scene.fog = null;

  const starfield = createStarfield(3000);
  scene.add(starfield);
  objects.push(starfield);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2);
  sunLight.position.set(10, 5, 5);
  scene.add(sunLight);

  const earthRadius = 5;
  const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
  
  // Load textures from CDN
  const earthDayTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg');
  const earthNormalTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_normal_2048.jpg');
  const earthSpecularTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_specular_2048.jpg');

  const earthMat = new THREE.MeshStandardMaterial({
    map: earthDayTexture,
    normalMap: earthNormalTexture,
    roughnessMap: earthSpecularTexture,
    metalness: 0.1,
    roughness: 0.9,
  });

  const earth = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earth);
  objects.push(earth);

  const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.02, 64, 64);
  const cloudTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_1024.png');
  const cloudMat = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(clouds);
  objects.push(clouds);

  const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.15, 64, 64);
  const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });
  
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  scene.add(atmosphere);
  objects.push(atmosphere);

  camera.position.set(0, 2, 12);
  camera.lookAt(0, 0, 0);

  const update = (time: number) => {
    const t = time * 0.001;

    earth.rotation.y = t * 0.1;
    clouds.rotation.y = t * 0.12;
    atmosphere.rotation.y = t * 0.08;

    camera.position.x = Math.sin(t * 0.1) * 14;
    camera.position.z = Math.cos(t * 0.1) * 14;
    camera.position.y = 2 + Math.sin(t * 0.05) * 2;
    camera.lookAt(0, 0, 0);
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
    shaderMaterials: [],
    update,
    dispose,
  };
}

function createStarfield(count: number): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const radius = 50 + Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

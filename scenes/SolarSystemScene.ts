import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';

interface Planet {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  angle: number;
}

export function createSolarSystemScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  const planets: Planet[] = [];
  const textureLoader = new THREE.TextureLoader();

  scene.background = new THREE.Color(0x000000);
  scene.fog = null;

  const starfield = createStarfield(5000);
  scene.add(starfield);
  objects.push(starfield);

  const sunGeo = new THREE.SphereGeometry(3, 64, 64);
  const sunTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/sun.jpg');
  const sunMat = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: 0xfdb813,
    emissiveIntensity: 1.5,
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sun);
  objects.push(sun);

  const sunLight = new THREE.PointLight(0xffffff, 3, 200);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
  scene.add(ambientLight);

  const planetData = [
    { name: 'Mercury', radius: 0.4, color: 0x8c7853, distance: 8, speed: 0.047, rotSpeed: 0.01, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/mercury.jpg' },
    { name: 'Venus', radius: 0.9, color: 0xffc649, distance: 12, speed: 0.035, rotSpeed: 0.004, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/venus_surface.jpg' },
    { name: 'Earth', radius: 1.0, color: 0x4169e1, distance: 16, speed: 0.03, rotSpeed: 0.02, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg' },
    { name: 'Mars', radius: 0.5, color: 0xdc4c3e, distance: 20, speed: 0.024, rotSpeed: 0.018, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/mars_1k_color.jpg' },
    { name: 'Jupiter', radius: 2.0, color: 0xc88b3a, distance: 30, speed: 0.013, rotSpeed: 0.04, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/jupiter.jpg' },
    { name: 'Saturn', radius: 1.8, color: 0xfad5a5, distance: 40, speed: 0.0097, rotSpeed: 0.038, hasRings: true, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/saturn.jpg' },
    { name: 'Uranus', radius: 1.2, color: 0x4fd0e0, distance: 50, speed: 0.0068, rotSpeed: 0.03, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/uranus.jpg' },
    { name: 'Neptune', radius: 1.2, color: 0x4166f5, distance: 60, speed: 0.0054, rotSpeed: 0.032, texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/neptune.jpg' },
  ];

  planetData.forEach(data => {
    const planetGeo = new THREE.SphereGeometry(data.radius, 32, 32);
    const planetTexture = data.texture ? textureLoader.load(data.texture) : null;
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTexture,
      color: planetTexture ? 0xffffff : data.color,
      metalness: 0.2,
      roughness: 0.8,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);

    if (data.hasRings) {
      const ringGeo = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xccaa88,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      planet.add(ring);
    }

    const angle = Math.random() * Math.PI * 2;
    planet.position.x = Math.cos(angle) * data.distance;
    planet.position.z = Math.sin(angle) * data.distance;

    scene.add(planet);
    objects.push(planet);

    planets.push({
      mesh: planet,
      orbitRadius: data.distance,
      orbitSpeed: data.speed * 10,
      rotationSpeed: data.rotSpeed,
      angle,
    });
  });

  camera.position.set(0, 40, 80);
  camera.lookAt(0, 0, 0);

  const update = (time: number) => {
    const t = time * 0.001;

    sun.rotation.y = t * 0.1;

    planets.forEach(planet => {
      planet.angle += planet.orbitSpeed * 0.01;
      planet.mesh.position.x = Math.cos(planet.angle) * planet.orbitRadius;
      planet.mesh.position.z = Math.sin(planet.angle) * planet.orbitRadius;
      planet.mesh.rotation.y += planet.rotationSpeed;
    });

    camera.position.x = Math.sin(t * 0.05) * 90;
    camera.position.z = Math.cos(t * 0.05) * 90;
    camera.position.y = 30 + Math.sin(t * 0.03) * 20;
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
    const radius = 150 + Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

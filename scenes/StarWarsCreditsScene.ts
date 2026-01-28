import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';

const CREDITS_TEXT = `WEBGL RENDERING PIPELINE

In the vast expanse of modern web browsers, a sophisticated graphics rendering system operates silently, transforming mathematical abstractions into visual reality.

THE RENDERING PIPELINE

The WebGL pipeline begins with vertex shaders, processing each point in 3D space. These coordinates undergo transformation through model, view, and projection matrices, converting world space into clip space.

SHADER PROGRAMS

Fragment shaders execute for each pixel, calculating color through complex algorithms. Lighting models compute the interaction of light with surfaces using normal vectors and material properties.

RASTERIZATION

The GPU rasterizes primitives, converting geometric data into pixels. Each triangle is sampled, interpolating vertex attributes across its surface.

TEXTURE MAPPING

Textures are sampled using UV coordinates, providing surface detail. Mipmapping optimizes performance across varying distances, while anisotropic filtering enhances quality on oblique surfaces.

DEPTH BUFFERING

The depth buffer maintains pixel depth values, resolving visibility. Z-fighting occurs when surfaces occupy nearly identical depth, causing flickering artifacts.

BLENDING AND COMPOSITING

Alpha blending combines transparent surfaces using source and destination color factors. Post-processing effects apply full-screen transformations through framebuffer objects.

THE GPU ARCHITECTURE

Massively parallel processing units execute shader instructions simultaneously. Memory bandwidth constrains performance, requiring careful optimization of data transfer between CPU and GPU.

PERFORMANCE OPTIMIZATION

Draw call batching reduces state changes. Instancing renders multiple objects efficiently. Level of detail systems adapt geometry complexity based on distance from camera.

May your frame rate be high and your render times be low.`;

export function createStarWarsCreditsScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  let textMesh: THREE.Mesh | null = null;
  let isLoaded = false;

  scene.background = new THREE.Color(0x000000);
  scene.fog = null;

  const starfield = createStarfield(2000);
  scene.add(starfield);
  objects.push(starfield);

  camera.position.set(0, -15, 30);
  camera.lookAt(0, 20, 0);
  camera.rotation.x = -0.4;

  const loader = new FontLoader();
  loader.load(
    'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeo = new TextGeometry(CREDITS_TEXT, {
        font: font,
        size: 1.2,
        depth: 0.3,
        curveSegments: 4,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 3,
      });

      textGeo.computeBoundingBox();
      const centerOffset = textGeo.boundingBox
        ? -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)
        : 0;

      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        side: THREE.DoubleSide,
      });

      textMesh = new THREE.Mesh(textGeo, textMaterial);
      textMesh.position.x = centerOffset;
      textMesh.position.y = -80;
      textMesh.position.z = -20;

      textMesh.rotation.x = -0.3;

      scene.add(textMesh);
      objects.push(textMesh);
      isLoaded = true;
    }
  );

  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const update = (time: number) => {
    const t = time * 0.001;

    if (isLoaded && textMesh) {
      textMesh.position.y += 0.015;

      if (textMesh.position.y > 150) {
        textMesh.position.y = -80;
      }
    }

    starfield.rotation.z = t * 0.02;
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
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const radius = 100 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    sizes[i] = Math.random() * 2 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
  });

  return new THREE.Points(geometry, material);
}

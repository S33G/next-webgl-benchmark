'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useRenderLoop } from '@/hooks/useRenderLoop';
import { useCanvasResize } from '@/hooks/useCanvasResize';

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);
    sceneRef.current = scene;
    
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
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 15);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;
    
    const objects: THREE.Object3D[] = [];
    const geometries = [
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.TorusGeometry(1, 0.4, 16, 32),
      new THREE.ConeGeometry(1, 2, 32),
      new THREE.OctahedronGeometry(1.2),
    ];
    
    for (let i = 0; i < 20; i++) {
      const geometry = geometries[i % geometries.length];
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
        metalness: 0.3,
        roughness: 0.4,
      });
      
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
    
    objectsRef.current = objects;
    
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      geometries.forEach(g => g.dispose());
      objects.forEach(obj => {
        if (obj instanceof THREE.Mesh) {
          (obj.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
    };
  }, []);
  
  useCanvasResize(canvasRef);
  
  useRenderLoop((time) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const objects = objectsRef.current;
    
    if (!scene || !camera || !renderer) return;
    
    const t = time * 0.0001;
    camera.position.x = Math.cos(t) * 15;
    camera.position.z = Math.sin(t) * 15;
    camera.position.y = 5 + Math.sin(t * 0.5) * 2;
    camera.lookAt(0, 0, 0);
    
    objects.forEach((obj, i) => {
      obj.rotation.x += 0.001 * (i % 3);
      obj.rotation.y += 0.002 * ((i + 1) % 3);
    });
    
    renderer.render(scene, camera);
  });
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}

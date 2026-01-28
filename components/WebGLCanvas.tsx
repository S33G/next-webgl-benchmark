'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer, RenderPass, BloomEffect, DepthOfFieldEffect, EffectPass } from 'postprocessing';
import { useRenderLoop } from '@/hooks/useRenderLoop';
import { useCanvasResize } from '@/hooks/useCanvasResize';
import {
  noiseGlowShader,
  proceduralPatternShader,
  reflectionDistortionShader,
} from '@/shaders/customShaders';

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomEffectRef = useRef<BloomEffect | null>(null);
  const dofEffectRef = useRef<DepthOfFieldEffect | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const shaderMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const instancedMeshesRef = useRef<THREE.InstancedMesh[]>([]);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  
  const [postProcessing, setPostProcessing] = useState({
    bloom: true,
    dof: false,
  });
  
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
    
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const bloomEffect = new BloomEffect({
      intensity: 1.5,
      luminanceThreshold: 0.21,
      luminanceSmoothing: 0.8,
    });
    
    const dofEffect = new DepthOfFieldEffect(camera, {
      focusDistance: 0.0,
      focalLength: 0.05,
      bokehScale: 3.0,
    });
    dofEffect.target = new THREE.Vector3(0, 0, 0);
    
    const effectPass = new EffectPass(camera, bloomEffect, dofEffect);
    composer.addPass(effectPass);
    
    bloomEffectRef.current = bloomEffect;
    dofEffectRef.current = dofEffect;
    composerRef.current = composer;
    
    const objects: THREE.Object3D[] = [];
    const shaderMaterials: THREE.ShaderMaterial[] = [];
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
      
      if (i % 3 === 0) {
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
      } else if (i % 3 === 1) {
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
      } else if (i % 3 === 2) {
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
    
    objectsRef.current = objects;
    shaderMaterialsRef.current = shaderMaterials;
    
    const instancedMeshes: THREE.InstancedMesh[] = [];
    const instanceCount = 5000;
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
    
    instancedMeshesRef.current = instancedMeshes;
    
    const particleCount = 10000;
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
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;
    
    const handleResize = () => {
      if (!camera || !renderer || !composer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
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
      cubeGeo.dispose();
      cubeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);
  
  useEffect(() => {
    const bloomEffect = bloomEffectRef.current;
    const dofEffect = dofEffectRef.current;
    if (!bloomEffect || !dofEffect) return;
    
    bloomEffect.blendMode.opacity.value = postProcessing.bloom ? 1.0 : 0.0;
    dofEffect.blendMode.opacity.value = postProcessing.dof ? 1.0 : 0.0;
  }, [postProcessing]);
  
  useCanvasResize(canvasRef);
  
  useRenderLoop((time) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const composer = composerRef.current;
    const objects = objectsRef.current;
    const shaderMaterials = shaderMaterialsRef.current;
    const instancedMeshes = instancedMeshesRef.current;
    const particleSystem = particleSystemRef.current;
    
    if (!scene || !camera || !composer) return;
    
    const t = time * 0.0001;
    camera.position.x = Math.cos(t) * 15;
    camera.position.z = Math.sin(t) * 15;
    camera.position.y = 5 + Math.sin(t * 0.5) * 2;
    camera.lookAt(0, 0, 0);
    
    shaderMaterials.forEach(mat => {
      mat.uniforms.time.value = time * 0.001;
    });
    
    objects.forEach((obj, i) => {
      obj.rotation.x += 0.001 * (i % 3);
      obj.rotation.y += 0.002 * ((i + 1) % 3);
    });
    
    instancedMeshes.forEach(mesh => {
      mesh.rotation.y += 0.001;
    });
    
    if (particleSystem) {
      particleSystem.rotation.y += 0.0005;
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time * 0.001 + i) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    composer.render();
  });
  
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Post-Processing</div>
        <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={postProcessing.bloom}
            onChange={(e) => setPostProcessing(p => ({ ...p, bloom: e.target.checked }))}
            style={{ marginRight: '8px' }}
          />
          Bloom
        </label>
        <label style={{ display: 'block', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={postProcessing.dof}
            onChange={(e) => setPostProcessing(p => ({ ...p, dof: e.target.checked }))}
            style={{ marginRight: '8px' }}
          />
          Depth of Field
        </label>
      </div>
    </>
  );
}

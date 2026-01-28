'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer, RenderPass, BloomEffect, DepthOfFieldEffect, EffectPass } from 'postprocessing';
import { useRenderLoop } from '@/hooks/useRenderLoop';
import { useCanvasResize } from '@/hooks/useCanvasResize';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import { createTrippyScene, type SceneObjects } from '@/scenes/TrippyScene';
import { createSolarSystemScene } from '@/scenes/SolarSystemScene';
import { createEarthScene } from '@/scenes/EarthScene';
import { createStarWarsCreditsScene } from '@/scenes/StarWarsCreditsScene';
import { createConwayGameOfLifeScene } from '@/scenes/ConwayGameOfLifeScene';

interface WebGLCanvasProps {
  settings: BenchmarkSettings;
}

export default function WebGLCanvas({ settings }: WebGLCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomEffectRef = useRef<BloomEffect | null>(null);
  const dofEffectRef = useRef<DepthOfFieldEffect | null>(null);
  const sceneObjectsRef = useRef<SceneObjects | null>(null);
  
  const [postProcessing, setPostProcessing] = useState({
    bloom: settings.bloom,
    dof: settings.dof,
  });
  const [effectsEnabled, setEffectsEnabled] = useState(false);
  const mouseStateRef = useRef({ isDown: false });
  
  useEffect(() => {
    setPostProcessing({ bloom: settings.bloom, dof: settings.dof });
  }, [settings.bloom, settings.dof]);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio * settings.resolution);
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
      focusDistance: 0.02,
      focalLength: 0.1,
      bokehScale: 8.0,
    });
    dofEffect.target = new THREE.Vector3(0, 0, 0);
    
    const effectPass = new EffectPass(camera, bloomEffect, dofEffect);
    composer.addPass(effectPass);
    
    bloomEffectRef.current = bloomEffect;
    dofEffectRef.current = dofEffect;
    composerRef.current = composer;
    
    let sceneObjects: SceneObjects;
    
    switch (settings.scene) {
      case 'solar-system':
        sceneObjects = createSolarSystemScene(scene, camera, settings);
        break;
      case 'earth':
        sceneObjects = createEarthScene(scene, camera, settings);
        break;
      case 'star-wars-credits':
        sceneObjects = createStarWarsCreditsScene(scene, camera, settings);
        break;
      case 'conway-life':
        sceneObjects = createConwayGameOfLifeScene(scene, camera, settings);
        break;
      default:
        sceneObjects = createTrippyScene(scene, camera, settings);
    }
    
    sceneObjectsRef.current = sceneObjects;
    
    bloomEffect.blendMode.setOpacity(0);
    dofEffect.blendMode.setOpacity(0);
    setEffectsEnabled(false);
    
    const enableTimer = setTimeout(() => {
      setEffectsEnabled(true);
    }, 100);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const getMousePosition = (event: MouseEvent): THREE.Vector3 | null => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      const result = raycaster.ray.intersectPlane(plane, intersectPoint);
      
      return result;
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!sceneObjects.handleMouseMove) return;
      
      const point = getMousePosition(event);
      if (point) {
        sceneObjects.handleMouseMove(point.x, point.y);
      }
    };
    
    const handleMouseDown = (event: MouseEvent) => {
      console.log('WebGLCanvas handleMouseDown', event.clientX, event.clientY);
      console.log('sceneObjects has handleMouseDown?', !!sceneObjects.handleMouseDown);
      if (!sceneObjects.handleMouseDown) return;
      
      mouseStateRef.current.isDown = true;
      const point = getMousePosition(event);
      if (point) {
        sceneObjects.handleMouseDown(point.x, point.y, true);
      }
    };
    
    const handleMouseUp = () => {
      if (!sceneObjects.handleMouseDown) return;
      
      mouseStateRef.current.isDown = false;
      sceneObjects.handleMouseDown(0, 0, false);
    };
    
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
      canvasRef.current.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      clearTimeout(enableTimer);
      
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        canvasRef.current.removeEventListener('mouseup', handleMouseUp);
      }
      
      if (sceneObjectsRef.current) {
        sceneObjectsRef.current.dispose();
      }
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      bloomEffect.dispose();
      dofEffect.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [settings.scene, settings.instanceCount, settings.particleCount, settings.resolution]);
  
  useEffect(() => {
    const bloomEffect = bloomEffectRef.current;
    const dofEffect = dofEffectRef.current;
    const composer = composerRef.current;
    
    if (!bloomEffect || !dofEffect || !composer) return;
    
    const effectPass = composer.passes.find(
      pass => pass instanceof EffectPass
    ) as EffectPass | undefined;
    
    if (!effectPass) return;
    
    if (!effectsEnabled) {
      bloomEffect.blendMode.setOpacity(0);
      dofEffect.blendMode.setOpacity(0);
      return;
    }
    
    const targetBloomOpacity = postProcessing.bloom ? 1 : 0;
    const targetDofOpacity = postProcessing.dof ? 1 : 0;
    
    const startBloomOpacity = bloomEffect.blendMode.opacity.value;
    const startDofOpacity = dofEffect.blendMode.opacity.value;
    
    const duration = 500;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      bloomEffect.blendMode.setOpacity(
        startBloomOpacity + (targetBloomOpacity - startBloomOpacity) * eased
      );
      dofEffect.blendMode.setOpacity(
        startDofOpacity + (targetDofOpacity - startDofOpacity) * eased
      );
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [postProcessing, effectsEnabled]);
  
  useEffect(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const composer = composerRef.current;
    
    if (!camera || !renderer || !composer) return;
    
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useRenderLoop(() => {
    const composer = composerRef.current;
    const sceneObjects = sceneObjectsRef.current;
    
    if (!composer || !sceneObjects) return;
    
    const time = performance.now();
    sceneObjects.update(time);
    
    composer.render();
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

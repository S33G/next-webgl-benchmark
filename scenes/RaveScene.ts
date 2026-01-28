import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';

interface Octagon {
  mesh: THREE.Line;
  baseRadius: number;
  rotationSpeed: number;
  frequencyBand: number;
  colorOffset: number;
  depth: number;
}

export function createRaveScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): SceneObjects {
  const objects: THREE.Object3D[] = [];
  const shaderMaterials: THREE.ShaderMaterial[] = [];
  
  scene.background = new THREE.Color(0x000000);
  
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let dataArray: Uint8Array<ArrayBuffer> | null = null;
  let microphoneStream: MediaStream | null = null;
  let audioEnabled = false;
  
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream = stream;
      
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      audioEnabled = true;
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Microphone access denied:', error);
      audioEnabled = false;
    }
  };
  
  initAudio();
  
  const octagons: Octagon[] = [];
  const octagonCount = 30;
  
  const createOctagon = (radius: number, depth: number): THREE.BufferGeometry => {
    const points: THREE.Vector3[] = [];
    const sides = 8;
    
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, depth));
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  };
  
  for (let i = 0; i < octagonCount; i++) {
    const depth = -i * 2 - 5;
    const baseRadius = 1 + i * 0.3;
    const geometry = createOctagon(baseRadius, depth);
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });
    
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    objects.push(line);
    
    octagons.push({
      mesh: line,
      baseRadius,
      rotationSpeed: 0.001 + Math.random() * 0.002,
      frequencyBand: Math.floor((i / octagonCount) * 128),
      colorOffset: (i / octagonCount) * Math.PI * 2,
      depth,
    });
  }
  
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  
  const getFrequencyValue = (band: number): number => {
    if (!audioEnabled || !analyser || !dataArray) return 0;
    
    try {
      analyser.getByteFrequencyData(dataArray);
      return dataArray[band] / 255;
    } catch (error) {
      return 0;
    }
  };
  
  const getAverageFrequency = (): number => {
    if (!audioEnabled || !analyser || !dataArray) return 0;
    
    try {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      return sum / dataArray.length / 255;
    } catch (error) {
      return 0;
    }
  };
  
  const update = (time: number) => {
    const avgFrequency = getAverageFrequency();
    const bassBoost = getFrequencyValue(5) * 2;
    
    octagons.forEach((octagon, index) => {
      const frequencyValue = getFrequencyValue(octagon.frequencyBand);
      
      const scale = 1 + frequencyValue * 0.5 + bassBoost * 0.3;
      octagon.mesh.scale.set(scale, scale, 1);
      
      octagon.mesh.rotation.z += octagon.rotationSpeed * (1 + avgFrequency * 2);
      
      const hue = (octagon.colorOffset + time * 0.0001 + frequencyValue * 0.5) % 1;
      const saturation = 0.7 + frequencyValue * 0.3;
      const lightness = 0.4 + frequencyValue * 0.4;
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      (octagon.mesh.material as THREE.LineBasicMaterial).color = color;
      
      const pulseZ = octagon.depth + Math.sin(time * 0.001 + index * 0.2) * 0.5;
      octagon.mesh.position.z = pulseZ + avgFrequency * 2;
    });
    
    camera.position.z = 10 + bassBoost * 3;
  };
  
  const dispose = () => {
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext) {
      audioContext.close();
    }
    
    octagons.forEach(octagon => {
      octagon.mesh.geometry.dispose();
      (octagon.mesh.material as THREE.Material).dispose();
    });
    
    objects.forEach(obj => scene.remove(obj));
    shaderMaterials.forEach(mat => mat.dispose());
  };
  
  return {
    objects,
    shaderMaterials,
    update,
    dispose,
  };
}

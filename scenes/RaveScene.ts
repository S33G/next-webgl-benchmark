import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';
import type { SceneObjects } from './TrippyScene';
import type { RaveSceneParams } from '@/components/SceneControls';

interface Octagon {
  mesh: THREE.Line;
  shadowMeshes: THREE.Line[];
  glowMesh: THREE.Mesh;
  baseRadius: number;
  rotationSpeed: number;
  frequencyBand: number;
  colorOffset: number;
  depth: number;
  trailHistory: { rotation: number; scale: number; time: number }[];
}

export interface RaveSceneObject extends SceneObjects {
  updateParams: (params: RaveSceneParams) => void;
}

export function createRaveScene(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  settings: BenchmarkSettings
): RaveSceneObject {
  const objects: THREE.Object3D[] = [];
  const shaderMaterials: THREE.ShaderMaterial[] = [];
  
  const sceneContainer = new THREE.Group();
  scene.add(sceneContainer);

  scene.background = new THREE.Color(0x000000);

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let dataArray: Uint8Array<ArrayBuffer> | null = null;
  let microphoneStream: MediaStream | null = null;
  let audioElement: HTMLAudioElement | null = null;
  let audioSourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  let audioEnabled = false;
  let currentAudioSource: 'microphone' | 'file' = 'microphone';

  const BASE_CAMERA_DISTANCE = 10;

  let sceneParams: RaveSceneParams = {
    octagonCount: 30,
    bassBoost: 2.0,
    colorSpeed: 0.0001,
    rotationSpeed: 1.0,
    scale: 1.0,
    zoom: 0.7,
    audioSource: 'microphone',
    audioFile: null,
    showParticles: true,
    showParticleTrails: true,
    showGlow: true,
    showShadows: true,
    showConnectionLines: true,
    showEchoRings: true,
  };

  const initMicrophone = async () => {
    try {
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream = stream;

      if (!audioContext) {
        audioContext = new AudioContext();
      }

      if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      }

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioEnabled = true;
      currentAudioSource = 'microphone';
      console.log('Microphone initialized successfully');
    } catch (error) {
      console.error('Microphone access denied:', error);
      audioEnabled = false;
    }
  };

  const initFileAudio = async (file: File) => {
    try {
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
      }

      if (audioSourceNode) {
        audioSourceNode.disconnect();
      }

      if (!audioContext) {
        audioContext = new AudioContext();
      }

      if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      }

      if (audioElement) {
        audioElement.pause();
        audioElement = null;
      }

      audioElement = new Audio();
      audioElement.src = URL.createObjectURL(file);
      audioElement.loop = true;

      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      audioSourceNode = source;

      await audioElement.play();

      audioEnabled = true;
      currentAudioSource = 'file';
      console.log('Audio file loaded successfully');
    } catch (error) {
      console.error('Failed to load audio file:', error);
      audioEnabled = false;
    }
  };

  initMicrophone();

  const octagons: Octagon[] = [];
  const connectionLines: THREE.Line[] = [];
  const particles: THREE.Points[] = [];
  const particleTrails: THREE.Line[] = [];
  const echoRings: { mesh: THREE.Line; startTime: number; maxRadius: number }[] = [];

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

  const createGlowHalo = (radius: number, depth: number): THREE.Mesh => {
    const geometry = new THREE.RingGeometry(radius * 0.9, radius * 1.1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = depth;
    return mesh;
  };

  const createParticleSystem = (count: number): THREE.Points => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = Math.random() * -60;
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = Math.random() * 0.05 + 0.02;
      lifetimes[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: createBlurredParticleTexture(),
    });

    return new THREE.Points(geometry, material);
  };

  const createBlurredParticleTexture = (): THREE.Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

   const createOctagons = (count: number) => {
     // Dispose old octagons
     octagons.forEach(octagon => {
       sceneContainer.remove(octagon.mesh);
       octagon.mesh.geometry.dispose();
       (octagon.mesh.material as THREE.Material).dispose();
       
       octagon.shadowMeshes.forEach(shadow => {
         sceneContainer.remove(shadow);
         shadow.geometry.dispose();
         (shadow.material as THREE.Material).dispose();
       });
       
       sceneContainer.remove(octagon.glowMesh);
       octagon.glowMesh.geometry.dispose();
       (octagon.glowMesh.material as THREE.Material).dispose();
     });
     octagons.length = 0;
     
     // Dispose old connection lines
     connectionLines.forEach(line => {
       sceneContainer.remove(line);
       line.geometry.dispose();
       (line.material as THREE.Material).dispose();
     });
     connectionLines.length = 0;
     
     // Dispose old particles
     particles.forEach(particleSystem => {
       sceneContainer.remove(particleSystem);
       particleSystem.geometry.dispose();
       (particleSystem.material as THREE.Material).dispose();
     });
     particles.length = 0;
     
     particleTrails.forEach(trail => {
       sceneContainer.remove(trail);
       trail.geometry.dispose();
       (trail.material as THREE.Material).dispose();
     });
     particleTrails.length = 0;

     // Create new octagons with effects
     for (let i = 0; i < count; i++) {
       const depth = -i * 2 - 5;
       const baseRadius = (1 + i * 0.3) * sceneParams.scale;
       const geometry = createOctagon(baseRadius, depth);

       // Main octagon
       const material = new THREE.LineBasicMaterial({
         color: 0xffffff,
         linewidth: 2,
       });
       const line = new THREE.Line(geometry, material);
       sceneContainer.add(line);
       objects.push(line);

       // Create shadow layers (3 layers with increasing opacity fade)
       const shadowMeshes: THREE.Line[] = [];
       for (let s = 1; s <= 3; s++) {
         const shadowGeometry = createOctagon(baseRadius, depth - s * 0.3);
         const shadowMaterial = new THREE.LineBasicMaterial({
           color: 0xffffff,
           transparent: true,
           opacity: 0.3 / s,
           linewidth: 1,
         });
         const shadowMesh = new THREE.Line(shadowGeometry, shadowMaterial);
         sceneContainer.add(shadowMesh);
         objects.push(shadowMesh);
         shadowMeshes.push(shadowMesh);
       }

       // Create glow halo
       const glowMesh = createGlowHalo(baseRadius, depth);
       sceneContainer.add(glowMesh);
       objects.push(glowMesh);

       octagons.push({
         mesh: line,
         shadowMeshes,
         glowMesh,
         baseRadius,
         rotationSpeed: 0.001 + Math.random() * 0.002,
         frequencyBand: Math.floor((i / count) * 128),
         colorOffset: (i / count) * Math.PI * 2,
         depth,
         trailHistory: [],
       });
     }
     
     // Create connection lines between octagons
     if (count > 1) {
       for (let i = 0; i < count - 1; i++) {
         const points: THREE.Vector3[] = [];
         for (let v = 0; v < 8; v++) {
           points.push(new THREE.Vector3(0, 0, 0));
           points.push(new THREE.Vector3(0, 0, 0));
         }
         const geometry = new THREE.BufferGeometry().setFromPoints(points);
         const material = new THREE.LineBasicMaterial({
           color: 0xffffff,
           transparent: true,
           opacity: 0.15,
           linewidth: 1,
         });
         const line = new THREE.Line(geometry, material);
         sceneContainer.add(line);
         objects.push(line);
         connectionLines.push(line);
       }
     }
     
     // Create particle systems
     for (let i = 0; i < Math.min(count, 3); i++) {
       const particleSystem = createParticleSystem(200);
       sceneContainer.add(particleSystem);
       objects.push(particleSystem);
       particles.push(particleSystem);
       
       const trailPoints: THREE.Vector3[] = [];
       for (let t = 0; t < 200 * 5; t++) {
         trailPoints.push(new THREE.Vector3(0, 0, 0));
       }
       const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
       const trailMaterial = new THREE.LineBasicMaterial({
         color: 0xffffff,
         transparent: true,
         opacity: 0.15,
         blending: THREE.AdditiveBlending,
         linewidth: 1,
       });
       const trailLine = new THREE.Line(trailGeometry, trailMaterial);
       sceneContainer.add(trailLine);
       objects.push(trailLine);
       particleTrails.push(trailLine);
     }
   };

  createOctagons(sceneParams.octagonCount);

  camera.position.set(0, 0, BASE_CAMERA_DISTANCE);
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

  let previousBassValue = 0;
  
  const update = (time: number) => {
    const avgFrequency = getAverageFrequency();
    const bassBoost = getFrequencyValue(5) * sceneParams.bassBoost;
    
    const currentBass = getFrequencyValue(5);
    const bassDelta = Math.max(0, currentBass - previousBassValue);
    const transientIntensity = Math.min(bassDelta * 8, 1);
    previousBassValue = currentBass * 0.9;
    
    const zoomMultiplier = 1 + transientIntensity * 3;
    const reactiveZoom = sceneParams.zoom * zoomMultiplier;
    sceneContainer.scale.set(reactiveZoom, reactiveZoom, reactiveZoom);

    octagons.forEach((octagon, index) => {
      const frequencyValue = getFrequencyValue(octagon.frequencyBand);

      const scale = 1 + frequencyValue * 0.5 + bassBoost * 0.3;
      octagon.mesh.scale.set(scale, scale, 1);

      octagon.mesh.rotation.z += octagon.rotationSpeed * sceneParams.rotationSpeed * (1 + avgFrequency * 2);

      const hue = (octagon.colorOffset + time * sceneParams.colorSpeed + frequencyValue * 0.5) % 1;
      const saturation = 0.7 + frequencyValue * 0.3;
      const lightness = 0.4 + frequencyValue * 0.4;

      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      (octagon.mesh.material as THREE.LineBasicMaterial).color = color;

      const pulseZ = octagon.depth + Math.sin(time * 0.001 + index * 0.2) * 0.5;
      octagon.mesh.position.z = pulseZ + avgFrequency * 4;
      
      octagon.shadowMeshes.forEach((shadow, shadowIndex) => {
        shadow.visible = sceneParams.showShadows;
        const shadowScale = scale * (1 - shadowIndex * 0.05);
        shadow.scale.set(shadowScale, shadowScale, 1);
        shadow.rotation.z = octagon.mesh.rotation.z - shadowIndex * 0.1;
        shadow.position.z = octagon.mesh.position.z - shadowIndex * 0.3;
        const shadowColor = color.clone().multiplyScalar(0.8);
        (shadow.material as THREE.LineBasicMaterial).color = shadowColor;
        (shadow.material as THREE.LineBasicMaterial).opacity = (0.3 / (shadowIndex + 1)) * (1 + frequencyValue * 0.5);
      });
      
      octagon.glowMesh.visible = sceneParams.showGlow;
      octagon.glowMesh.scale.set(scale * 1.2, scale * 1.2, 1);
      octagon.glowMesh.rotation.z = -octagon.mesh.rotation.z * 0.5;
      octagon.glowMesh.position.z = octagon.mesh.position.z;
      (octagon.glowMesh.material as THREE.MeshBasicMaterial).color = color;
      (octagon.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.05 + frequencyValue * 0.1;
      
      octagon.trailHistory.push({
        rotation: octagon.mesh.rotation.z,
        scale: scale,
        time: time,
      });
      
      if (octagon.trailHistory.length > 5) {
        octagon.trailHistory.shift();
      }
    });
    
    if (octagons.length > 1) {
      connectionLines.forEach((line, index) => {
        line.visible = sceneParams.showConnectionLines;
        const oct1 = octagons[index];
        const oct2 = octagons[index + 1];
        
        const positions = line.geometry.attributes.position.array as Float32Array;
        
        for (let v = 0; v < 8; v++) {
          const angle = (v / 8) * Math.PI * 2;
          
          const x1 = Math.cos(angle + oct1.mesh.rotation.z) * oct1.baseRadius * oct1.mesh.scale.x;
          const y1 = Math.sin(angle + oct1.mesh.rotation.z) * oct1.baseRadius * oct1.mesh.scale.y;
          const z1 = oct1.mesh.position.z;
          
          const x2 = Math.cos(angle + oct2.mesh.rotation.z) * oct2.baseRadius * oct2.mesh.scale.x;
          const y2 = Math.sin(angle + oct2.mesh.rotation.z) * oct2.baseRadius * oct2.mesh.scale.y;
          const z2 = oct2.mesh.position.z;
          
          positions[v * 6] = x1;
          positions[v * 6 + 1] = y1;
          positions[v * 6 + 2] = z1;
          positions[v * 6 + 3] = x2;
          positions[v * 6 + 4] = y2;
          positions[v * 6 + 5] = z2;
        }
        
        line.geometry.attributes.position.needsUpdate = true;
        
        const freq1 = getFrequencyValue(oct1.frequencyBand);
        const freq2 = getFrequencyValue(oct2.frequencyBand);
        const avgFreq = (freq1 + freq2) / 2;
        (line.material as THREE.LineBasicMaterial).opacity = 0.1 + avgFreq * 0.3;
        
        const lineColor = new THREE.Color().setHSL(
          (oct1.colorOffset + oct2.colorOffset) / 2 + time * sceneParams.colorSpeed,
          0.5,
          0.5
        );
        (line.material as THREE.LineBasicMaterial).color = lineColor;
      });
    }
    
    particles.forEach((particleSystem, pIndex) => {
      particleSystem.visible = sceneParams.showParticles;
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      const velocities = particleSystem.geometry.attributes.velocity.array as Float32Array;
      const lifetimes = particleSystem.geometry.attributes.lifetime.array as Float32Array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * (1 + avgFrequency * 5);
        positions[i * 3 + 1] += velocities[i * 3 + 1] * (1 + avgFrequency * 5);
        positions[i * 3 + 2] += velocities[i * 3 + 2] * (1 + avgFrequency * 3);
        
        lifetimes[i] += 0.01;
        
        if (positions[i * 3 + 2] > 10 || lifetimes[i] > 1) {
          if (octagons.length > pIndex) {
            const sourceOctagon = octagons[pIndex * Math.floor(octagons.length / particles.length)];
            const angle = Math.random() * Math.PI * 2;
            const radius = sourceOctagon.baseRadius * sourceOctagon.mesh.scale.x;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = sourceOctagon.mesh.position.z;
            lifetimes[i] = 0;
          }
        }
      }
      
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.geometry.attributes.lifetime.needsUpdate = true;
      
      const hue = (pIndex / particles.length + time * sceneParams.colorSpeed * 2) % 1;
      (particleSystem.material as THREE.PointsMaterial).color.setHSL(hue, 0.8, 0.6);
      (particleSystem.material as THREE.PointsMaterial).opacity = 0.4 + avgFrequency * 0.4;
      
      if (particleTrails[pIndex]) {
        const trail = particleTrails[pIndex];
        trail.visible = sceneParams.showParticleTrails && sceneParams.showParticles;
        const trailPositions = trail.geometry.attributes.position.array as Float32Array;
        const particleCount = positions.length / 3;
        const trailLength = 5;
        
        for (let i = 0; i < particleCount; i++) {
          const baseIdx = i * trailLength * 3;
          
          for (let t = trailLength - 1; t > 0; t--) {
            const currIdx = baseIdx + t * 3;
            const prevIdx = baseIdx + (t - 1) * 3;
            trailPositions[currIdx] = trailPositions[prevIdx];
            trailPositions[currIdx + 1] = trailPositions[prevIdx + 1];
            trailPositions[currIdx + 2] = trailPositions[prevIdx + 2];
          }
          
          trailPositions[baseIdx] = positions[i * 3];
          trailPositions[baseIdx + 1] = positions[i * 3 + 1];
          trailPositions[baseIdx + 2] = positions[i * 3 + 2];
        }
        
        trail.geometry.attributes.position.needsUpdate = true;
        (trail.material as THREE.LineBasicMaterial).color.setHSL(hue, 0.7, 0.5);
        (trail.material as THREE.LineBasicMaterial).opacity = 0.1 + avgFrequency * 0.15;
      }
    });
    
    if (sceneParams.showEchoRings && bassBoost > 0.6 && Math.random() > 0.95) {
      const randomOctagon = octagons[Math.floor(Math.random() * octagons.length)];
      const ringGeometry = createOctagon(randomOctagon.baseRadius * 0.5, randomOctagon.depth);
      const ringMaterial = new THREE.LineBasicMaterial({
        color: (randomOctagon.mesh.material as THREE.LineBasicMaterial).color,
        transparent: true,
        opacity: 0.8,
        linewidth: 3,
      });
      const ringMesh = new THREE.Line(ringGeometry, ringMaterial);
      ringMesh.position.z = randomOctagon.mesh.position.z;
      sceneContainer.add(ringMesh);
      
      echoRings.push({
        mesh: ringMesh,
        startTime: time,
        maxRadius: randomOctagon.baseRadius * 3,
      });
      
      if (echoRings.length > 20) {
        const oldRing = echoRings.shift();
        if (oldRing) {
          sceneContainer.remove(oldRing.mesh);
          oldRing.mesh.geometry.dispose();
          (oldRing.mesh.material as THREE.Material).dispose();
        }
      }
    }
    
    echoRings.forEach((ring, index) => {
      const age = time - ring.startTime;
      const progress = Math.min(age / 1000, 1);
      
      const scale = 1 + progress * 5;
      ring.mesh.scale.set(scale, scale, 1);
      ring.mesh.rotation.z += 0.01;
      
      const opacity = (1 - progress) * 0.8;
      (ring.mesh.material as THREE.LineBasicMaterial).opacity = opacity;
      
      if (progress >= 1) {
        sceneContainer.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        (ring.mesh.material as THREE.Material).dispose();
        echoRings.splice(index, 1);
      }
    });

    camera.position.z = BASE_CAMERA_DISTANCE + bassBoost * 3;
   };

   const updateParams = (params: RaveSceneParams) => {
     if (!params) {
       console.warn('updateParams called with null params');
       return;
     }
     
     console.log('RaveScene updateParams called:', params);
     
     const prevOctagonCount = sceneParams.octagonCount;
     const prevScale = sceneParams.scale;
     sceneParams = params;

     if (params.audioSource !== currentAudioSource) {
       if (params.audioSource === 'file' && params.audioFile) {
         initFileAudio(params.audioFile);
       } else if (params.audioSource === 'microphone') {
         initMicrophone();
       }
     }

     if (params.octagonCount !== prevOctagonCount || params.scale !== prevScale) {
       createOctagons(params.octagonCount);
     }
   };

  const dispose = () => {
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop());
    }

    if (audioElement) {
      audioElement.pause();
      if (audioElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioElement.src);
      }
      audioElement = null;
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
    updateParams,
  };
}

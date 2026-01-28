import * as THREE from 'three';
import type { BenchmarkSettings } from '@/components/ControlPanel';

export interface IScene {
  create(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, settings: BenchmarkSettings): void;
  update(time: number): void;
  dispose(): void;
}

export abstract class BaseScene implements IScene {
  protected objects: THREE.Object3D[] = [];
  protected materials: THREE.Material[] = [];
  protected geometries: THREE.BufferGeometry[] = [];

  abstract create(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, settings: BenchmarkSettings): void;
  abstract update(time: number): void;

  dispose(): void {
    this.objects.forEach(obj => {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });
    
    this.materials.forEach(mat => mat.dispose());
    this.geometries.forEach(geo => geo.dispose());
    
    this.objects = [];
    this.materials = [];
    this.geometries = [];
  }

  protected trackObject(obj: THREE.Object3D): void {
    this.objects.push(obj);
  }

  protected trackMaterial(mat: THREE.Material): void {
    this.materials.push(mat);
  }

  protected trackGeometry(geo: THREE.BufferGeometry): void {
    this.geometries.push(geo);
  }
}

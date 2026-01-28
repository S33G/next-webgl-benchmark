'use client';

import { useRef, useEffect, useState } from 'react';
import type { PerformanceMetrics } from '@/components/MetricsDisplay';

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    min: 0,
    max: 0,
    p1: 0,
    p99: 0,
  });
  
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsUpdateIntervalRef = useRef<number>(0);
  
  useEffect(() => {
    const updateMetrics = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      frameTimesRef.current.push(delta);
      frameCountRef.current++;
      
      if (frameTimesRef.current.length > 120) {
        frameTimesRef.current.shift();
      }
      
      fpsUpdateIntervalRef.current++;
      
      if (fpsUpdateIntervalRef.current >= 10) {
        fpsUpdateIntervalRef.current = 0;
        
        const frameTimes = frameTimesRef.current;
        if (frameTimes.length > 0) {
          const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          const fps = 1000 / avgFrameTime;
          
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const min = 1000 / sorted[sorted.length - 1];
          const max = 1000 / sorted[0];
          
          const p1Index = Math.floor(sorted.length * 0.01);
          const p99Index = Math.floor(sorted.length * 0.99);
          const p1 = 1000 / sorted[Math.max(sorted.length - 1 - p1Index, 0)];
          const p99 = 1000 / sorted[Math.max(p99Index, 0)];
          
          setMetrics({
            fps: isFinite(fps) ? fps : 0,
            frameTime: avgFrameTime,
            min: isFinite(min) ? min : 0,
            max: isFinite(max) ? max : 0,
            p1: isFinite(p1) ? p1 : 0,
            p99: isFinite(p99) ? p99 : 0,
          });
        }
      }
    };
    
    const handle = setInterval(updateMetrics, 16);
    
    return () => {
      clearInterval(handle);
    };
  }, []);
  
  const resetMetrics = () => {
    frameTimesRef.current = [];
    frameCountRef.current = 0;
    setMetrics({
      fps: 0,
      frameTime: 0,
      min: 0,
      max: 0,
      p1: 0,
      p99: 0,
    });
  };
  
  return { metrics, resetMetrics };
}

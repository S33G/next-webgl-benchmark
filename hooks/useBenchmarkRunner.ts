import { useState, useCallback, useRef } from 'react';
import { type BenchmarkSettings } from '@/components/ControlPanel';

export type BenchmarkMode = 'manual' | 'auto-ramp' | 'stress-test' | 'fixed-preset';

export interface BenchmarkResult {
  preset: string;
  settings: BenchmarkSettings;
  avgFps: number;
  minFps: number;
  maxFps: number;
  p1Fps: number;
  p99Fps: number;
  avgFrameTime: number;
  duration: number;
}

interface UseBenchmarkRunnerProps {
  settings: BenchmarkSettings;
  onSettingsChange: (settings: BenchmarkSettings) => void;
  currentFps: number;
  resetMetrics: () => void;
}

const PRESETS: Record<string, Omit<BenchmarkSettings, 'scene'>> = {
  low: {
    resolution: 0.5,
    instanceCount: 1000,
    particleCount: 2000,
    bloom: false,
    dof: false,
    shaders: false,
  },
  medium: {
    resolution: 0.75,
    instanceCount: 3000,
    particleCount: 5000,
    bloom: true,
    dof: false,
    shaders: true,
  },
  high: {
    resolution: 1.0,
    instanceCount: 5000,
    particleCount: 10000,
    bloom: true,
    dof: false,
    shaders: true,
  },
  ultra: {
    resolution: 1.0,
    instanceCount: 8000,
    particleCount: 15000,
    bloom: true,
    dof: true,
    shaders: true,
  },
};

export function useBenchmarkRunner({
  settings,
  onSettingsChange,
  currentFps,
  resetMetrics,
}: UseBenchmarkRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<BenchmarkMode>('manual');
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metricsBufferRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  const stopBenchmark = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setProgress(0);
    setCurrentPhase('');
    metricsBufferRef.current = [];
  }, []);

  const collectMetrics = useCallback(() => {
    if (currentFps > 0) {
      metricsBufferRef.current.push(currentFps);
    }
  }, [currentFps]);

  const calculateResults = useCallback((presetName: string, presetSettings: BenchmarkSettings): BenchmarkResult => {
    const metrics = metricsBufferRef.current;
    const sorted = [...metrics].sort((a, b) => a - b);
    
    const avgFps = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const minFps = sorted[0] || 0;
    const maxFps = sorted[sorted.length - 1] || 0;
    const p1Fps = sorted[Math.floor(sorted.length * 0.01)] || 0;
    const p99Fps = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const avgFrameTime = 1000 / avgFps;
    const duration = (Date.now() - startTimeRef.current) / 1000;

    return {
      preset: presetName,
      settings: presetSettings,
      avgFps,
      minFps,
      maxFps,
      p1Fps,
      p99Fps,
      avgFrameTime,
      duration,
    };
  }, []);

  const runAutoRamp = useCallback(async () => {
    setIsRunning(true);
    setMode('auto-ramp');
    setResults([]);
    
    const phases = [
      { name: 'Warmup', duration: 2000, instances: 1000, particles: 2000 },
      { name: 'Ramp 1', duration: 3000, instances: 2500, particles: 5000 },
      { name: 'Ramp 2', duration: 3000, instances: 5000, particles: 10000 },
      { name: 'Ramp 3', duration: 3000, instances: 7500, particles: 15000 },
      { name: 'Max Load', duration: 4000, instances: 10000, particles: 20000 },
    ];
    
    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    let elapsed = 0;
    
    for (const phase of phases) {
      setCurrentPhase(phase.name);
      onSettingsChange({
        ...settings,
        instanceCount: phase.instances,
        particleCount: phase.particles,
      });
      
      resetMetrics();
      metricsBufferRef.current = [];
      startTimeRef.current = Date.now();
      
      const collectionInterval = setInterval(collectMetrics, 100);
      
      await new Promise(resolve => {
        timerRef.current = setTimeout(() => {
          clearInterval(collectionInterval);
          elapsed += phase.duration;
          setProgress((elapsed / totalDuration) * 100);
          resolve(null);
        }, phase.duration);
      });
    }
    
    stopBenchmark();
  }, [settings, onSettingsChange, resetMetrics, collectMetrics, stopBenchmark]);

  const runStressTest = useCallback(async () => {
    setIsRunning(true);
    setMode('stress-test');
    setResults([]);
    
    const presetKeys = Object.keys(PRESETS);
    const testDuration = 5000;
    
    for (let i = 0; i < presetKeys.length; i++) {
      const presetKey = presetKeys[i];
      const presetSettings = { ...PRESETS[presetKey], scene: settings.scene };
      
      setCurrentPhase(`Testing ${presetKey.toUpperCase()}`);
      setProgress(((i + 1) / presetKeys.length) * 100);
      
      onSettingsChange(presetSettings);
      resetMetrics();
      metricsBufferRef.current = [];
      startTimeRef.current = Date.now();
      
      const collectionInterval = setInterval(collectMetrics, 100);
      
      await new Promise(resolve => {
        timerRef.current = setTimeout(() => {
          clearInterval(collectionInterval);
          
          const result = calculateResults(presetKey, presetSettings);
          setResults(prev => [...prev, result]);
          
          resolve(null);
        }, testDuration);
      });
    }
    
    stopBenchmark();
  }, [onSettingsChange, resetMetrics, collectMetrics, calculateResults, stopBenchmark]);

  const runFixedPreset = useCallback(async (presetKey: keyof typeof PRESETS, duration: number = 10000) => {
    setIsRunning(true);
    setMode('fixed-preset');
    setResults([]);
    
    const presetSettings = { ...PRESETS[presetKey], scene: settings.scene };
    setCurrentPhase(`Running ${presetKey.toUpperCase()} preset`);
    
    onSettingsChange(presetSettings);
    resetMetrics();
    metricsBufferRef.current = [];
    startTimeRef.current = Date.now();
    
    const collectionInterval = setInterval(collectMetrics, 100);
    
    await new Promise(resolve => {
      timerRef.current = setTimeout(() => {
        clearInterval(collectionInterval);
        
        const result = calculateResults(presetKey, presetSettings);
        setResults([result]);
        setProgress(100);
        
        resolve(null);
      }, duration);
    });
    
    stopBenchmark();
  }, [onSettingsChange, resetMetrics, collectMetrics, calculateResults, stopBenchmark]);

  return {
    isRunning,
    mode,
    results,
    progress,
    currentPhase,
    runAutoRamp,
    runStressTest,
    runFixedPreset,
    stopBenchmark,
  };
}

'use client';

import { useState } from 'react';
import WebGLCanvas from '@/components/WebGLCanvas';
import ControlPanel, { type BenchmarkSettings } from '@/components/ControlPanel';
import MetricsDisplay from '@/components/MetricsDisplay';
import BenchmarkResults from '@/components/BenchmarkResults';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { useBenchmarkRunner } from '@/hooks/useBenchmarkRunner';

export default function BenchmarkApp() {
  const { metrics, resetMetrics } = usePerformanceMetrics();
  const [settings, setSettings] = useState<BenchmarkSettings>({
    scene: 'earth',
    resolution: 1.0,
    instanceCount: 5000,
    particleCount: 10000,
    bloom: true,
    dof: false,
    shaders: true,
  });

  const benchmarkRunner = useBenchmarkRunner({
    settings,
    onSettingsChange: setSettings,
    currentFps: metrics.fps,
    resetMetrics,
  });
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <WebGLCanvas settings={settings} />
      <ControlPanel
        settings={settings}
        onChange={setSettings}
        benchmarkRunner={benchmarkRunner}
      />
      <MetricsDisplay
        metrics={metrics}
        isRunning={benchmarkRunner.isRunning}
        currentPhase={benchmarkRunner.currentPhase}
        progress={benchmarkRunner.progress}
      />
      {benchmarkRunner.results.length > 0 && (
        <BenchmarkResults results={benchmarkRunner.results} />
      )}
    </div>
  );
}

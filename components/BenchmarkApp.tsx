'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import WebGLCanvas from '@/components/WebGLCanvas';
import ControlPanel, { type BenchmarkSettings, type SceneType } from '@/components/ControlPanel';
import MetricsDisplay from '@/components/MetricsDisplay';
import BenchmarkResults from '@/components/BenchmarkResults';
import ErrorBoundary from '@/components/ErrorBoundary';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { useBenchmarkRunner } from '@/hooks/useBenchmarkRunner';

const SCENE_ROUTES: Record<string, SceneType> = {
  '/': 'earth',
  '/earth': 'earth',
  '/minecraft': 'minecraft',
  '/space': 'solar-system',
  '/starwars': 'star-wars-credits',
  '/trippy': 'trippy',
  '/rave': 'rave',
};

const SCENE_TO_ROUTE: Record<SceneType, string> = {
  'earth': '/earth',
  'minecraft': '/minecraft',
  'solar-system': '/space',
  'star-wars-credits': '/starwars',
  'trippy': '/trippy',
  'rave': '/rave',
};

export default function BenchmarkApp() {
  const router = useRouter();
  const pathname = usePathname();
  const { metrics, resetMetrics } = usePerformanceMetrics();
  
  const getInitialScene = (): SceneType => {
    return SCENE_ROUTES[pathname] || 'earth';
  };
  
  const [settings, setSettings] = useState<BenchmarkSettings>({
    scene: getInitialScene(),
    resolution: 1.0,
    instanceCount: 5000,
    particleCount: 10000,
    bloom: true,
    dof: false,
    shaders: true,
  });
  
  useEffect(() => {
    const sceneFromPath = SCENE_ROUTES[pathname];
    if (sceneFromPath && sceneFromPath !== settings.scene) {
      setSettings(prev => ({ ...prev, scene: sceneFromPath }));
    }
  }, [pathname]);
  
  const handleSettingsChange = (newSettings: BenchmarkSettings) => {
    setSettings(newSettings);
    
    if (newSettings.scene !== settings.scene) {
      const newRoute = SCENE_TO_ROUTE[newSettings.scene];
      if (newRoute && newRoute !== pathname) {
        router.push(newRoute);
      }
    }
  };

  const benchmarkRunner = useBenchmarkRunner({
    settings,
    onSettingsChange: handleSettingsChange,
    currentFps: metrics.fps,
    resetMetrics,
  });
  
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <WebGLCanvas settings={settings} />
        <ControlPanel
          settings={settings}
          onChange={handleSettingsChange}
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
    </ErrorBoundary>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import WebGLCanvas from '@/components/WebGLCanvas';
import ControlPanel, { type BenchmarkSettings, type SceneType } from '@/components/ControlPanel';
import MetricsDisplay from '@/components/MetricsDisplay';
import BenchmarkResults from '@/components/BenchmarkResults';
import ErrorBoundary from '@/components/ErrorBoundary';
import SceneControls, { type RaveSceneParams } from '@/components/SceneControls';
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

// Automatically derive the reverse mapping (excluding '/' since it's an alias)
const SCENE_TO_ROUTE = Object.entries(SCENE_ROUTES)
  .filter(([path]) => path !== '/')
  .reduce((acc, [path, scene]) => ({ ...acc, [scene]: path }), {} as Record<SceneType, string>);

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
  
  const [raveParams, setRaveParams] = useState<RaveSceneParams>({
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
  });
  
  const updateRaveSceneCallbackRef = useRef<((params: RaveSceneParams) => void) | null>(null);
  const [forceRerender, setForceRerender] = useState(0);
  
  useEffect(() => {
    const sceneFromPath = SCENE_ROUTES[pathname];
    if (sceneFromPath && sceneFromPath !== settings.scene) {
      setSettings(prev => ({ ...prev, scene: sceneFromPath }));
    }
  }, [pathname]);
  
  useEffect(() => {
    if (updateRaveSceneCallbackRef.current && settings.scene === 'rave') {
      updateRaveSceneCallbackRef.current(raveParams);
    }
  }, [raveParams, settings.scene]);
  
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
  
  const handleRaveParamsChange = (params: RaveSceneParams) => {
    setRaveParams(params);
  };
  
  const handleForceRerender = () => {
    setForceRerender(prev => prev + 1);
  };
  
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <WebGLCanvas 
          settings={settings} 
          onRaveSceneReady={(cb) => { updateRaveSceneCallbackRef.current = cb; }}
          forceRerenderKey={forceRerender}
        />
        <ControlPanel
          settings={settings}
          onChange={handleSettingsChange}
          benchmarkRunner={benchmarkRunner}
        />
        <SceneControls
          scene={settings.scene}
          raveParams={raveParams}
          onParamsChange={handleRaveParamsChange}
          onForceRerender={handleForceRerender}
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

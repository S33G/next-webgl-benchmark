'use client';

import { useState, useEffect } from 'react';
import type { BenchmarkMode } from '@/hooks/useBenchmarkRunner';

export type SceneType = 'trippy' | 'solar-system' | 'earth' | 'star-wars-credits' | 'minecraft';

export interface BenchmarkSettings {
  scene: SceneType;
  resolution: number;
  instanceCount: number;
  particleCount: number;
  bloom: boolean;
  dof: boolean;
  shaders: boolean;
}

interface BenchmarkRunnerState {
  isRunning: boolean;
  mode: BenchmarkMode;
  progress: number;
  currentPhase: string;
  runAutoRamp: () => void;
  runStressTest: () => void;
  runFixedPreset: (preset: 'low' | 'medium' | 'high' | 'ultra', duration?: number) => void;
  stopBenchmark: () => void;
}

interface ControlPanelProps {
  settings: BenchmarkSettings;
  onChange: (settings: BenchmarkSettings) => void;
  benchmarkRunner: BenchmarkRunnerState;
}

export default function ControlPanel({ settings, onChange, benchmarkRunner }: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'auto-ramp' | 'stress-test' | 'fixed-preset'>('stress-test');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const presets = {
    low: {
      scene: settings.scene,
      resolution: 0.5,
      instanceCount: 1000,
      particleCount: 2000,
      bloom: false,
      dof: false,
      shaders: false,
    },
    medium: {
      scene: settings.scene,
      resolution: 0.75,
      instanceCount: 3000,
      particleCount: 5000,
      bloom: true,
      dof: false,
      shaders: true,
    },
    high: {
      scene: settings.scene,
      resolution: 1.0,
      instanceCount: 5000,
      particleCount: 10000,
      bloom: true,
      dof: false,
      shaders: true,
    },
    ultra: {
      scene: settings.scene,
      resolution: 1.0,
      instanceCount: 8000,
      particleCount: 15000,
      bloom: true,
      dof: true,
      shaders: true,
    },
  };
  
  const applyPreset = (preset: keyof typeof presets) => {
    onChange(presets[preset]);
  };

  const handleRunBenchmark = () => {
    if (benchmarkRunner.isRunning) {
      benchmarkRunner.stopBenchmark();
      return;
    }

    switch (selectedMode) {
      case 'auto-ramp':
        benchmarkRunner.runAutoRamp();
        break;
      case 'stress-test':
        benchmarkRunner.runStressTest();
        break;
      case 'fixed-preset':
        benchmarkRunner.runFixedPreset('high', 10000);
        break;
    }
  };
  
  if (collapsed) {
    return (
      <div 
        style={{
          ...styles.collapsedPanel,
          ...(isMobile ? styles.collapsedPanelMobile : {}),
        }} 
        onClick={() => setCollapsed(false)}
      >
        <div style={styles.collapsedText}>▶ Controls</div>
      </div>
    );
  }
  
  return (
    <div style={{
      ...styles.panel,
      ...(isMobile ? styles.panelMobile : {}),
    }}>
      <div style={styles.header}>
        <span style={styles.title}>Benchmark Controls</span>
        <button 
          style={{
            ...styles.collapseBtn,
            ...(isMobile ? styles.collapseBtnMobile : {}),
          }} 
          onClick={() => setCollapsed(true)}
        >−</button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Scene</div>
        <select
          value={settings.scene}
          onChange={(e) => onChange({ ...settings, scene: e.target.value as SceneType })}
          style={styles.select}
          disabled={benchmarkRunner.isRunning}
        >
          <option value="trippy">Trippy</option>
          <option value="solar-system">Solar System</option>
          <option value="earth">Earth</option>
          <option value="star-wars-credits">Star Wars Credits</option>
          <option value="minecraft">Minecraft World (Heavy)</option>
        </select>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Benchmark Mode</div>
        <div style={styles.modeGrid}>
          <button
            style={{
              ...styles.modeBtn,
              ...(selectedMode === 'stress-test' ? styles.modeBtnActive : {}),
            }}
            onClick={() => setSelectedMode('stress-test')}
            disabled={benchmarkRunner.isRunning}
          >
            Stress Test
          </button>
          <button
            style={{
              ...styles.modeBtn,
              ...(selectedMode === 'auto-ramp' ? styles.modeBtnActive : {}),
            }}
            onClick={() => setSelectedMode('auto-ramp')}
            disabled={benchmarkRunner.isRunning}
          >
            Auto Ramp
          </button>
          <button
            style={{
              ...styles.modeBtn,
              ...(selectedMode === 'fixed-preset' ? styles.modeBtnActive : {}),
            }}
            onClick={() => setSelectedMode('fixed-preset')}
            disabled={benchmarkRunner.isRunning}
          >
            Fixed Preset
          </button>
        </div>
        <div style={styles.modeDescription}>
          {selectedMode === 'stress-test' && 'Runs all presets sequentially and collects results'}
          {selectedMode === 'auto-ramp' && 'Gradually increases load to find breaking point'}
          {selectedMode === 'fixed-preset' && 'Runs current settings for 10 seconds'}
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Quality Presets</div>
        <div style={styles.presetGrid}>
          {(['low', 'medium', 'high', 'ultra'] as const).map(preset => (
            <button
              key={preset}
              style={styles.presetBtn}
              onClick={() => applyPreset(preset)}
              disabled={benchmarkRunner.isRunning}
            >
              {preset.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Resolution Scale</div>
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.25"
          value={settings.resolution}
          onChange={(e) => onChange({ ...settings, resolution: parseFloat(e.target.value) })}
          style={styles.slider}
          disabled={benchmarkRunner.isRunning}
        />
        <div style={styles.value}>{(settings.resolution * 100).toFixed(0)}%</div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Instance Count</div>
        <input
          type="range"
          min="0"
          max="10000"
          step="1000"
          value={settings.instanceCount}
          onChange={(e) => onChange({ ...settings, instanceCount: parseInt(e.target.value) })}
          style={styles.slider}
          disabled={benchmarkRunner.isRunning}
        />
        <div style={styles.value}>{settings.instanceCount.toLocaleString()}</div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Particle Count</div>
        <input
          type="range"
          min="0"
          max="20000"
          step="1000"
          value={settings.particleCount}
          onChange={(e) => onChange({ ...settings, particleCount: parseInt(e.target.value) })}
          style={styles.slider}
          disabled={benchmarkRunner.isRunning}
        />
        <div style={styles.value}>{settings.particleCount.toLocaleString()}</div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Effects</div>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.bloom}
            onChange={(e) => onChange({ ...settings, bloom: e.target.checked })}
            disabled={benchmarkRunner.isRunning}
          />
          <span>Bloom</span>
        </label>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.dof}
            onChange={(e) => onChange({ ...settings, dof: e.target.checked })}
            disabled={benchmarkRunner.isRunning}
          />
          <span>Depth of Field</span>
        </label>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.shaders}
            onChange={(e) => onChange({ ...settings, shaders: e.target.checked })}
            disabled={benchmarkRunner.isRunning}
          />
          <span>Custom Shaders</span>
        </label>
      </div>
      
      <button
        style={{
          ...styles.benchmarkBtn,
          ...(benchmarkRunner.isRunning ? styles.benchmarkBtnRunning : {}),
        }}
        onClick={handleRunBenchmark}
      >
        {benchmarkRunner.isRunning ? 'Stop Benchmark' : 'Run Benchmark'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '280px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    background: 'rgba(10, 10, 15, 0.95)',
    border: '1px solid rgba(100, 100, 150, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
  },
  collapsedPanel: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(10, 10, 15, 0.95)',
    border: '1px solid rgba(100, 100, 150, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#e0e0e0',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
  },
  collapsedText: {
    fontSize: '14px',
    fontWeight: 600,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(100, 100, 150, 0.2)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  collapseBtn: {
    background: 'rgba(100, 100, 150, 0.2)',
    border: 'none',
    borderRadius: '4px',
    color: '#e0e0e0',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '1',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#a0a0b0',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  modeGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '8px',
  },
  modeBtn: {
    background: 'rgba(100, 100, 150, 0.15)',
    border: '1px solid rgba(100, 100, 150, 0.25)',
    borderRadius: '6px',
    color: '#e0e0e0',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  modeBtnActive: {
    background: 'rgba(99, 102, 241, 0.3)',
    border: '1px solid rgba(99, 102, 241, 0.5)',
    color: '#fff',
  },
  modeDescription: {
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  presetBtn: {
    background: 'rgba(100, 100, 150, 0.2)',
    border: '1px solid rgba(100, 100, 150, 0.3)',
    borderRadius: '6px',
    color: '#e0e0e0',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  slider: {
    width: '100%',
    marginBottom: '4px',
    accentColor: '#6366f1',
  },
  value: {
    textAlign: 'right',
    fontSize: '12px',
    color: '#a0a0b0',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  benchmarkBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
  },
  benchmarkBtnRunning: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
  },
  panelMobile: {
    top: '10px',
    right: '10px',
    left: '10px',
    width: 'auto',
    maxHeight: 'calc(100vh - 20px)',
  },
  collapsedPanelMobile: {
    top: '10px',
    right: '10px',
    left: 'auto',
  },
  collapseBtnMobile: {
    width: '32px',
    height: '32px',
  },
  select: {
    width: '100%',
    background: 'rgba(20, 20, 30, 0.8)',
    border: '1px solid rgba(100, 100, 150, 0.3)',
    borderRadius: '6px',
    color: '#e0e0e0',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    cursor: 'pointer',
    outline: 'none',
  },
};

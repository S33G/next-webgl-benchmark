'use client';

import { useState } from 'react';
import type { SceneType } from './ControlPanel';

export interface RaveSceneParams {
  octagonCount: number;
  bassBoost: number;
  colorSpeed: number;
  rotationSpeed: number;
  scale: number;
  zoom: number;
  audioSource: 'microphone' | 'file';
  audioFile: File | null;
  showParticles: boolean;
  showParticleTrails: boolean;
  showGlow: boolean;
  showShadows: boolean;
  showConnectionLines: boolean;
  showEchoRings: boolean;
}

interface SceneControlsProps {
  scene: SceneType;
  raveParams: RaveSceneParams;
  onParamsChange: (params: RaveSceneParams) => void;
  onForceRerender: () => void;
}

export default function SceneControls({ scene, raveParams, onParamsChange, onForceRerender }: SceneControlsProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (scene !== 'rave') {
    return null;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav')) {
      onParamsChange({ ...raveParams, audioFile: file, audioSource: 'file' as const });
    } else {
      alert('Please upload a valid MP3 or WAV file');
    }
  };

  const handleParamChange = (key: keyof RaveSceneParams, value: any) => {
    onParamsChange({ ...raveParams, [key]: value });
  };

  const styles = {
    container: {
      position: 'fixed' as const,
      top: '20px',
      right: collapsed ? '-280px' : '20px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      borderRadius: '12px',
      padding: collapsed ? '0' : '20px',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '13px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'right 0.3s ease, padding 0.3s ease',
    },
    collapseBtn: {
      position: 'absolute' as const,
      left: collapsed ? '-40px' : '10px',
      top: '10px',
      width: '30px',
      height: '30px',
      backgroundColor: 'rgba(102, 126, 234, 0.8)',
      border: 'none',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '18px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    title: {
      fontSize: '16px',
      fontWeight: 'bold' as const,
      marginBottom: '15px',
      color: '#667eea',
      textAlign: 'center' as const,
    },
    section: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      color: '#aaa',
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    input: {
      width: '100%',
      padding: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '13px',
      fontFamily: 'monospace',
    },
    fileInput: {
      width: '100%',
      padding: '8px',
      backgroundColor: 'rgba(102, 126, 234, 0.2)',
      border: '2px dashed rgba(102, 126, 234, 0.5)',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '12px',
      cursor: 'pointer',
    },
    rangeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    range: {
      flex: 1,
      height: '4px',
      borderRadius: '2px',
      outline: 'none',
      WebkitAppearance: 'none' as const,
    },
    rangeValue: {
      minWidth: '40px',
      textAlign: 'right' as const,
      color: '#667eea',
      fontWeight: 'bold' as const,
    },
    radioGroup: {
      display: 'flex',
      gap: '10px',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    radio: {
      cursor: 'pointer',
    },
    rerenderBtn: {
      width: '100%',
      padding: '10px',
      backgroundColor: 'rgba(234, 102, 102, 0.8)',
      border: 'none',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    },
    toggleContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginBottom: '15px',
    },
    toggleLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      fontSize: '11px',
      padding: '6px 8px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      transition: 'background-color 0.2s ease',
    },
    checkbox: {
      cursor: 'pointer',
      accentColor: '#667eea',
    },
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.collapseBtn}
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 1)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.8)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {collapsed ? '◀' : '▶'}
      </button>

      {!collapsed && (
        <>
          <div style={styles.title}>🎵 Rave Scene Controls</div>

          <div style={styles.section}>
            <label style={styles.label}>Audio Source</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  style={styles.radio}
                  checked={raveParams.audioSource === 'microphone'}
                  onChange={() => handleParamChange('audioSource', 'microphone')}
                />
                Microphone
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  style={styles.radio}
                  checked={raveParams.audioSource === 'file'}
                  onChange={() => handleParamChange('audioSource', 'file')}
                />
                File
              </label>
            </div>
          </div>

          {raveParams.audioSource === 'file' && (
            <div style={styles.section}>
              <label style={styles.label}>Upload Audio (MP3/WAV)</label>
              <input
                type="file"
                accept="audio/mpeg,audio/wav"
                onChange={handleFileUpload}
                style={styles.fileInput}
              />
              {raveParams.audioFile && (
                <div style={{ marginTop: '5px', fontSize: '11px', color: '#667eea' }}>
                  📁 {raveParams.audioFile.name}
                </div>
              )}
            </div>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Octagon Count</label>
            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="10"
                max="60"
                value={raveParams.octagonCount}
                onChange={(e) => handleParamChange('octagonCount', parseInt(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{raveParams.octagonCount}</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Bass Boost</label>
            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={raveParams.bassBoost}
                onChange={(e) => handleParamChange('bassBoost', parseFloat(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{raveParams.bassBoost.toFixed(1)}</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Color Speed</label>
            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0"
                max="0.001"
                step="0.00001"
                value={raveParams.colorSpeed}
                onChange={(e) => handleParamChange('colorSpeed', parseFloat(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{(raveParams.colorSpeed * 1000).toFixed(2)}</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Rotation Speed</label>
            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={raveParams.rotationSpeed}
                onChange={(e) => handleParamChange('rotationSpeed', parseFloat(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{raveParams.rotationSpeed.toFixed(1)}</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Octagon Scale</label>
            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={raveParams.scale}
                onChange={(e) => handleParamChange('scale', parseFloat(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{raveParams.scale.toFixed(1)}x</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Camera Zoom</label>
            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={raveParams.zoom}
                onChange={(e) => handleParamChange('zoom', parseFloat(e.target.value))}
                style={styles.range}
              />
              <span style={styles.rangeValue}>{(raveParams.zoom * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Visual Effects</label>
            <div style={styles.toggleContainer}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={raveParams.showGlow}
                  onChange={(e) => handleParamChange('showGlow', e.target.checked)}
                  style={styles.checkbox}
                />
                Glow
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={raveParams.showShadows}
                  onChange={(e) => handleParamChange('showShadows', e.target.checked)}
                  style={styles.checkbox}
                />
                Shadows
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={raveParams.showParticles}
                  onChange={(e) => handleParamChange('showParticles', e.target.checked)}
                  style={styles.checkbox}
                />
                Particles
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={raveParams.showParticleTrails}
                  onChange={(e) => handleParamChange('showParticleTrails', e.target.checked)}
                  style={styles.checkbox}
                />
                Trails
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={raveParams.showConnectionLines}
                  onChange={(e) => handleParamChange('showConnectionLines', e.target.checked)}
                  style={styles.checkbox}
                />
                Lines
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={raveParams.showEchoRings}
                  onChange={(e) => handleParamChange('showEchoRings', e.target.checked)}
                  style={styles.checkbox}
                />
                Echo Rings
              </label>
            </div>
          </div>

          <div style={styles.section}>
            <button
              style={styles.rerenderBtn}
              onClick={onForceRerender}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(234, 102, 102, 1)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(234, 102, 102, 0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🔄 Force Re-render
            </button>
          </div>
        </>
      )}
    </div>
  );
}

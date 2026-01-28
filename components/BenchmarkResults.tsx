'use client';

import { useState, useEffect } from 'react';
import type { BenchmarkResult } from '@/hooks/useBenchmarkRunner';

interface BenchmarkResultsProps {
  results: BenchmarkResult[];
}

export default function BenchmarkResults({ results }: BenchmarkResultsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (results.length === 0) return null;

  if (collapsed) {
    return (
      <div 
        style={{
          ...styles.collapsedPanel,
          ...(isMobile ? styles.collapsedPanelMobile : {}),
        }} 
        onClick={() => setCollapsed(false)}
      >
        <div style={styles.collapsedText}>▶ Results ({results.length})</div>
      </div>
    );
  }

  const getScoreColor = (fps: number) => {
    if (fps >= 55) return '#10b981';
    if (fps >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const getScore = (avgFps: number) => {
    if (avgFps >= 55) return 'Excellent';
    if (avgFps >= 45) return 'Good';
    if (avgFps >= 30) return 'Fair';
    return 'Poor';
  };

  return (
    <div style={{
      ...styles.panel,
      ...(isMobile ? styles.panelMobile : {}),
    }}>
      <div style={styles.header}>
        <span style={styles.title}>Benchmark Results</span>
        <button style={styles.collapseBtn} onClick={() => setCollapsed(true)}>−</button>
      </div>

      <div style={styles.resultsList}>
        {results.map((result, index) => (
          <div key={index} style={styles.resultCard}>
            <div
              style={styles.resultHeader}
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div style={styles.presetName}>{result.preset.toUpperCase()}</div>
              <div style={{ ...styles.scoreChip, background: getScoreColor(result.avgFps) }}>
                {getScore(result.avgFps)}
              </div>
            </div>

            <div style={styles.mainStats}>
              <div style={styles.mainStat}>
                <div style={styles.mainStatLabel}>Avg FPS</div>
                <div style={{ ...styles.mainStatValue, color: getScoreColor(result.avgFps) }}>
                  {result.avgFps.toFixed(1)}
                </div>
              </div>
              <div style={styles.mainStat}>
                <div style={styles.mainStatLabel}>Frame Time</div>
                <div style={styles.mainStatValue}>{result.avgFrameTime.toFixed(2)}ms</div>
              </div>
            </div>

            {expandedIndex === index && (
              <div style={styles.expandedDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Min FPS:</span>
                  <span style={styles.detailValue}>{result.minFps.toFixed(1)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Max FPS:</span>
                  <span style={styles.detailValue}>{result.maxFps.toFixed(1)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>1st Percentile:</span>
                  <span style={styles.detailValue}>{result.p1Fps.toFixed(1)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>99th Percentile:</span>
                  <span style={styles.detailValue}>{result.p99Fps.toFixed(1)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Duration:</span>
                  <span style={styles.detailValue}>{result.duration.toFixed(1)}s</span>
                </div>

                <div style={styles.settingsDivider}>Settings</div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Resolution:</span>
                  <span style={styles.detailValue}>{(result.settings.resolution * 100).toFixed(0)}%</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Instances:</span>
                  <span style={styles.detailValue}>{result.settings.instanceCount.toLocaleString()}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Particles:</span>
                  <span style={styles.detailValue}>{result.settings.particleCount.toLocaleString()}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Effects:</span>
                  <span style={styles.detailValue}>
                    {[
                      result.settings.bloom && 'Bloom',
                      result.settings.dof && 'DOF',
                      result.settings.shaders && 'Shaders',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button style={styles.exportBtn} onClick={() => {
        const data = JSON.stringify(results, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `benchmark-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }}>
        Export Results
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '320px',
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
    left: '20px',
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
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '12px',
  },
  resultCard: {
    background: 'rgba(20, 20, 30, 0.8)',
    border: '1px solid rgba(100, 100, 150, 0.2)',
    borderRadius: '8px',
    padding: '12px',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    cursor: 'pointer',
  },
  presetName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
  },
  scoreChip: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
  },
  mainStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  mainStat: {
    textAlign: 'center',
  },
  mainStatLabel: {
    fontSize: '11px',
    color: '#a0a0b0',
    marginBottom: '4px',
  },
  mainStatValue: {
    fontSize: '20px',
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  expandedDetails: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(100, 100, 150, 0.2)',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '12px',
  },
  detailLabel: {
    color: '#a0a0b0',
  },
  detailValue: {
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  settingsDivider: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#a0a0b0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '12px',
    marginBottom: '8px',
  },
  exportBtn: {
    width: '100%',
    background: 'rgba(100, 100, 150, 0.2)',
    border: '1px solid rgba(100, 100, 150, 0.3)',
    borderRadius: '8px',
    color: '#e0e0e0',
    padding: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  panelMobile: {
    top: 'auto',
    bottom: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
    maxHeight: '40vh',
  },
  collapsedPanelMobile: {
    top: 'auto',
    bottom: '10px',
    left: '10px',
    right: 'auto',
  },
};

'use client';

import { useRef, useEffect, useState } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  min: number;
  max: number;
  p1: number;
  p99: number;
}

interface MetricsDisplayProps {
  metrics: PerformanceMetrics;
  isRunning?: boolean;
  currentPhase?: string;
  progress?: number;
}

export default function MetricsDisplay({ metrics, isRunning, currentPhase, progress }: MetricsDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (historyRef.current.length > 120) {
      historyRef.current.shift();
    }
    historyRef.current.push(metrics.fps);
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 240 * dpr;
    canvas.height = 80 * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, 240, 80);
    
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.fillRect(0, 0, 240, 80);
    
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const history = historyRef.current;
    const maxFps = Math.max(...history, 60);
    
    for (let i = 0; i < history.length; i++) {
      const x = (i / 120) * 240;
      const y = 80 - (history[i] / maxFps) * 80;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 80 - (60 / maxFps) * 80);
    ctx.lineTo(240, 80 - (60 / maxFps) * 80);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '10px monospace';
    ctx.fillText(`${maxFps.toFixed(0)} fps`, 5, 12);
    ctx.fillText('0 fps', 5, 75);
  }, [metrics]);
  
  const getColorForFps = (fps: number) => {
    if (fps >= 55) return '#10b981';
    if (fps >= 30) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div style={{
      ...styles.container,
      ...(isMobile ? styles.containerMobile : {}),
    }}>
      <div style={styles.header}>
        <span style={styles.title}>Performance Metrics</span>
        {isRunning && <div style={styles.recordingDot} />}
      </div>

      {currentPhase && (
        <div style={styles.phaseContainer}>
          <div style={styles.phaseLabel}>{currentPhase}</div>
          {progress !== undefined && progress > 0 && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
      
      <div style={styles.mainMetric}>
        <div style={{ ...styles.fpsValue, color: getColorForFps(metrics.fps) }}>
          {metrics.fps.toFixed(1)}
        </div>
        <div style={styles.fpsLabel}>FPS</div>
      </div>
      
      <div style={styles.secondaryMetric}>
        <span style={styles.metricLabel}>Frame Time:</span>
        <span style={styles.metricValue}>{metrics.frameTime.toFixed(2)} ms</span>
      </div>
      
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Min</div>
          <div style={styles.statValue}>{metrics.min.toFixed(1)}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>1%</div>
          <div style={styles.statValue}>{metrics.p1.toFixed(1)}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>99%</div>
          <div style={styles.statValue}>{metrics.p99.toFixed(1)}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Max</div>
          <div style={styles.statValue}>{metrics.max.toFixed(1)}</div>
        </div>
      </div>
      
      <div style={styles.graphContainer}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '260px',
    background: 'rgba(10, 10, 15, 0.95)',
    border: '1px solid rgba(100, 100, 150, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(100, 100, 150, 0.2)',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
  },
  recordingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ef4444',
    animation: 'pulse 2s infinite',
  },
  mainMetric: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  fpsValue: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: '1',
    fontFamily: 'monospace',
  },
  fpsLabel: {
    fontSize: '12px',
    color: '#a0a0b0',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  secondaryMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '8px',
    background: 'rgba(100, 100, 150, 0.1)',
    borderRadius: '6px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#a0a0b0',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  },
  statItem: {
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '10px',
    color: '#a0a0b0',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  graphContainer: {
    marginTop: '12px',
  },
  canvas: {
    width: '100%',
    height: '80px',
    borderRadius: '6px',
  },
  phaseContainer: {
    marginBottom: '12px',
    padding: '8px',
    background: 'rgba(99, 102, 241, 0.2)',
    borderRadius: '6px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  phaseLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '6px',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(100, 100, 150, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    transition: 'width 0.3s ease',
  },
  containerMobile: {
    bottom: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
  },
};

'use client';

import { useEffect, RefObject } from 'react';

export function useCanvasResize(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas);
    
    updateSize();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef]);
}

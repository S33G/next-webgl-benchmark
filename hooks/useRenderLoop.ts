'use client';

import { useEffect, useRef } from 'react';

export function useRenderLoop(callback: (time: number) => void) {
  const requestRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const animate = (time: number) => {
      callbackRef.current(time);
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
}

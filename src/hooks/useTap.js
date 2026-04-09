import { useRef } from 'react';

/**
 * useTap hook using a callback pattern.
 * Safely distinguishes between taps and drags (hysteresis).
 */
export const useTap = (callback, { maxDelay = 300, maxDistance = 10 } = {}) => {
  const state = useRef({ start: null, time: null });

  const handleStart = (clientX, clientY) => {
    state.current = { start: { x: clientX, y: clientY }, time: Date.now() };
  };

  const handleEnd = (clientX, clientY, event) => {
    if (!state.current.start) return;
    const dx = clientX - state.current.start.x;
    const dy = clientY - state.current.start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const time = Date.now() - state.current.time;

    if (dist <= maxDistance && time <= maxDelay) {
      if (callback) callback({ event, tap: true });
    }
    state.current = { start: null, time: null };
  };

  return {
    onMouseDown: (e) => handleStart(e.clientX, e.clientY),
    onMouseUp: (e) => handleEnd(e.clientX, e.clientY, e),
    onTouchStart: (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: (e) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e),
  };
};

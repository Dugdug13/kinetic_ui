import { useRef } from 'react';

/**
 * usePinch hook using a callback pattern.
 */
export const usePinch = (callback) => {
  const state = useRef({ dist: 0, origin: { x: 0, y: 0 }, active: false, offset: 1 });

  const getPinchData = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const origin = {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
    return { dist, origin };
  };

  const handleStart = (e) => {
    if (e.touches.length === 2) {
      const { dist, origin } = getPinchData(e.touches);
      state.current.dist = dist;
      state.current.origin = origin;
      state.current.active = true;
      if (callback) callback({ active: true, offset: state.current.offset, origin, first: true, last: false });
    }
  };

  const handleMove = (e) => {
    if (e.touches.length === 2 && state.current.active) {
      const { dist, origin } = getPinchData(e.touches);
      const scaleDelta = dist / state.current.dist;
      state.current.offset *= scaleDelta;
      state.current.dist = dist; // update for continuous delta
      
      if (callback) callback({ active: true, offset: state.current.offset, origin, first: false, last: false });
    }
  };

  const handleEnd = (e) => {
    if (e.touches.length < 2 && state.current.active) {
      state.current.active = false;
      if (callback) callback({ active: false, offset: state.current.offset, origin: state.current.origin, first: false, last: true });
    }
  };

  return { onTouchStart: handleStart, onTouchMove: handleMove, onTouchEnd: handleEnd };
};

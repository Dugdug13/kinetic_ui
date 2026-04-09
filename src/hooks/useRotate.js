import { useRef } from 'react';

/**
 * useRotate hook using a callback pattern.
 */
export const useRotate = (callback) => {
  const state = useRef({ angle: 0, active: false, offset: 0 });

  const getAngle = (touches) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleStart = (e) => {
    if (e.touches.length === 2) {
      state.current.angle = getAngle(e.touches);
      state.current.active = true;
      if (callback) callback({ active: true, offset: state.current.offset, first: true, last: false });
    }
  };

  const handleMove = (e) => {
    if (e.touches.length === 2 && state.current.active) {
      const currentAngle = getAngle(e.touches);
      let angleDelta = currentAngle - state.current.angle;
      
      // Handle wrapping
      if (angleDelta > 180) angleDelta -= 360;
      else if (angleDelta < -180) angleDelta += 360;

      state.current.offset += angleDelta;
      state.current.angle = currentAngle;

      if (callback) callback({ active: true, offset: state.current.offset, first: false, last: false });
    }
  };

  const handleEnd = (e) => {
    if (e.touches.length < 2 && state.current.active) {
      state.current.active = false;
      if (callback) callback({ active: false, offset: state.current.offset, first: false, last: true });
    }
  };

  return { onTouchStart: handleStart, onTouchMove: handleMove, onTouchEnd: handleEnd };
};

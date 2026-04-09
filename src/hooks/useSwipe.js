import { useCallback, useRef } from 'react';

/**
 * useSwipe hook using a callback pattern.
 * Detects swipe gestures with direction and velocity natively without React state.
 */
export const useSwipe = (callback, { threshold = 50, timeout = 500, velocityThreshold = 0.5 } = {}) => {
  const stateRef = useRef({
    start: null,
    timeStart: null,
    isSwiping: false
  });

  const handleStart = useCallback((clientX, clientY) => {
    stateRef.current = {
      start: { x: clientX, y: clientY },
      timeStart: Date.now(),
      isSwiping: true
    };
    
    if (callback) {
      callback({ active: true, direction: null, distance: {x: 0, y: 0}, velocity: 0, first: true, last: false });
    }
  }, [callback]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!stateRef.current.isSwiping || !callback) return;
    const distanceX = clientX - stateRef.current.start.x;
    const distanceY = clientY - stateRef.current.start.y;
    callback({ active: true, direction: null, distance: {x: distanceX, y: distanceY}, first: false, last: false });
  }, [callback]);

  const handleEnd = useCallback((clientX, clientY) => {
    const s = stateRef.current;
    if (!s.start || !s.timeStart) return;

    const distanceX = clientX - s.start.x;
    const distanceY = clientY - s.start.y;
    const deltaTime = Date.now() - s.timeStart;

    let direction = null;
    const velocityX = Math.abs(distanceX) / deltaTime;
    const velocityY = Math.abs(distanceY) / deltaTime;
    const overallVelocity = Math.sqrt(distanceX ** 2 + distanceY ** 2) / deltaTime;

    if (deltaTime < timeout || overallVelocity > velocityThreshold) {
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (Math.abs(distanceX) > threshold || velocityX > velocityThreshold) {
          direction = distanceX > 0 ? 'right' : 'left';
        }
      } else {
        if (Math.abs(distanceY) > threshold || velocityY > velocityThreshold) {
          direction = distanceY > 0 ? 'down' : 'up';
        }
      }
    }

    if (callback) {
      callback({
        active: false,
        first: false,
        last: true,
        direction,
        distance: { x: distanceX, y: distanceY },
        velocity: overallVelocity,
        time: deltaTime
      });
    }

    stateRef.current = { start: null, timeStart: null, isSwiping: false };
  }, [threshold, timeout, velocityThreshold, callback]);

  return {
    onTouchStart: (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: (e) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY),
    onMouseDown: (e) => handleStart(e.clientX, e.clientY),
    onMouseMove: (e) => handleMove(e.clientX, e.clientY),
    onMouseUp: (e) => handleEnd(e.clientX, e.clientY),
    onMouseLeave: (e) => handleEnd(e.clientX, e.clientY),
    style: { touchAction: 'none' }
  };
};

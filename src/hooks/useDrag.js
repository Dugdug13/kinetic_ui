import { useCallback, useRef } from 'react';

/**
 * Performant useDrag hook using a callback pattern.
 * Bypasses React state to avoid re-renders during high-frequency events.
 */
export const useDrag = (callback, { boundary = null } = {}) => {
  const stateRef = useRef({
    isDragging: false,
    start: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    movement: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastTime: 0,
    lastPos: { x: 0, y: 0 }
  });

  const handleStart = useCallback((clientX, clientY) => {
    stateRef.current.isDragging = true;
    stateRef.current.start = { x: clientX, y: clientY };
    stateRef.current.movement = { x: 0, y: 0 };
    stateRef.current.lastTime = Date.now();
    stateRef.current.lastPos = { x: clientX, y: clientY };
    stateRef.current.velocity = { x: 0, y: 0 };
    
    if (callback) {
      callback({
        active: true,
        first: true,
        last: false,
        offset: stateRef.current.offset,
        movement: stateRef.current.movement,
        velocity: stateRef.current.velocity,
      });
    }
  }, [callback]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!stateRef.current.isDragging) return;
    
    const s = stateRef.current;
    
    const deltaX = clientX - s.start.x;
    const deltaY = clientY - s.start.y;
    s.movement = { x: deltaX, y: deltaY };

    let newOffsetX = s.offset.x + deltaX;
    let newOffsetY = s.offset.y + deltaY;

    if (boundary) {
      if (boundary.left !== undefined) newOffsetX = Math.max(newOffsetX, boundary.left);
      if (boundary.right !== undefined) newOffsetX = Math.min(newOffsetX, boundary.right);
      if (boundary.top !== undefined) newOffsetY = Math.max(newOffsetY, boundary.top);
      if (boundary.bottom !== undefined) newOffsetY = Math.min(newOffsetY, boundary.bottom);
    }

    const now = Date.now();
    const timeDelta = now - s.lastTime;
    if (timeDelta > 0) {
      s.velocity = {
        x: (clientX - s.lastPos.x) / timeDelta,
        y: (clientY - s.lastPos.y) / timeDelta
      };
    }
    s.lastTime = now;
    s.lastPos = { x: clientX, y: clientY };

    if (callback) {
      callback({
        active: true,
        first: false,
        last: false,
        offset: { x: newOffsetX, y: newOffsetY },
        movement: s.movement,
        velocity: s.velocity,
      });
    }
  }, [callback, boundary]);

  const handleEnd = useCallback(() => {
    if (!stateRef.current.isDragging) return;
    stateRef.current.isDragging = false;
    
    let newOffsetX = stateRef.current.offset.x + stateRef.current.movement.x;
    let newOffsetY = stateRef.current.offset.y + stateRef.current.movement.y;
    
    if (boundary) {
      if (boundary.left !== undefined) newOffsetX = Math.max(newOffsetX, boundary.left);
      if (boundary.right !== undefined) newOffsetX = Math.min(newOffsetX, boundary.right);
      if (boundary.top !== undefined) newOffsetY = Math.max(newOffsetY, boundary.top);
      if (boundary.bottom !== undefined) newOffsetY = Math.min(newOffsetY, boundary.bottom);
    }

    stateRef.current.offset = { x: newOffsetX, y: newOffsetY };

    if (callback) {
      callback({
        active: false,
        first: false,
        last: true,
        offset: stateRef.current.offset,
        movement: stateRef.current.movement,
        velocity: stateRef.current.velocity,
      });
    }
  }, [callback, boundary]);

  return {
    onTouchStart: (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: handleEnd,
    onMouseDown: (e) => handleStart(e.clientX, e.clientY),
    onMouseMove: (e) => handleMove(e.clientX, e.clientY),
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
    style: { touchAction: 'none' }
  };
};

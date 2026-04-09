import { useRef } from 'react';

/**
 * useScroll hook using a callback pattern.
 * Provides continuous scroll tracking bypassing React state.
 */
export const useScroll = (callback, { threshold = 10 } = {}) => {
  const state = useRef({ offset: { x: 0, y: 0 }, active: false, timeout: null });

  const handleWheel = (e) => {
    if (!state.current.active && (Math.abs(e.deltaX) > threshold || Math.abs(e.deltaY) > threshold)) {
      state.current.active = true;
      if (callback) callback({ active: true, offset: state.current.offset, delta: {x: 0, y: 0}, first: true, last: false });
    }

    if (state.current.active) {
      state.current.offset.x += e.deltaX;
      state.current.offset.y += e.deltaY;
      
      if (callback) callback({ active: true, offset: state.current.offset, delta: {x: e.deltaX, y: e.deltaY}, first: false, last: false });

      if (state.current.timeout) clearTimeout(state.current.timeout);
      state.current.timeout = setTimeout(() => {
        state.current.active = false;
        if (callback) callback({ active: false, offset: state.current.offset, delta: {x: 0, y: 0}, first: false, last: true });
      }, 150);
    }
  };

  return { onWheel: handleWheel };
};

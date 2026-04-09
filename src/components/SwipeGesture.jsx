import React from 'react';
import { useSwipe } from '../hooks';

export const SwipeGesture = ({ onSwipeDirection, children, style, className }) => {
  const bind = useSwipe(({ last, direction }) => {
    if (last && direction && onSwipeDirection) {
      onSwipeDirection(direction);
    }
  }, { threshold: 50 });

  return (
    <div
      {...bind}
      className={className}
      style={{
        userSelect: 'none',
        position: 'relative',
        ...style
      }}
    >
      {children}
    </div>
  );
};

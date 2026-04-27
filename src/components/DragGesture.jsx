import React from 'react';
import { useDrag } from '../hooks';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const DragGesture = ({ children, boundary, style, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Use springs for smooth rubberbanding and movement
  const springX = useSpring(x, { stiffness: 400, damping: 25 });
  const springY = useSpring(y, { stiffness: 400, damping: 25 });
  
  const scale = useMotionValue(1);

  const bind = useDrag(({ active, offset }) => {
    x.set(offset.x);
    y.set(offset.y);
    scale.set(active ? 1.05 : 1);
  }, { boundary });

  return (
    <motion.div
      {...bind}
      style={{
        x: springX,
        y: springY,
        scale,
        userSelect: 'none',
        position: 'relative',
        cursor: 'grab',
        ...style
      }}
      whileTap={{ cursor: 'grabbing' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

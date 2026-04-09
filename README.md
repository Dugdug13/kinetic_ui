# Kinetic UI

Kinetic UI is an advanced, high-performance gesture library for React, inspired by libraries like `@use-gesture`. It fundamentally differs from basic gesture implementations by utilizing a high-speed callback architecture that completely bypasses React's render loop (`useState`) for continuous events, allowing for complex Framer Motion physics at a silky smooth 60fps.

It also uniquely includes pioneering features such as **Contactless MediaPipe Hand Tracking** as a standardized hook.

## Installation
```bash
npm install 
npm install framer-motion @mediapipe/tasks-vision
```

## The Architecture API

Instead of returning state variables that cause re-renders, every hook in Kinetic UI accepts a callback function and passes a highly detailed context object. 

### Basic Usage (`useDrag`)

```jsx
import { useDrag } from './hooks';
import { motion, useMotionValue } from 'framer-motion';

function DraggableObject() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const bind = useDrag(({ offset, active }) => {
    // These update directly in the DOM, skipping React's reconciliation!
    x.set(offset.x);
    y.set(offset.y);
  }, { 
    boundary: { left: -100, right: 100, top: -100, bottom: 100 } 
  });

  return <motion.div {...bind} style={{ x, y }} />;
}
```

## Available Hooks

### `useSwipe`
Detects rapid swipe gestures accurately using a dual threshold of distance and velocity over time. Prioritizes rapid flings natively.
```javascript
const bind = useSwipe(({ direction, velocity, last }) => {
    if (last) console.log(`Swiped ${direction} at ${velocity} px/ms`);
}, { threshold: 50 });
```

### `useDrag`
Tracks total offset distance over continuous draggings with boundary support. Returns `{ offset, movement, velocity, active, first, last }`.

### `useScroll`
Debounced and smooth wheel scrolling tracking.
```javascript
const bind = useScroll(({ offset, delta }) => {
    console.log("Scrolled smoothly down by:", delta.y);
});
```

### `usePinch` & `useRotate`
Advanced multi-touch manipulation. Bind them both to the same element to handle standard map/photo manipulation.

### `useTap`
Smart tap detection using hysteresis boundaries to tell the difference between an intended tap and a slightly wobbly drag.

### `useSensor`
Streams `DeviceOrientation` raw metrics. (Note: Most mobile browsers require `HTTPS` to utilize hardware sensors).

### 🚀 `useContactless` (MediaPipe Web)
A cutting-edge inclusion. Utilizing `MediaPipe`, this tracks the user's hand landmarks via webcam and maps their index finger into a coordinate plane to drive `framer-motion` UI elements without touching the screen.

Beyond raw coordinates, it has **built-in Semantic Gesture Recognition**. Have dirty hands while cooking and want to skip an ad? Just double-palm!

```javascript
const { start, stop, isReady } = useContactless((results) => {
    // 1. Raw Coordinates Mapping
    if (results.landmarks) {
       const fingerTipX = results.landmarks[0][8].x;
       // ... drive UI springs
    }

    // 2. Semantic Actions
    if (results.semanticGesture) {
        switch (results.semanticGesture) {
            case 'SWIPE_LEFT':
               console.log("Skipping to next slide...");
               break;
            case 'SWIPE_RIGHT':
               console.log("Going back...");
               break;
            case 'FIST':
               console.log("Grabbing/Pausing item");
               break;
            case 'OPEN_PALM':
               console.log("Hovering / Stopping");
               break;
            case 'DOUBLE_PALM':
               console.log("Ad Skipped / Confirmed Action!");
               break;
        }
    }
}, { swipeThreshold: 0.25 });
```

## Demos & "SecC" UI
The included `App.jsx` and `index.css` provide a stunning Glassmorphism Documentation Layout to immediately test the hooks. Run `npm run dev` to access the playground.

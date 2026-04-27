# Kinetic UI

Kinetic UI is an advanced, high-performance gesture library for React. It radically differs from basic gesture implementations by utilizing a high-speed callback architecture that completely bypasses React's render loop (`useState`) for continuous events, allowing for complex spring physics at a silky smooth 60fps utilizing the standard `motion` library.

It uniquely includes pioneering features such as **Contactless MediaPipe Hand Tracking** out of the box as a standardized hook.

## Installation

Install the library along with its peer dependencies:

```bash
npm install @deekshaaa/kinetic-ui
npm install motion @mediapipe/tasks-vision
```

> **Note:** The `motion` library is the modernized, upgraded version of what was previously known as `framer-motion`.

## The Architecture & API

Instead of returning state variables that cause UI-blocking re-renders, every hook in Kinetic UI accepts a callback function and passes a highly detailed context object. 

### Basic Usage (`useDrag`)

```jsx
import { useDrag } from '@deekshaaa/kinetic-ui';
import { motion, useMotionValue, useSpring } from 'motion/react';

function DraggableObject() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Elegant rubberbanding physics
  const springX = useSpring(x, { stiffness: 800, damping: 35 });
  const springY = useSpring(y, { stiffness: 800, damping: 35 });

  const bind = useDrag(({ offset, active }) => {
    // These update directly in the DOM, skipping React's reconciliation!
    x.set(offset.x);
    y.set(offset.y);
  });

  return <motion.div {...bind} style={{ x: springX, y: springY }} />;
}
```

## Available Hooks

### `useSwipe`
Detects rapid swipe gestures accurately using a dual threshold of distance and velocity over time. Prioritizes rapid flings natively over slow draws.
```javascript
const bind = useSwipe(({ direction, velocity, last }) => {
    if (last) console.log(`Swiped ${direction} at ${velocity} px/ms`);
}, { threshold: 50 });
```

### `useDrag`
Tracks total offset distance over continuous draggings. Enjoy full unconstrained freedom, or explicitly bound the gesture. Returns `{ offset, movement, velocity, active, first, last }`.

### `useScroll`
Debounced and smooth wheel scrolling tracking.
```javascript
const bind = useScroll(({ offset, delta }) => {
    console.log("Scrolled smoothly down by:", delta.y);
});
```

### `usePinch` & `useRotate`
Advanced multi-touch manipulation. Bind them both to the same element to handle standard map/photo manipulation effortlessly.

### `useTap`
Smart tap detection using hysteresis boundaries to tell the difference between an intended tap and a slightly wobbly drag.

### `useSensor`
Streams `DeviceOrientation` raw metrics. (Note: Apple and Modern Browsers require **HTTPS** to utilize device hardware sensors).

### 🚀 `useContactless` (MediaPipe Web)
A cutting-edge inclusion. Utilizing `MediaPipe`, this tracks the user's hand landmarks via webcam and maps their index finger into a coordinate plane to drive `motion` UI elements without touching the screen!

Beyond raw coordinates, it has **built-in Semantic Gesture Recognition**. 

**How to test swipes:** Move your wrist rapidly and horizontally across the screen view (at least 12% across the frame within 300ms) to trigger a swipe.

```javascript
import { useContactless } from '@deekshaaa/kinetic-ui';

const { start, stop, isReady } = useContactless((results) => {
    // 1. Raw Coordinates Mapping
    if (results.landmarks && results.landmarks.length > 0) {
       const fingerTipX = results.landmarks[0][8].x;
       // ... drive UI springs directly
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
            case 'PRANAM':
               // Namaste gesture recognition (Bringing two hands together)
               console.log("Greetings!");
               break;
        }
    }
});
```

## Demos
A complete interactive Glassmorphism playground showcasing every hook is provided in the library repository.

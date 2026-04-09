import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { useSwipe, useDrag, useTap, usePinch, useRotate, useSensor, useContactless, useScroll } from './hooks';

export default function App() {
  const [activeTab, setActiveTab] = useState('swipe');
  
  const tabs = [
    { id: 'swipe', name: 'useSwipe' },
    { id: 'drag', name: 'useDrag' },
    { id: 'scroll', name: 'useScroll' },
    { id: 'multitouch', name: 'Multi-Touch' },
    { id: 'sensor', name: 'useSensor' },
    { id: 'contactless', name: 'useContactless' }
  ];

  return (
    <div className="dark-theme">
      <div className="sidebar">
        <h1 className="logo">Kinetic <span className="text-blue">UI</span></h1>
        <p className="logo-sub">Advanced high-performance react gestures.</p>
        <nav className="nav-menu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
              {activeTab === tab.id && (
                <motion.div layoutId="active-indicator" className="active-indicator" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="demo-container"
          >
            {activeTab === 'swipe' && <SwipeDemo />}
            {activeTab === 'drag' && <DragDemo />}
            {activeTab === 'scroll' && <ScrollDemo />}
            {activeTab === 'multitouch' && <MultiTouchDemo />}
            {activeTab === 'sensor' && <SensorDemo />}
            {activeTab === 'contactless' && <ContactlessDemo />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Demos ---

const SwipeDemo = () => {
  const [lastSwipe, setLastSwipe] = useState('None');
  const [velocity, setVelocity] = useState(0);

  const bind = useSwipe(({ last, direction, velocity: v }) => {
    if (last && direction) {
      setLastSwipe(direction.toUpperCase());
      setVelocity(v);
    }
  }, { threshold: 50 });
  
  return (
    <div className="demo-panel">
      <h2>useSwipe</h2>
      <p>Detects direction and velocity instantly. Prioritizes rapid flings over slow draws.</p>
      <div className="status-flex">
        <div className="status-badge">Direction: <strong>{lastSwipe}</strong></div>
        <div className="status-badge">Velocity: <strong>{velocity.toFixed(2)} px/ms</strong></div>
      </div>

      <div {...bind} className="interactive-box flex-center" style={{cursor: 'pointer'}}>
        <span className="hint-text">Swipe here!</span>
      </div>

      <div className="code-box">
        {`const bind = useSwipe(({ direction, velocity, last }) => {
  if (last) console.log(direction);
}, { threshold: 50 });`}
      </div>
    </div>
  );
};

const DragDemo = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Elegant rubberbanding physics
  const springX = useSpring(x, { stiffness: 400, damping: 25 });
  const springY = useSpring(y, { stiffness: 400, damping: 25 });
  const scale = useMotionValue(1);

  const bind = useDrag(({ active, offset }) => {
    x.set(offset.x);
    y.set(offset.y);
    scale.set(active ? 1.1 : 1);
  }, { boundary: { left: -150, right: 150, top: -100, bottom: 100 } });

  return (
    <div className="demo-panel">
      <h2>useDrag</h2>
      <p>Bypasses React rendering entirely. Values flow via <code>useMotionValue</code> for perfect 60fps springs.</p>
      
      <div className="drag-container interactive-box" style={{ position: 'relative' }}>
        <motion.div 
          {...bind}
          style={{ 
            x: springX, y: springY, scale,
            width: '80px', height: '80px', 
            background: 'linear-gradient(135deg, #60a5fa, #2563eb)', 
            borderRadius: '50%', 
            boxShadow: '0 10px 30px rgba(37,99,235,0.5)', 
            position: 'absolute', cursor: 'grab'
          }}
          whileTap={{ cursor: 'grabbing' }}
        />
      </div>

      <div className="code-box">
        {`const bind = useDrag(({ offset, active }) => {
  x.set(offset.x);
  y.set(offset.y);
});

<motion.div {...bind} style={{ x: springX, y: springY }} />`}
      </div>
    </div>
  );
};

const ScrollDemo = () => {
  const [offset, setOffset] = useState(0);
  const scale = useMotionValue(1);

  const bind = useScroll(({ active, offset: off }) => {
    // UI update
    setOffset(off.y);
    // Smooth framer spring
    scale.set(active ? 1.05 : 1);
  });

  return (
    <div className="demo-panel">
      <h2>useScroll</h2>
      <p>Tracks wheel activity securely with debouncing.</p>
      <div className="status-badge">Scroll Y: <strong>{offset}px</strong></div>

      <motion.div {...bind} style={{ scale }} className="interactive-box flex-center">
        <span className="hint-text">Scroll over this area</span>
      </motion.div>
    </div>
  );
};

const MultiTouchDemo = () => {
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });
  const springRotate = useSpring(rotate, { stiffness: 300, damping: 30 });
  const [taps, setTaps] = useState(0);

  const pinchBind = usePinch(({ offset }) => scale.set(offset));
  const rotateBind = useRotate(({ offset }) => rotate.set(offset));
  const tapBind = useTap(({ tap }) => { if (tap) setTaps(t => t + 1); });

  const bind = {
    onTouchStart: (e) => { pinchBind.onTouchStart(e); rotateBind.onTouchStart(e); tapBind.onTouchStart(e); },
    onTouchMove: (e) => { pinchBind.onTouchMove(e); rotateBind.onTouchMove(e); },
    onTouchEnd: (e) => { pinchBind.onTouchEnd(e); rotateBind.onTouchEnd(e); tapBind.onTouchEnd(e); },
    onMouseDown: tapBind.onMouseDown,
    onMouseUp: tapBind.onMouseUp,
    style: { touchAction: 'none' }
  };

  return (
    <div className="demo-panel">
      <h2>Multi-Touch (Pinch & Rotate)</h2>
      <p>Compose multiple primitive hooks onto a single element seamlessly.</p>
      <div className="status-flex">
        <div className="status-badge">Taps: <strong>{taps}</strong></div>
      </div>

      <div {...bind} className="interactive-box flex-center mult-touch-box">
        <motion.div 
          style={{ scale: springScale, rotate: springRotate }}
          className="target-object"
        >
          Manipulate
        </motion.div>
      </div>
    </div>
  );
};

const SensorDemo = () => {
  const [data, setData] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const { requestPermission, permissionGranted } = useSensor((sensorData) => {
    setData({
      alpha: Math.round(sensorData.alpha),
      beta: Math.round(sensorData.beta),
      gamma: Math.round(sensorData.gamma)
    });
    rotateX.set(-sensorData.beta);
    rotateY.set(sensorData.gamma);
  });

  return (
    <div className="demo-panel">
      <h2>useSensor</h2>
      <p>Streams device orientation data natively. Note: Requires HTTPS on mobile.</p>
      
      {!permissionGranted ? (
        <button className="primary-btn" onClick={requestPermission}>Request Sensor Permission</button>
      ) : (
        <div className="sensor-grid">
          <div className="sensor-card">
            <span className="sensor-label">Alpha (Z)</span>
            <span className="sensor-value">{data.alpha}°</span>
          </div>
          <div className="sensor-card">
            <span className="sensor-label">Beta (X)</span>
            <span className="sensor-value">{data.beta}°</span>
          </div>
          <div className="sensor-card">
            <span className="sensor-label">Gamma (Y)</span>
            <span className="sensor-value">{data.gamma}°</span>
          </div>
        </div>
      )}

      {permissionGranted && (
        <div className="sensor-visual" style={{ perspective: '500px', marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <motion.div 
            style={{ 
              rotateX, 
              rotateY,
              width: '150px', height: '150px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(225,29,72,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' 
            }}
          >
            3D Tilt
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ContactlessDemo = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [debugText, setDebugText] = useState("Waiting for hands...");
  const [semanticAction, setSemanticAction] = useState(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const uiSpringX = useSpring(x, { stiffness: 400, damping: 25 });
  const uiSpringY = useSpring(y, { stiffness: 400, damping: 25 });

  const { start, stop, isReady } = useContactless((results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Listen for advanced gestures
    if (results.semanticGesture) {
       setSemanticAction(results.semanticGesture);
       setTimeout(() => setSemanticAction(null), 2000);
    }

    if (results.landmarks && results.landmarks.length > 0) {
      setDebugText("Hand detected!");
      
      const hand = results.landmarks[0];
      const indexFinger = hand[8]; // Index finger tip
      
      if (indexFinger) {
        x.set(-(indexFinger.x - 0.5) * 640);
        y.set((indexFinger.y - 0.5) * 480);
        
        canvasCtx.fillStyle = '#3b82f6';
        canvasCtx.beginPath();
        canvasCtx.arc(indexFinger.x * canvasRef.current.width, indexFinger.y * canvasRef.current.height, 10, 0, 2 * Math.PI);
        canvasCtx.fill();
      }

      for (const landmarks of results.landmarks) {
        for (const lm of landmarks) {
           canvasCtx.fillStyle = '#60a5fa';
           canvasCtx.beginPath();
           canvasCtx.arc(lm.x * canvasRef.current.width, lm.y * canvasRef.current.height, 3, 0, 2 * Math.PI);
           canvasCtx.fill();
        }
      }
    } else {
      setDebugText("No hands detected.");
    }
  });

  useEffect(() => {
    if (isReady && videoRef.current) {
        start(videoRef.current);
    }
    return () => stop();
  }, [isReady]);

  return (
    <div className="demo-panel">
      <h2>useContactless (MediaPipe)</h2>
      <p>Cooking with wet hands? Skip ads without touching the screen. Try opening your palm, making a fist, sweeping left/right quickly, or double-palming!</p>
      
      <div className="status-flex">
        {!isReady && <div className="status-badge pulse-red">Loading ML Model...</div>}
        {isReady && <div className="status-badge">{debugText}</div>}
        {semanticAction && (
           <div className="status-badge pulse-red" style={{ borderColor: '#10b981', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', animation: 'none' }}>
              🎯 {semanticAction} Triggered!
           </div>
        )}
      </div>
      
      <div className="interactive-box" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
        <video 
          ref={videoRef} 
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
          playsInline autoPlay muted 
        />
        <canvas 
          ref={canvasRef} 
          width={640} height={480} 
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1, pointerEvents: 'none', opacity: 0.4, transform: 'scaleX(-1)' }} 
        />
        <motion.div 
          style={{ x: uiSpringX, y: uiSpringY, position: 'absolute', zIndex: 10, width: '50px', height: '50px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '50%', boxShadow: '0 10px 20px rgba(29,78,216,0.4)', pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};
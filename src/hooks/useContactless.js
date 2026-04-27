import { useEffect, useRef, useCallback, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export const useContactless = (callback, { runningMode = 'VIDEO', numHands = 2, swipeThreshold = 0.15 } = {}) => {
  const recognizerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isRunning = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Advanced gesture tracker state
  const tracking = useRef({
    historyX: [],
    swipeAccumulator: 0,
    lastGestureName: '',
    lastOpenPalmTime: 0,
    cooldownEnd: 0,
    smoothedX: null
  });

  const initHandTracking = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: numHands
      });
      recognizerRef.current = recognizer;
      setIsReady(true);
    } catch (e) {
      console.error("Failed to initialize MediaPipe", e);
    }
  }, [numHands, runningMode]);

  useEffect(() => {
    initHandTracking();
    return () => stopCamera(); 
  }, [initHandTracking]);

  const startCamera = async (videoElement) => {
    videoRef.current = videoElement;
    if (!videoElement) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        predictWebcam();
      };
    } catch (e) {
      console.error("Error accessing camera", e);
    }
  };

  const stopCamera = () => {
    isRunning.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const processComplexGestures = (results) => {
    if (!results.landmarks || results.landmarks.length === 0) {
       tracking.current.historyX = [];
       tracking.current.swipeAccumulator = 0;
       tracking.current.lastGestureName = '';
       tracking.current.smoothedX = null;
       return null;
    }

    const now = Date.now();
    let semanticGesture = null;

    if (now > tracking.current.cooldownEnd) {
      
      // 1. Check for two-handed PRANAM pose (Namaste)
      if (results.landmarks.length === 2) {
          const hand1 = results.landmarks[0];
          const hand2 = results.landmarks[1];
          const indexDist = Math.hypot(hand1[8].x - hand2[8].x, hand1[8].y - hand2[8].y);
          const wristDist = Math.hypot(hand1[0].x - hand2[0].x, hand1[0].y - hand2[0].y);
          
          if (indexDist < 0.1 && wristDist < 0.15) {
              semanticGesture = 'PRANAM';
              tracking.current.cooldownEnd = now + 1500;
              return semanticGesture; 
          }
      }

      // 2. Single hand Gestures
      const gestureObj = results.gestures && results.gestures.length > 0 ? results.gestures[0][0] : null;
      const currentName = gestureObj ? gestureObj.categoryName : 'None';

      if (currentName !== tracking.current.lastGestureName) {
        if (currentName === 'Closed_Fist') {
          semanticGesture = 'FIST';
          tracking.current.cooldownEnd = now + 500; 
        } 
        else if (currentName === 'Open_Palm') {
           // Direct OPEN_PALM mapping (removed problematic double click behavior)
           semanticGesture = 'OPEN_PALM';
           tracking.current.cooldownEnd = now + 500;
        }
      }
      
      // 3. Simple & Robust Swipe Detection
      const rawX = results.landmarks[0][0].x; 
      
      tracking.current.historyX.push({ x: rawX, time: now });
      if (tracking.current.historyX.length > 15) tracking.current.historyX.shift();

      if (tracking.current.historyX.length >= 5 && !semanticGesture) {
         const old = tracking.current.historyX[0];
         const deltaX = rawX - old.x;
         const deltaTime = now - old.time;
         
         // If a quick movement occurs (under 300ms)
         if (deltaTime > 0 && deltaTime < 300) { 
             const velocity = Math.abs(deltaX);
             // If horizontally moved at least 12% of the frame
             if (velocity > 0.12) { 
                 // Assuming mirrored camera
                 semanticGesture = deltaX > 0 ? 'SWIPE_LEFT' : 'SWIPE_RIGHT'; 
                 tracking.current.historyX = [];
                 tracking.current.cooldownEnd = now + 1000;
             }
         }
      }

      tracking.current.lastGestureName = currentName;
    }

    return semanticGesture;
  };

  const predictWebcam = () => {
    if (!recognizerRef.current || !videoRef.current) return;
    
    isRunning.current = true;
    let lastVideoTime = -1;

    const tick = () => {
      if (!isRunning.current) return;
        
      if (videoRef.current.currentTime !== lastVideoTime) {
        lastVideoTime = videoRef.current.currentTime;
        try {
          const results = recognizerRef.current.recognizeForVideo(videoRef.current, performance.now());
          const semanticGesture = processComplexGestures(results);
          
          if (callback) {
             callback({ ...results, semanticGesture });
          }
        } catch (err) {
          console.error("Inference Error:", err);
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  };

  return { start: startCamera, stop: stopCamera, isReady };
};

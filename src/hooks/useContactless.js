import { useEffect, useRef, useCallback, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export const useContactless = (callback, { runningMode = 'VIDEO', numHands = 1, swipeThreshold = 0.12 } = {}) => {
  const recognizerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isRunning = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Advanced gesture tracker state
  const tracking = useRef({
    historyX: [],
    lastGestureName: '',
    lastOpenPalmTime: 0,
    cooldownEnd: 0
  });

  const initHandTracking = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      // We use GestureRecognizer instead of HandLandmarker for built-in shapes!
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
       tracking.current.lastGestureName = '';
       return null;
    }

    const now = Date.now();
    let semanticGesture = null;

    // Extract built-in mediapipe gesture name
    const gestureObj = results.gestures && results.gestures.length > 0 ? results.gestures[0][0] : null;
    const currentName = gestureObj ? gestureObj.categoryName : 'None';
    
    if (now > tracking.current.cooldownEnd) {
      if (currentName !== tracking.current.lastGestureName) {
        if (currentName === 'Closed_Fist') {
          semanticGesture = 'FIST';
          tracking.current.cooldownEnd = now + 400; 
        } 
        else if (currentName === 'Open_Palm') {
           if (now - tracking.current.lastOpenPalmTime < 800 && now - tracking.current.lastOpenPalmTime > 100) {
              semanticGesture = 'DOUBLE_PALM';
              tracking.current.lastOpenPalmTime = 0; 
              tracking.current.cooldownEnd = now + 1000;
           } else {
              semanticGesture = 'OPEN_PALM';
              tracking.current.lastOpenPalmTime = now;
              tracking.current.cooldownEnd = now + 400;
           }
        }
      }
      
      // Calculate manual swipe based on wrist X position
      const wristX = results.landmarks[0][0].x; 
      tracking.current.historyX.push({ x: wristX, time: now });
      tracking.current.historyX = tracking.current.historyX.filter(h => now - h.time < 500); 
      
      if (tracking.current.historyX.length > 2 && !semanticGesture) {
         const oldest = tracking.current.historyX[0];
         const deltaX = wristX - oldest.x; 
         
         // Camera translates normally - large jump across X plane -> SWIPE
         if (Math.abs(deltaX) > swipeThreshold) {
            semanticGesture = deltaX > 0 ? 'SWIPE_LEFT' : 'SWIPE_RIGHT'; // inverted mapping might occur down to mirror
            tracking.current.historyX = [];
            tracking.current.cooldownEnd = now + 1200; 
         }
      }
    }

    tracking.current.lastGestureName = currentName;
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
        // Use recognizeForVideo (distinct from detectForVideo in HandLandmarker)
        const results = recognizerRef.current.recognizeForVideo(videoRef.current, performance.now());
        const semanticGesture = processComplexGestures(results);
        
        if (callback) {
           callback({ ...results, semanticGesture });
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  };

  return { start: startCamera, stop: stopCamera, isReady };
};

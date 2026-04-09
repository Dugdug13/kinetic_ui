import { useState, useEffect } from 'react';

/**
 * useSensor hook using a callback pattern for high performance.
 */
export const useSensor = (callback) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setIsSupported(true);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
        } else {
          alert("Permission denied. Ensure you are on HTTPS.");
        }
      } catch (error) {
        console.error('Permission error. HTTPS is required.', error);
        alert("Sensor error. Note: Device Sensors usually require HTTPS on modern browsers.");
      }
    } else {
      // Non-iOS 13+ devices don't need explicit permission prompt, but still need HTTPS
      setPermissionGranted(true);
      
      // Give a tiny heads-up if it's HTTP and not localhost
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        alert("Warning: DeviceOrientation usually requires HTTPS. Sensors might fail on HTTP over Wi-Fi.");
      }
    }
  };

  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (e) => {
      if (e.alpha === null && e.beta === null && e.gamma === null) return;
      
      if (callback) {
        callback({
          alpha: e.alpha || 0,
          beta: e.beta || 0,
          gamma: e.gamma || 0
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [permissionGranted, callback]);

  return { requestPermission, permissionGranted, isSupported };
};

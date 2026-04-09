import React from 'react';
import { useScroll } from '../hooks';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export const ScrollGesture = ({ onTrigger }) => {
  const { bind, scrollState, thresholdState } = useScroll({ threshold: 150 });
  const { isTriggered, triggerDirection } = thresholdState;
  const { pullX, pullY, activeAxis, offsetX, offsetY } = scrollState;

  React.useEffect(() => {
    if (isTriggered && triggerDirection) {
      if (onTrigger) onTrigger(triggerDirection);
    }
  }, [isTriggered, triggerDirection, onTrigger]);

  const maxPull = Math.max(pullX, pullY);
  const activeDirX = offsetX > 0 ? 'right' : 'left';
  const activeDirY = offsetY > 0 ? 'down' : 'up';
  const currentDir = activeAxis === 'x' ? activeDirX : activeDirY;

  return (
    <div
      {...bind.onWheel ? { onWheel: bind.onWheel } : {}}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '60px 40px',
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        color: '#ffffff',
        textAlign: 'center',
        userSelect: 'none',
        margin: '20px 0',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), border 0.3s ease',
        border: `2px solid ${isTriggered ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
        transform: `scale(${isTriggered ? 1.02 : 1})`,
      }}
    >
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '300px', height: '300px',
        background: '#3b82f6', filter: 'blur(100px)',
        opacity: maxPull * 0.3 + (isTriggered ? 0.4 : 0),
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', transition: 'opacity 0.2s',
      }} />

      <ArrowIndicator dir="left" icon={<ArrowLeft/>} activeDir={currentDir} pull={pullX} triggered={isTriggered} />
      <ArrowIndicator dir="right" icon={<ArrowRight/>} activeDir={currentDir} pull={pullX} triggered={isTriggered} />
      <ArrowIndicator dir="up" icon={<ArrowUp/>} activeDir={currentDir} pull={pullY} triggered={isTriggered} />
      <ArrowIndicator dir="down" icon={<ArrowDown/>} activeDir={currentDir} pull={pullY} triggered={isTriggered} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '700' }}>Threshold Scroll</h3>
        <p style={{ margin: 0, color: '#a1a1aa' }}>Push past resistance to trigger</p>
        
        <div style={{ marginTop: '30px', height: '6px', width: '100%', maxWidth: '140px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', margin: '30px auto 0', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${maxPull * 100}%`,
            background: isTriggered ? '#60a5fa' : 'linear-gradient(90deg, #3b82f6 0%, #93c5fd 100%)',
            transition: isTriggered ? 'width 0.3s' : 'width 0.1s linear',
          }} />
        </div>
      </div>
    </div>
  );
};

const ArrowIndicator = ({ dir, icon, activeDir, pull, triggered }) => {
  const isActive = activeDir === dir;
  const currentPull = isActive || triggered ? pull : 0;
  
  const size = 30 + (currentPull * 25);
  const offset = -60 + (currentPull * 90); 
  
  const posStyles = {
    left: dir === 'left' ? `${offset}px` : 'auto',
    right: dir === 'right' ? `${offset}px` : 'auto',
    top: dir === 'up' ? `${offset}px` : (dir === 'left' || dir === 'right' ? '50%' : 'auto'),
    bottom: dir === 'down' ? `${offset}px` : 'auto',
    transform: (dir === 'left' || dir === 'right') ? 'translateY(-50%)' : 'translateX(-50%)',
    ...(dir === 'up' || dir === 'down' ? { left: '50%' } : {})
  };

  return (
    <div style={{
      ...posStyles, position: 'absolute',
      width: `${size}px`, height: `${size}px`,
      background: triggered ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)',
      border: `2px solid ${triggered ? '#ffffff' : 'rgba(96, 165, 250, 0.6)'}`,
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: triggered ? '#ffffff' : '#60a5fa',
      opacity: currentPull > 0.05 ? (triggered ? 1 : currentPull + 0.2) : 0,
      transition: triggered ? 'all 0.4s' : 'none',
      zIndex: 10
    }}>
      {React.cloneElement(icon, { size: 16 + (currentPull * 8) })}
    </div>
  );
};

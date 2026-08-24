import React, { useEffect, useRef } from 'react';

export const AppBackground = React.memo(function AppBackground({ 
  children, 
  centered = true 
}: { 
  children: React.ReactNode; 
  centered?: boolean; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number = 0;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;
    let isMouseMoving = false;

    const smoothUpdate = () => {
      if (!containerRef.current) return;
      
      // Gentle interpolation for liquid smoothness without jitter
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        currentX += dx * 0.15;
        currentY += dy * 0.15;
        containerRef.current.style.setProperty('--mouse-x', `${currentX.toFixed(1)}%`);
        containerRef.current.style.setProperty('--mouse-y', `${currentY.toFixed(1)}%`);
        animId = requestAnimationFrame(smoothUpdate);
      } else {
        isMouseMoving = false;
        animId = 0;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      targetX = Math.max(0, Math.min(100, (clientX / (innerWidth || 1)) * 100));
      targetY = Math.max(0, Math.min(100, (clientY / (innerHeight || 1)) * 100));

      if (!isMouseMoving) {
        isMouseMoving = true;
        animId = requestAnimationFrame(smoothUpdate);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative min-h-screen w-full bg-[#030712] text-slate-50 selection:bg-indigo-500/30 ${centered ? 'flex items-center justify-center' : ''}`}
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
    >
      {/* Zero-Overhead Hardware-Accelerated Static & Smooth Background Canvas */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        style={{ contain: 'strict', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
      >
        {/* Soft Grid via CSS mask */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)',
          }}
        />

        {/* High-Performance Radial Glow Layers (0 Gaussian blur shader passes on GPU) */}
        <div 
          className="absolute -top-32 -left-32 w-[600px] h-[600px] pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.18), rgba(79, 70, 229, 0.06) 45%, transparent 70%)',
            transform: 'translate3d(0,0,0)',
          }}
        />
        <div 
          className="absolute -bottom-32 -right-32 w-[650px] h-[650px] pointer-events-none opacity-35"
          style={{
            background: 'radial-gradient(circle at 60% 60%, rgba(139, 92, 246, 0.16), rgba(124, 58, 237, 0.05) 50%, transparent 70%)',
            transform: 'translate3d(0,0,0)',
          }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] pointer-events-none opacity-25"
          style={{
            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.12), transparent 65%)',
            transform: 'translate3d(0,0,0)',
          }}
        />

        {/* Dynamic Interactive Cursor Glow */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(550px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.14), transparent 60%)`,
            transform: 'translate3d(0,0,0)',
          }}
        />
      </div>
      
      {/* Content Container */}
      <div className={`relative z-10 w-full h-full ${centered ? 'flex flex-col items-center justify-center min-h-screen px-4 py-12' : ''}`}>
        <div className={centered ? 'w-full flex justify-center flex-col items-center' : 'w-full h-full'}>
          {children}
        </div>
      </div>
    </div>
  );
});


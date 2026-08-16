import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export const AppBackground = React.memo(function AppBackground({ 
  children, 
  centered = true 
}: { 
  children: React.ReactNode; 
  centered?: boolean; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 1000], [0, 100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -50]);

  useEffect(() => {
    let animId: number = 0;
    let latestX = 0.5;
    let latestY = 0.5;

    const updateCSSVars = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${(latestX * 100).toFixed(1)}%`);
        containerRef.current.style.setProperty('--mouse-y', `${(latestY * 100).toFixed(1)}%`);
      }
      animId = 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      latestX = Math.max(0, Math.min(1, (clientX - left) / (width || 1)));
      latestY = Math.max(0, Math.min(1, (clientY - top) / (height || 1)));

      if (!animId) {
        animId = requestAnimationFrame(updateCSSVars);
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
      {/* Optimized Hardware-Accelerated Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transform-gpu">
        
        {/* Soft Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none transform-gpu"
          style={{
            backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)',
          }}
        />

        {/* Aurora Gradient Layers with lightweight blurs & hardware acceleration */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full filter blur-[60px] transform-gpu pointer-events-none" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[-10%] right-[-5%] w-[45rem] h-[45rem] bg-violet-600/10 rounded-full filter blur-[60px] transform-gpu pointer-events-none" 
        />
        <div className="absolute top-[20%] right-[20%] w-[25rem] h-[25rem] bg-cyan-500/5 rounded-full filter blur-[50px] transform-gpu pointer-events-none" />

        {/* Dynamic Lighting following mouse via CSS variables */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none transform-gpu transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.12), transparent 50%)`
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


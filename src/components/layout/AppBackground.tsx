import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

export function AppBackground({ children, centered = true }: { children: React.ReactNode, centered?: boolean }) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  
  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mousePosition.x, springConfig);
  const smoothMouseY = useSpring(mousePosition.y, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = (clientX - left) / width;
      const y = (clientY - top) / height;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative min-h-screen w-full bg-[#030712] overflow-hidden text-slate-50 selection:bg-indigo-500/30 ${centered ? 'flex items-center justify-center' : ''}`}
    >
      {/* Premium Animated Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Soft Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />

        {/* Glowing Perspective Grid */}
        <div className="absolute inset-0 perspective-1000">
           <motion.div 
             className="absolute inset-0 opacity-[0.05]"
             style={{
               backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
               backgroundSize: '4rem 4rem',
               maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)',
               WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)',
               transform: 'rotateX(60deg) scale(2)',
               transformOrigin: 'top center'
             }}
             animate={{
               backgroundPosition: ['0px 0px', '0px 64px']
             }}
             transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
           />
        </div>

        {/* Aurora Gradient Layers */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" 
          transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] bg-violet-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" 
          transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
        />
        <div className="absolute top-[20%] right-[20%] w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[120px]" />

        {/* Dynamic Lighting following mouse */}
        <motion.div 
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background: useTransform(
              [smoothMouseX, smoothMouseY],
              ([x, y]: number[]) => `radial-gradient(800px circle at ${x * 100}% ${y * 100}%, rgba(99, 102, 241, 0.15), transparent 40%)`
            )
          }}
        />
      </div>
      
      {/* Content Container */}
      <div className={`relative z-10 w-full h-full ${centered ? 'flex flex-col items-center justify-center min-h-screen px-4 py-12' : ''}`}>
        <motion.div
          className={centered ? 'w-full flex justify-center flex-col items-center' : 'w-full h-full'}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

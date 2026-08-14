import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const dimensions = {
    sm: { width: 28, height: 28, text: "text-base" },
    md: { width: 36, height: 36, text: "text-lg" },
    lg: { width: 48, height: 48, text: "text-2xl" },
    xl: { width: 64, height: 64, text: "text-3xl" },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Stylized V Emblem with Orbit & Bar Charts */}
      <div 
        className="relative flex items-center justify-center shrink-0" 
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="vGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Orbiting ring */}
          <ellipse 
            cx="50" cy="55" rx="42" ry="16" 
            transform="rotate(-15 50 55)" 
            stroke="url(#vGrad)" 
            strokeWidth="3" 
            strokeDasharray="6 3"
            opacity="0.75"
          />

          {/* Orbit particle / electron */}
          <circle cx="82" cy="45" r="4" fill="#a855f7" filter="url(#glow)" />

          {/* Ascending bar charts inside the V */}
          <rect x="42" y="32" width="5" height="18" rx="1.5" fill="url(#barGrad)" opacity="0.9" />
          <rect x="50" y="26" width="5" height="24" rx="1.5" fill="url(#barGrad)" opacity="0.95" />
          <rect x="58" y="20" width="5" height="30" rx="1.5" fill="url(#barGrad)" />

          {/* Main 3D V shape path */}
          <path 
            d="M20 22L45 78C47 82 53 82 55 78L80 22H65L50 58L35 22H20Z" 
            fill="url(#vGrad)"
            filter="url(#glow)"
          />
          {/* Inner highlight for 3D depth */}
          <path 
            d="M25 24L46 72C48 76 52 76 54 72L75 24H63L50 54L37 24H25Z" 
            fill="#ffffff" 
            opacity="0.25"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-wider text-white ${dimensions.text} flex items-center`}>
            VIVEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">A</span>
          </div>
          {size !== "sm" && (
            <span className="text-[9px] font-bold tracking-[0.25em] text-slate-400 uppercase -mt-0.5">
              AI Decision Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
}

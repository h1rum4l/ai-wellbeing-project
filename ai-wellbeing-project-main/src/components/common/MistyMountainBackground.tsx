import React from 'react';

export const MistyMountainBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Base sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EBF5FB] via-[#F4F6F6] to-[#E8F8F5]" />

      {/* 2. Soft diffused morning sunlight / halo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-amber-100/40 via-emerald-100/25 to-transparent rounded-full blur-[110px]" />

      {/* 3. Distant Mountain Silhouette Layer 1 (Highest, soft misty blue-gray) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[65vh] opacity-45 min-w-[1200px]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 400"
        fill="none"
      >
        <path
          d="M0 240 L180 140 L340 210 L520 110 L700 190 L880 90 L1080 180 L1260 120 L1440 220 L1440 400 L0 400 Z"
          fill="url(#distMtnGrad)"
        />
        <defs>
          <linearGradient id="distMtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#E2E8F0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F1F5F9" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>

      {/* 4. Midground Mountain Silhouette Layer 2 (Soft eucalyptus / sage ridges) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[50vh] opacity-55 min-w-[1200px]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 340"
        fill="none"
      >
        <path
          d="M0 200 L140 120 L280 180 L460 90 L640 160 L820 100 L1020 170 L1200 110 L1360 160 L1440 140 L1440 340 L0 340 Z"
          fill="url(#midMtnGrad)"
        />
        <defs>
          <linearGradient id="midMtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A9DFBF" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#D5F5E3" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E8F8F5" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </svg>

      {/* 5. Foreground Forest / Bamboo Grove Rolling Slopes */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[32vh] opacity-65 min-w-[1200px]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 260"
        fill="none"
      >
        <path
          d="M0 160 Q 220 80 440 140 T 880 110 T 1320 130 Q 1400 140 1440 150 L1440 260 L0 260 Z"
          fill="url(#foreMtnGrad)"
        />
        <defs>
          <linearGradient id="foreMtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#82D2A5" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#A9DFBF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#F4F6F6" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* 6. Soft Drifting Mist Layers */}
      <div className="absolute bottom-16 left-0 right-0 h-48 bg-gradient-to-t from-[#F4F6F6] via-white/50 to-transparent blur-md opacity-80" />
      <div className="absolute bottom-32 -left-20 w-[600px] h-36 bg-white/40 rounded-full blur-3xl animate-fog-drift" />
      <div
        className="absolute bottom-44 -right-10 w-[700px] h-44 bg-white/35 rounded-full blur-3xl animate-fog-drift"
        style={{ animationDelay: '-8s' }}
      />

      {/* 7. Floating Eucalyptus / Bamboo Leaf Motifs */}
      <div className="absolute top-28 left-[12%] opacity-40 animate-gentle-float">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18 C 6 10, 16 6, 20 4 C 18 14, 12 18, 4 18 Z"
            fill="#A9DFBF"
            stroke="#52BE80"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      <div
        className="absolute top-64 right-[15%] opacity-35 animate-gentle-float"
        style={{ animationDelay: '-3s' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18 C 6 10, 16 6, 20 4 C 18 14, 12 18, 4 18 Z"
            fill="#D1EA27"
            stroke="#84CC16"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      <div
        className="absolute top-[45%] left-[6%] opacity-25 animate-gentle-float"
        style={{ animationDelay: '-4.5s' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18 C 6 10, 16 6, 20 4 C 18 14, 12 18, 4 18 Z"
            fill="#52BE80"
            stroke="#15803D"
            strokeWidth="0.8"
          />
        </svg>
      </div>
    </div>
  );
};

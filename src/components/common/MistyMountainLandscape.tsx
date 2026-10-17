import React from 'react';

export const MistyMountainLandscape: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. High-resolution Panoramic Misty Mountain & Eucalyptus Landscape Image Asset */}
      <img
        src="/misty-mountain-bg.svg"
        alt="Tranquil Misty Mountains Landscape"
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        style={{
          filter: 'contrast(1.02) saturate(1.05) brightness(1.02)',
        }}
      />

      {/* 2. Soft Ambient Sunlight Diffused Halo at Top */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-amber-50/40 via-emerald-100/20 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* 3. High Alpine Drifting Mist Layer */}
      <div className="absolute top-[26vh] left-0 right-0 h-44 bg-gradient-to-b from-white/40 via-white/20 to-transparent blur-3xl animate-fog-drift pointer-events-none" />

      {/* 4. Valley Floating Fog Ribbon across Midground */}
      <div
        className="absolute bottom-[28vh] -left-20 w-[125%] h-36 bg-gradient-to-t from-white/45 via-white/25 to-transparent blur-2xl animate-fog-drift pointer-events-none"
        style={{ animationDuration: '24s' }}
      />

      {/* 5. Subtle Lake Mist rising off the water */}
      <div className="absolute bottom-[18vh] left-0 right-0 h-28 bg-gradient-to-t from-white/35 via-white/15 to-transparent blur-xl pointer-events-none" />

      {/* 6. Floating Translucent Eucalyptus & Bamboo Leaves */}
      <div className="absolute top-[28%] left-[8%] opacity-60 animate-gentle-float">
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
        className="absolute top-[36%] left-[15%] opacity-45 animate-gentle-float"
        style={{ animationDelay: '-2.8s' }}
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
        className="absolute top-[32%] right-[10%] opacity-55 animate-gentle-float"
        style={{ animationDelay: '-4.2s' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18 C 6 10, 16 6, 20 4 C 18 14, 12 18, 4 18 Z"
            fill="#A9DFBF"
            stroke="#52BE80"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      <div
        className="absolute top-[42%] right-[16%] opacity-40 animate-gentle-float"
        style={{ animationDelay: '-1.5s' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18 C 6 10, 16 6, 20 4 C 18 14, 12 18, 4 18 Z"
            fill="#D5F5E3"
            stroke="#52BE80"
            strokeWidth="0.6"
          />
        </svg>
      </div>
    </div>
  );
};

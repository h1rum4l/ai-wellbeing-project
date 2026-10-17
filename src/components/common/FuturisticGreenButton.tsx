import React from 'react';

interface FuturisticGreenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'compact' | 'prominent';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
}

/**
 * Futuristic Multi-Shade Green Gradient Button
 * Inspired by Uiverse.io by dexter-st
 * Uses strictly deep emerald #052E16, forest green #14532D, jade #10B981,
 * neon green #22C55E, lime #A3E635, mint #BBF7D0, and bright mint #DCFCE7.
 * Zero blue or purple hues.
 */
export const FuturisticGreenButton: React.FC<FuturisticGreenButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  ariaLabel,
  disabled = false,
  type = 'button',
  ...rest
}) => {
  const isCompact = variant === 'compact';
  const isProminent = variant === 'prominent';

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`btn-dexter-green group relative inline-flex items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
        isProminent
          ? 'px-5 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base font-extrabold tracking-wide rounded-full shadow-lg hover:shadow-emerald-500/35'
          : isCompact
          ? 'px-3.5 py-1.5 text-xs font-bold rounded-full shadow-md'
          : 'px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      {...rest}
    >
      {/* 1. Rotating Conic-Gradient Multi-Shade Green Layer */}
      <span
        aria-hidden="true"
        className="btn-rotating-green-layer absolute -inset-[120%] w-[340%] h-[340%] pointer-events-none rounded-full"
        style={{
          background: `conic-gradient(
            from 0deg,
            #0E5E35 0deg,
            #15803D 35deg,
            #10B981 75deg,
            #22C55E 120deg,
            #4ADE80 160deg,
            #22C55E 205deg,
            #10B981 250deg,
            #15803D 295deg,
            #0E5E35 360deg
          )`,
          filter: 'saturate(1.15) brightness(1.08)',
        }}
      />

      {/* 2. Secondary Diffused Glow Ring */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-65 pointer-events-none transition-opacity duration-300 group-hover:opacity-95"
        style={{
          background: 'radial-gradient(ellipse at 50% 120%, rgba(74, 222, 128, 0.4) 0%, rgba(16, 185, 129, 0.3) 50%, rgba(14, 94, 53, 0.6) 100%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* 3. Pulsing Top Glass Highlight Reflection Beam */}
      <span
        aria-hidden="true"
        className="btn-glass-light-beam absolute top-0.5 left-2 right-2 h-2/5 rounded-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(220, 252, 231, 0.15) 100%)',
          filter: 'blur(1px)',
        }}
      />

      {/* 4. Delicate Green Specular Border Ring */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none border border-emerald-200/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] group-hover:border-white transition-colors"
      />

      {/* 5. Accessible High-Contrast Content Overlay */}
      <span className="relative z-10 flex items-center justify-center gap-2 text-white font-bold tracking-tight text-shadow-green transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
        {children}
      </span>
    </button>
  );
};

import React, { useState, useEffect, useRef } from 'react';

export type StressinaPose =
  | 'idle_float'
  | 'waving'
  | 'jumping'
  | 'running'
  | 'sitting'
  | 'relaxing'
  // Legacy alias compatibility
  | 'hero_zen'
  | 'analyzing'
  | 'sweeping'
  | 'safe_space'
  | 'celebration';

export type StressinaExpression =
  | 'happy'
  | 'excited'
  | 'calm'
  | 'surprised'
  | 'sad'
  | 'winking'
  | 'thinking'
  | 'blushing'
  // Legacy alias compatibility
  | 'listening'
  | 'empathetic';

interface StressinaPandaProps {
  pose?: StressinaPose;
  expression?: StressinaExpression;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showLotusPlatform?: boolean;
  showAura?: boolean;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  caption?: string;
  isSpeaking?: boolean;
  lookAtPointer?: boolean;
}

export const StressinaPanda: React.FC<StressinaPandaProps> = ({
  pose = 'idle_float',
  expression,
  size = 'md',
  showLotusPlatform = true,
  showAura = true,
  className = '',
  onClick,
  interactive = false,
  caption,
  isSpeaking = false,
  lookAtPointer = true,
}) => {
  // Eye tracking offsets relative to center
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize pose aliases
  const normalizedPose: StressinaPose =
    pose === 'hero_zen'
      ? 'idle_float'
      : pose === 'celebration'
      ? 'jumping'
      : pose === 'safe_space'
      ? 'sitting'
      : pose;

  // Derive default expression based on pose if not explicitly specified
  const activeExp: StressinaExpression =
    expression ||
    (normalizedPose === 'relaxing' || normalizedPose === 'sitting'
      ? 'calm'
      : normalizedPose === 'jumping' || normalizedPose === 'waving'
      ? 'excited'
      : normalizedPose === 'running'
      ? 'happy'
      : 'calm');

  // Determine pixel size
  const sizeMap = {
    xs: 40,
    sm: 64,
    md: 110,
    lg: 180,
    xl: 260,
    hero: 320,
  };

  const dim = sizeMap[size] || sizeMap.md;

  // Occasional natural blinking
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = 3500 + Math.random() * 3500;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 180);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Pointer eye-tracking
  useEffect(() => {
    if (!lookAtPointer || typeof window === 'undefined') return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.35; // Head center

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy) || 1;

      // Clamp pupil movement to a subtle natural maximum (4.5px)
      const maxOffset = 4.2;
      const strength = Math.min(dist / 250, 1) * maxOffset;
      const nx = (dx / dist) * strength;
      const ny = (dy / dist) * strength;

      setPupilOffset({ x: nx, y: ny });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [lookAtPointer]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        interactive
          ? 'cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95'
          : ''
      } ${className}`}
      style={{ width: dim, height: dim + (caption ? 24 : 0) }}
    >
      {/* Ambient Liquid Glass Aura / Glow */}
      {showAura && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
          style={{
            background:
              normalizedPose === 'relaxing' || activeExp === 'calm'
                ? 'radial-gradient(circle, rgba(169, 201, 187, 0.45) 0%, rgba(185, 220, 225, 0.3) 50%, transparent 75%)'
                : normalizedPose === 'jumping' || activeExp === 'excited'
                ? 'radial-gradient(circle, rgba(217, 233, 223, 0.55) 0%, rgba(169, 201, 187, 0.35) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(185, 220, 225, 0.4) 0%, rgba(217, 233, 223, 0.25) 50%, transparent 75%)',
            filter: 'blur(16px)',
            transform: 'scale(1.22)',
          }}
        />
      )}

      {/* SVG Character Canvas */}
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_24px_rgba(46,58,55,0.12)]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Official Warm White Panda Fur */}
          <linearGradient id="pandaWarmWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F7F8F4" />
            <stop offset="100%" stopColor="#E8ECE5" />
          </linearGradient>

          {/* Official Charcoal Panda Fur (#2E3A37) */}
          <linearGradient id="pandaCharcoalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3E4D4A" />
            <stop offset="45%" stopColor="#2E3A37" />
            <stop offset="100%" stopColor="#212C2A" />
          </linearGradient>

          {/* Official Soft Mint Collar & Emblem Gradient */}
          <linearGradient id="mintCollarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A9C9BB" />
            <stop offset="50%" stopColor="#D9E9DF" />
            <stop offset="100%" stopColor="#A9C9BB" />
          </linearGradient>

          {/* Glowing Emblem Heart / Leaf Radial */}
          <radialGradient id="emblemGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E9F7F0" />
            <stop offset="60%" stopColor="#A9C9BB" />
            <stop offset="100%" stopColor="#538A78" />
          </radialGradient>

          {/* Lotus Petal Gradient in Sage & Mint */}
          <linearGradient id="sageLotusPetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#D9E9DF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#A9C9BB" stopOpacity="0.75" />
          </linearGradient>

          {/* Platform Glow Filter */}
          <filter id="softGlowMint" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* -------------------- 1. PLATFORM / LOTUS (for Idle & Relaxing Poses) -------------------- */}
        {showLotusPlatform && (normalizedPose === 'idle_float' || normalizedPose === 'relaxing' || normalizedPose === 'sitting') && (
          <g id="lotus-platform">
            {/* Soft Ambient Blooming Petals */}
            <g id="lotus-back-petals" opacity="0.85">
              <path
                d="M 125 210 C 95 190, 65 165, 68 135 C 92 145, 125 180, 135 205 Z"
                fill="url(#sageLotusPetalGrad)"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="1.2"
              />
              <path
                d="M 175 210 C 205 190, 235 165, 232 135 C 208 145, 175 180, 165 205 Z"
                fill="url(#sageLotusPetalGrad)"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="1.2"
              />
              <path
                d="M 140 190 C 135 150, 142 120, 150 110 C 158 120, 165 150, 160 190 Z"
                fill="url(#sageLotusPetalGrad)"
                stroke="rgba(255, 255, 255, 0.95)"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <path
                d="M 115 225 C 80 215, 45 195, 42 170 C 68 178, 105 205, 120 220 Z"
                fill="url(#sageLotusPetalGrad)"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1"
              />
              <path
                d="M 185 225 C 220 215, 255 195, 258 170 C 232 178, 195 205, 180 220 Z"
                fill="url(#sageLotusPetalGrad)"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1"
              />
            </g>

            {/* Frosted Glass Pedestal Cylinder */}
            <path
              d="M 42 260 L 42 270 C 42 284, 258 284, 258 270 L 258 260 Z"
              fill="rgba(240, 242, 235, 0.45)"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1"
            />
            <ellipse
              cx="150"
              cy="260"
              rx="108"
              ry="24"
              fill="rgba(255, 255, 255, 0.55)"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="1.5"
            />

            {/* Upper Tier Cylinder */}
            <path
              d="M 65 248 L 65 256 C 65 268, 235 268, 235 256 L 235 248 Z"
              fill="rgba(240, 242, 235, 0.55)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="1"
            />
            <ellipse
              cx="150"
              cy="248"
              rx="85"
              ry="18"
              fill="rgba(255, 255, 255, 0.7)"
              stroke="rgba(255, 255, 255, 1)"
              strokeWidth="1.8"
            />

            {/* Soft Mint Glowing Ring on Pedestal Top */}
            <ellipse
              cx="150"
              cy="248"
              rx="74"
              ry="14"
              fill="rgba(169, 201, 187, 0.28)"
              stroke="rgba(169, 201, 187, 0.8)"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* -------------------- 2. PANDA BODY & LEGS -------------------- */}
        {normalizedPose === 'jumping' ? (
          /* Joyful leaping body with arms up and feet floating */
          <g id="body-jumping">
            <ellipse cx="150" cy="182" rx="66" ry="58" fill="url(#pandaWarmWhiteGrad)" />
            <ellipse cx="150" cy="180" rx="44" ry="38" fill="#FFFFFF" />

            {/* Feet tucked joyfully in mid-air */}
            <ellipse cx="118" cy="235" rx="20" ry="14" fill="url(#pandaCharcoalGrad)" transform="rotate(-15 118 235)" />
            <ellipse cx="182" cy="235" rx="20" ry="14" fill="url(#pandaCharcoalGrad)" transform="rotate(15 182 235)" />

            {/* Left Arm Raised High */}
            <path
              d="M 104 170 C 80 150, 70 115, 80 95"
              stroke="url(#pandaCharcoalGrad)"
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Right Arm Raised High */}
            <path
              d="M 196 170 C 220 150, 230 115, 220 95"
              stroke="url(#pandaCharcoalGrad)"
              strokeWidth="24"
              strokeLinecap="round"
            />
          </g>
        ) : normalizedPose === 'waving' ? (
          /* Waving right paw playfully */
          <g id="body-waving">
            <ellipse cx="150" cy="182" rx="66" ry="58" fill="url(#pandaWarmWhiteGrad)" />
            <ellipse cx="150" cy="180" rx="44" ry="38" fill="#FFFFFF" />

            {/* Grounded seated feet */}
            <path
              d="M 85 192 C 80 225, 105 242, 150 242 C 195 242, 220 225, 215 192 C 205 230, 95 230, 85 192 Z"
              fill="url(#pandaCharcoalGrad)"
            />

            {/* Left Arm Resting Gently on Hip */}
            <path
              d="M 104 175 C 92 185, 96 205, 116 208"
              stroke="url(#pandaCharcoalGrad)"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* Right Arm Raised and Waving */}
            <path
              d="M 196 170 C 218 155, 232 125, 224 100"
              stroke="url(#pandaCharcoalGrad)"
              strokeWidth="24"
              strokeLinecap="round"
            />
          </g>
        ) : normalizedPose === 'running' ? (
          /* Dynamic Running & Gliding Posture */
          <g id="body-running">
            {/* Wind/dust puffs behind */}
            <g opacity="0.35">
              <circle cx="65" cy="235" r="9" fill="#B9DCE1" />
              <circle cx="52" cy="242" r="6" fill="#D9E9DF" />
              <circle cx="44" cy="236" r="4.5" fill="#FFFFFF" />
            </g>
            <ellipse cx="152" cy="182" rx="64" ry="56" fill="url(#pandaWarmWhiteGrad)" transform="rotate(4 152 182)" />
            <ellipse cx="152" cy="180" rx="42" ry="36" fill="#FFFFFF" transform="rotate(4 152 180)" />

            {/* Running legs */}
            <ellipse cx="110" cy="238" rx="22" ry="14" fill="url(#pandaCharcoalGrad)" transform="rotate(-30 110 238)" />
            <ellipse cx="190" cy="228" rx="22" ry="14" fill="url(#pandaCharcoalGrad)" transform="rotate(25 190 228)" />

            {/* Running arms pumping */}
            <path
              d="M 104 170 C 82 178, 70 195, 86 208"
              stroke="url(#pandaCharcoalGrad)"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              d="M 196 170 C 218 160, 230 145, 222 130"
              stroke="url(#pandaCharcoalGrad)"
              strokeWidth="22"
              strokeLinecap="round"
            />
          </g>
        ) : (
          /* Meditative Seated / Idle / Relaxing Body */
          <g id="body-seated">
            <ellipse cx="150" cy="180" rx="68" ry="60" fill="url(#pandaWarmWhiteGrad)" />
            {/* Folded Dark Legs */}
            <path
              d="M 85 190 C 80 225, 105 242, 150 242 C 195 242, 220 225, 215 190 C 205 230, 95 230, 85 190 Z"
              fill="url(#pandaCharcoalGrad)"
            />
            {/* Paws Resting Serenely on Lap */}
            <ellipse cx="132" cy="195" rx="18" ry="12" fill="url(#pandaCharcoalGrad)" transform="rotate(-8 132 195)" />
            <ellipse cx="168" cy="195" rx="18" ry="12" fill="url(#pandaCharcoalGrad)" transform="rotate(8 168 195)" />
            {/* Center tummy highlight */}
            <ellipse cx="150" cy="178" rx="42" ry="36" fill="#FFFFFF" opacity="0.9" />
          </g>
        )}

        {/* -------------------- 3. OFFICIAL MINT COLLAR & GLOWING HEART/LEAF EMBLEM -------------------- */}
        {/* From Official Reference Sheet: "Collar / Emblem: Glowing heart/leaf symbol. Represents care, calmness and support." */}
        <g id="collar-and-emblem" className="relative z-20">
          {/* Mint Collar Band wrapping gracefully around neck */}
          <path
            d="M 112 144 C 122 156, 178 156, 188 144 C 182 158, 118 158, 112 144 Z"
            fill="url(#mintCollarGrad)"
            stroke="#538A78"
            strokeWidth="1.2"
          />

          {/* Central Heart Locket / Emblem Rim */}
          <g transform="translate(150, 155)">
            {/* Soft Backlight Glow */}
            <circle cx="0" cy="0" r="14" fill="rgba(169, 201, 187, 0.45)" filter="url(#softGlowMint)" />
            {/* Locket Frame Heart */}
            <path
              d="M 0 8 C -10 1, -12 -8, -5 -11 C -1 -12, 0 -7, 0 -7 C 0 -7, 1 -12, 5 -11 C 12 -8, 10 1, 0 8 Z"
              fill="url(#emblemGlow)"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            {/* Embossed Leaf Emblem Inside Heart */}
            <path
              d="M 0 3 C -4 0, -4 -5, 0 -8 C 4 -5, 4 0, 0 3 Z"
              fill="#FFFFFF"
              opacity="0.95"
            />
            <line x1="0" y1="3" x2="0" y2="-7" stroke="#538A78" strokeWidth="0.8" strokeLinecap="round" />
          </g>
        </g>

        {/* -------------------- 4. PANDA HEAD & EARS -------------------- */}
        <g id="panda-head">
          {/* Charcoal Panda Ears (#2E3A37) */}
          {/* Left Ear */}
          <ellipse
            cx="98"
            cy="74"
            rx="26"
            ry="24"
            fill="url(#pandaCharcoalGrad)"
            transform="rotate(-15 98 74)"
            className="transition-transform duration-300"
          />
          <ellipse cx="98" cy="74" rx="16" ry="14" fill="#212C2A" transform="rotate(-15 98 74)" />

          {/* Right Ear */}
          <ellipse
            cx="202"
            cy="74"
            rx="26"
            ry="24"
            fill="url(#pandaCharcoalGrad)"
            transform="rotate(15 202 74)"
            className="transition-transform duration-300"
          />
          <ellipse cx="202" cy="74" rx="16" ry="14" fill="#212C2A" transform="rotate(15 202 74)" />

          {/* Round Head Contour */}
          <ellipse cx="150" cy="108" rx="66" ry="58" fill="url(#pandaWarmWhiteGrad)" />

          {/* -------------------- 5. EYE PATCHES & DYNAMIC EYES -------------------- */}
          {/* Left Charcoal Eye Patch */}
          <ellipse cx="120" cy="104" rx="21" ry="24" fill="url(#pandaCharcoalGrad)" transform="rotate(-16 120 104)" />
          {/* Right Charcoal Eye Patch */}
          <ellipse cx="180" cy="104" rx="21" ry="24" fill="url(#pandaCharcoalGrad)" transform="rotate(16 180 104)" />

          {/* Eye Expressions according to Reference Sheet */}
          {isBlinking || activeExp === 'calm' || normalizedPose === 'relaxing' ? (
            /* Calm / Meditating Serene Eyelashes */
            <g id="eyes-calm">
              <path
                d="M 110 105 Q 120 115 130 105"
                stroke="#FFFFFF"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 170 105 Q 180 115 190 105"
                stroke="#FFFFFF"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : activeExp === 'winking' ? (
            /* Winking Expression: Left open, right winking curve */
            <g id="eyes-winking">
              {/* Left Eye Open with Tracking */}
              <circle cx={120 + pupilOffset.x} cy={103 + pupilOffset.y} r="8.5" fill="#1C2422" />
              <circle cx={117.5 + pupilOffset.x} cy={100 + pupilOffset.y} r="3.2" fill="#FFFFFF" />
              <circle cx={122.5 + pupilOffset.x} cy={104.5 + pupilOffset.y} r="1.4" fill="#FFFFFF" />
              {/* Right Eye Winking */}
              <path
                d="M 170 106 Q 180 97 190 106"
                stroke="#FFFFFF"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : activeExp === 'excited' ? (
            /* Excited Expression: Big starburst catchlights */
            <g id="eyes-excited">
              {/* Left Eye */}
              <circle cx={120 + pupilOffset.x} cy={102 + pupilOffset.y} r="9.5" fill="#1C2422" />
              <circle cx={117 + pupilOffset.x} cy={99 + pupilOffset.y} r="4.2" fill="#FFFFFF" />
              <circle cx={123 + pupilOffset.x} cy={104 + pupilOffset.y} r="2" fill="#FFFFFF" />
              {/* Right Eye */}
              <circle cx={180 + pupilOffset.x} cy={102 + pupilOffset.y} r="9.5" fill="#1C2422" />
              <circle cx={177 + pupilOffset.x} cy={99 + pupilOffset.y} r="4.2" fill="#FFFFFF" />
              <circle cx={183 + pupilOffset.x} cy={104 + pupilOffset.y} r="2" fill="#FFFFFF" />
            </g>
          ) : activeExp === 'surprised' ? (
            /* Surprised Expression: Wide round eyes */
            <g id="eyes-surprised">
              <circle cx={120} cy={103} r="9" fill="#1C2422" />
              <circle cx={118} cy={100} r="3.5" fill="#FFFFFF" />
              <circle cx={180} cy={103} r="9" fill="#1C2422" />
              <circle cx={178} cy={100} r="3.5" fill="#FFFFFF" />
            </g>
          ) : activeExp === 'thinking' ? (
            /* Thinking Expression: Looking upward-right */
            <g id="eyes-thinking">
              <circle cx={122} cy={99} r="8" fill="#1C2422" />
              <circle cx={120} cy={97} r="3" fill="#FFFFFF" />
              <circle cx={182} cy={99} r="8" fill="#1C2422" />
              <circle cx={180} cy={97} r="3" fill="#FFFFFF" />
            </g>
          ) : (
            /* Open Warm & Reassuring Eyes with Interactive Tracking */
            <g id="eyes-open">
              {/* Left Eye */}
              <circle cx={120 + pupilOffset.x} cy={103 + pupilOffset.y} r="8.2" fill="#1C2422" />
              <circle cx={117.8 + pupilOffset.x} cy={100 + pupilOffset.y} r="3" fill="#FFFFFF" />
              <circle cx={122.2 + pupilOffset.x} cy={104.5 + pupilOffset.y} r="1.3" fill="#FFFFFF" />

              {/* Right Eye */}
              <circle cx={180 + pupilOffset.x} cy={103 + pupilOffset.y} r="8.2" fill="#1C2422" />
              <circle cx={177.8 + pupilOffset.x} cy={100 + pupilOffset.y} r="3" fill="#FFFFFF" />
              <circle cx={182.2 + pupilOffset.x} cy={104.5 + pupilOffset.y} r="1.3" fill="#FFFFFF" />
            </g>
          )}

          {/* Soft Peach / Mint Blush on Cheeks */}
          <ellipse
            cx="102"
            cy="120"
            rx="11"
            ry="6"
            fill={activeExp === 'blushing' ? '#FCA5A5' : '#FADBD8'}
            opacity={activeExp === 'blushing' ? 0.95 : 0.75}
          />
          <ellipse
            cx="198"
            cy="120"
            rx="11"
            ry="6"
            fill={activeExp === 'blushing' ? '#FCA5A5' : '#FADBD8'}
            opacity={activeExp === 'blushing' ? 0.95 : 0.75}
          />

          {/* Cute Nose */}
          <path
            d="M 144 117 C 144 113, 156 113, 156 117 C 156 122, 150 125, 150 125 C 150 125, 144 122, 144 117 Z"
            fill="#1C2422"
          />

          {/* Mouth Expression */}
          {isSpeaking ? (
            /* Talking / Lip-sync mouth animation */
            <ellipse
              cx="150"
              cy="129"
              rx="5"
              ry="4"
              fill="#F43F5E"
              stroke="#1C2422"
              strokeWidth="1.5"
              className="animate-pulse"
            />
          ) : activeExp === 'excited' || activeExp === 'happy' ? (
            /* Cheerful Open Smile */
            <path
              d="M 142 126 Q 150 137 158 126 Z"
              fill="#F43F5E"
              stroke="#1C2422"
              strokeWidth="1.8"
            />
          ) : activeExp === 'surprised' ? (
            /* Small round "o" mouth */
            <circle cx="150" cy="128" r="3.5" fill="#1C2422" />
          ) : (
            /* Gentle Reassuring Cat-Smile */
            <path
              d="M 140 126 Q 146 131 150 127 Q 154 131 160 126"
              stroke="#2E3A37"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      </svg>

      {/* Optional Caption */}
      {caption && (
        <span className="text-xs font-semibold text-slate-700 tracking-wide mt-1.5 px-3 py-0.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-xs">
          {caption}
        </span>
      )}
    </div>
  );
};

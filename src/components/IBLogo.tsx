import React from 'react';

interface IBLogoProps {
  className?: string;
  size?: number;
}

export const IBLogo: React.FC<IBLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_12px_rgba(167,139,250,0.45)] ${className}`}
    >
      <defs>
        <linearGradient id="ib-grad-outer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="50%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
        <linearGradient id="ib-grad-inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
        <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Top Power Switch Vertical Pin */}
      <rect
        x="45.5"
        y="6"
        width="9"
        height="18"
        rx="4.5"
        fill="url(#ib-grad-outer)"
      />

      {/* Outer Power Ring with top gap */}
      <path
        d="M 39 18 A 38 38 0 1 0 61 18"
        fill="none"
        stroke="url(#ib-grad-outer)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Inner Monogram / 'b' Loop Ring */}
      <circle
        cx="50"
        cy="52"
        r="24"
        fill="none"
        stroke="url(#ib-grad-inner)"
        strokeWidth="6"
      />

      {/* Inner b stem / accent on left */}
      <path
        d="M 31 30 Q 30 52 38 68 Q 28 50 31 30 Z"
        fill="url(#ib-grad-inner)"
        opacity="0.85"
      />
    </svg>
  );
};

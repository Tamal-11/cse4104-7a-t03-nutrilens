import React from 'react';

interface NutriLenseLogoProps {
  className?: string;
  size?: number; // width and height of the icon
  showText?: boolean;
  textSizeClass?: string;
}

export function NutriLenseLogo({
  className = '',
  size = 72,
  showText = true,
  textSizeClass = 'text-2xl font-bold tracking-tight text-slate-900',
}: NutriLenseLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src="/logo.png"
        width={size}
        height={size}
        alt="NutriLens"
        className="block object-contain"
      />
      {/* Accurate High Fidelity Camera + Leaves Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden text-slate-900"
      >
        {/* Camera body outline */}
        <path
          d="M18 38C18 34.6863 20.6863 32 24 32H38.5C40.4173 32 42.1706 30.9079 43.0034 29.183L45.4966 24.017C46.3294 22.2921 48.0827 21.2 50 21.2H50C51.9173 21.2 53.6706 22.2921 54.5034 24.017L56.9966 29.183C57.8294 30.9079 59.5827 32 61.5 32H76C79.3137 32 82 34.6863 82 38V74C82 77.3137 79.3137 80 76 80H24C20.6863 80 18 77.3137 18 74V38Z"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Camera red/black small indicator sensor light */}
        <circle cx="73" cy="42" r="2.5" fill="currentColor" />

        {/* Central circular lens outline */}
        <circle
          cx="50"
          cy="56"
          r="17"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Two green leaves inside the lens */}
        <g transform="translate(39, 45)">
          {/* Left Leaf */}
          <path
            d="M5.5 17C2.5 12 4.5 5 11 3.5C11.5 6.5 9 13.5 5.5 17Z"
            fill="#599b38"
            stroke="#45782a"
            strokeWidth="0.75"
          />
          {/* Right Leaf */}
          <path
            d="M15.5 17C18.5 12 16.5 5 10 3.5C9.5 6.5 12 13.5 15.5 17Z"
            fill="#599b38"
            stroke="#45782a"
            strokeWidth="0.75"
          />
          {/* Stems */}
          <path
            d="M10.5 16.5C10.5 14.5 10.5 11 10.5 7"
            stroke="#385e21"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M6 16.5C7.2 14.5 8.5 13.5 10.5 13.2"
            stroke="#385e21"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path
            d="M15 16.5C13.8 14.5 12.5 13.5 10.5 13.2"
            stroke="#385e21"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Under text */}
      {showText && (
        <span className={`${textSizeClass} mt-2`}>NutriLense</span>
      )}
    </div>
  );
}

export function LeafyBackgroundDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top Left Leaf */}
      <svg
        className="absolute -top-6 -left-6 text-[#bbdc9b] opacity-25 w-32 h-32 rotate-45 transform"
        viewBox="0 0 100 100"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 60C10 30, 40 10, 80 10C80 40, 60 80, 10 60Z" />
        <path d="M10 60C35 45, 55 35, 80 10" stroke="#8cb862" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 48C38 42, 45 42, 52 46" stroke="#8cb862" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M45 37C53 31, 60 31, 67 35" stroke="#8cb862" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Top Right Leaf */}
      <svg
        className="absolute top-24 -right-10 text-[#bbdc9b] opacity-15 w-24 h-24 -rotate-12 transform"
        viewBox="0 0 100 100"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 75C15 45, 45 25, 85 25C85 55, 65 85, 15 75Z" />
      </svg>

      {/* Bottom Right Leaves pair (exactly as in WhatsApp screenshot) */}
      <div className="absolute bottom-6 right-6 flex gap-1 rotate-12">
        {/* Large Leaf */}
        <svg
          className="text-[#96cd6b] opacity-25 w-36 h-36"
          viewBox="0 0 100 100"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 80C10 40, 50 15, 90 15C90 55, 70 90, 10 80Z" />
          <path d="M10 80C40 60, 65 45, 90 15" stroke="#5d962a" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 64C42 56, 52 56, 62 62" stroke="#5d962a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M50 49C60 41, 70 41, 80 47" stroke="#5d962a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Mid Left Subtle Leaf */}
      <svg
        className="absolute bottom-28 -left-8 text-[#96cd6b] opacity-15 w-24 h-24 -rotate-45 transform"
        viewBox="0 0 100 100"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 80C10 40, 50 15, 90 15C90 55, 70 90, 10 80Z" />
      </svg>
    </div>
  );
}

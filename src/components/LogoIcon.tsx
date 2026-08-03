import React from 'react';

export default function LogoIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 1000 1000" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient-spec" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0b2545" />
          <stop offset="35%" stopColor="#134074" />
          <stop offset="70%" stopColor="#1d6a96" />
          <stop offset="100%" stopColor="#3fa8d4" />
        </linearGradient>
      </defs>
      
      <g transform="translate(500, 500) scale(0.85) translate(-602.5, -490)">
        {/* Main Upper Wing Swoosh */}
        <path 
          d="M 315 730 L 490 350 C 525 275, 600 250, 700 250 C 780 250, 850 260, 890 280 C 900 285, 895 298, 880 300 C 800 310, 720 330, 650 375 C 580 420, 520 490, 480 580 L 415 730 Z" 
          fill="url(#logo-gradient-spec)"
        />
        
        {/* Lower Secondary Wing Swoosh */}
        <path 
          d="M 410 730 L 485 580 C 520 500, 580 450, 680 435 C 750 425, 800 425, 840 435 C 850 438, 848 452, 835 455 C 760 470, 700 500, 640 550 C 580 600, 530 660, 505 730 Z" 
          fill="url(#logo-gradient-spec)"
        />
      </g>
    </svg>
  );
}



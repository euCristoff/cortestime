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
          <stop offset="0%" stopColor="#081c3b" />
          <stop offset="30%" stopColor="#113e73" />
          <stop offset="65%" stopColor="#1d6e9d" />
          <stop offset="100%" stopColor="#3fa8d4" />
        </linearGradient>
      </defs>
      
      <g transform="translate(500, 500) scale(1.15) translate(-612.5, -485)">
        {/* Main Upper Wing Swoosh */}
        <path 
          d="M 315 730 L 480 360 C 515 285, 580 250, 680 250 C 770 250, 850 255, 895 272 C 910 278, 910 295, 890 302 C 810 320, 720 345, 640 390 C 550 440, 490 530, 440 650 L 405 730 Z" 
          fill="url(#logo-gradient-spec)"
        />
        
        {/* Lower Secondary Wing Swoosh */}
        <path 
          d="M 425 730 L 490 580 C 525 500, 580 445, 670 430 C 740 418, 800 420, 835 430 C 848 434, 846 448, 830 454 C 750 475, 670 515, 610 565 C 560 605, 525 645, 515 675 L 515 730 Z" 
          fill="url(#logo-gradient-spec)"
        />
      </g>
    </svg>
  );
}

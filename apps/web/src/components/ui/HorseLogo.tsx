import React from 'react';

interface HorseLogoProps {
  className?: string;
  size?: number;
}

export const HorseLogo: React.FC<HorseLogoProps> = ({ className = 'w-8 h-8 text-white', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Euroshub Kitchen Horse Logo"
    >
      {/* Modern stylized dynamic horse silhouette for Pakistani fast-food brand */}
      <path
        d="M12 40L14 30C13 26 11 23 9 20C7.5 17.5 8 14 11 12C13 10.5 16 10 18 11L21 6C23 4.5 26 5 27 7L28 10C31 9.5 35 10 38 12C41 14 42 17 41 20C40 22 37 24 34 24C31 24 28 23 27 21L25 24C24 25.5 24 27 25 29L28 35L26 40H12Z"
        fill="currentColor"
      />
      <path
        d="M20 18C20.8284 18 21.5 17.3284 21.5 16.5C21.5 15.6716 20.8284 15 20 15C19.1716 15 18.5 15.6716 18.5 16.5C18.5 17.3284 19.1716 18 20 18Z"
        fill="#FF6B35"
      />
      <path
        d="M33 17L37 15L35 19L33 17Z"
        fill="#FF6B35"
      />
    </svg>
  );
};

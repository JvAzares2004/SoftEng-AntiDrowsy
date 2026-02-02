import React from 'react';

interface PlayIconProps {
  className?: string; // Tailwind classes for size/color
}

const PlayIcon: React.FC<PlayIconProps> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.33325 2L12.6666 8L3.33325 14V2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default PlayIcon;

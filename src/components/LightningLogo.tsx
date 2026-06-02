import { cn } from '../utils';

export function LightningLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("drop-shadow-[0_0_12px_rgba(204,255,0,0.6)] drop-shadow-[0_0_24px_rgba(204,255,0,0.3)]", className)}
    >
      {/* Top Left Part */}
      <path
        d="M14.5 2 L 4 12.5 H 13 Z"
        fill="#ccff00"
        stroke="#ccff00"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Bottom Right Part */}
      <path
        d="M11 11 H 20 L 9.5 22 Z"
        fill="#a3cc00"
        stroke="#a3cc00"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

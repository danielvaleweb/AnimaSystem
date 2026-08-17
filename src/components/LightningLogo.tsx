import { cn } from '../utils';
import { motion } from 'motion/react';

export function LightningLogo({ className }: { className?: string }) {
  return (
    <motion.svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: { staggerChildren: 0.2, delayChildren: 0.1, duration: 0.5, ease: "easeOut" }
        },
        hover: {
          scale: 1.15,
          rotate: [0, -5, 5, -5, 5, 0],
          transition: { rotate: { duration: 0.5, ease: "easeInOut", repeat: Infinity } }
        }
      }}
    >
      {/* Neon Glow Filter */}
      <defs>
        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Top Left Part */}
      <motion.path
        d="M14.5 2 L 4 12.5 H 13 Z"
        fill="#D7FE03"
        stroke="#D7FE03"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#neon)"
        variants={{
          hidden: { pathLength: 0, fillOpacity: 0 },
          visible: { 
            pathLength: 1, 
            fillOpacity: [0, 0, 1], // Delay fill until path is drawn
            transition: { 
              pathLength: { duration: 0.8, ease: "easeInOut" },
              fillOpacity: { duration: 0.4, times: [0, 0.99, 1] } 
            }
          }
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          filter: [
            "drop-shadow(0 0 6px rgba(215,254,3,0.4))",
            "drop-shadow(0 0 16px rgba(215,254,3,0.9))",
            "drop-shadow(0 0 6px rgba(215,254,3,0.4))"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Bottom Right Part */}
      <motion.path
        d="M11 11 H 20 L 9.5 22 Z"
        fill="#7abf1d"
        stroke="#7abf1d"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#neon)"
        variants={{
          hidden: { pathLength: 0, fillOpacity: 0 },
          visible: { 
            pathLength: 1, 
            fillOpacity: [0, 0, 1], // Delay fill until path is drawn
            transition: { 
              pathLength: { duration: 0.8, ease: "easeInOut" },
              fillOpacity: { duration: 0.4, times: [0, 0.99, 1] } 
            }
          }
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          filter: [
            "drop-shadow(0 0 6px rgba(122,191,29,0.4))",
            "drop-shadow(0 0 16px rgba(122,191,29,0.9))",
            "drop-shadow(0 0 6px rgba(122,191,29,0.4))"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </motion.svg>
  );
}

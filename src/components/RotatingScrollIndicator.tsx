import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

export const RotatingScrollIndicator = () => {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <motion.div 
        className="absolute inset-0 animate-spin-slow"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            id="circlePath"
            d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
            fill="transparent"
          />
          <text className="font-mono text-[9px] font-bold uppercase fill-black">
            <textPath href="#circlePath" startOffset="0%">
              SCROLL DOWN • SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •
            </textPath>
          </text>
        </svg>
      </motion.div>
      <ArrowDown className="w-6 h-6 text-black" />
    </div>
  );
};

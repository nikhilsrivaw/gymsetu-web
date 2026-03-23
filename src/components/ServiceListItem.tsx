import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ServiceItemProps {
  index: string;
  title: string;
  tags: string[];
}

export const ServiceListItem = ({ index, title, tags }: ServiceItemProps) => {
  return (
    <motion.div 
      className="group w-full border-t border-white/20 py-8 md:py-12 px-4 md:px-6 flex items-center justify-between cursor-pointer transition-colors hover:bg-white/5"
      whileHover={{ x: 0 }}
    >
      <div className="flex items-center gap-6 md:gap-12">
        <span className="font-mono text-brand-orange text-lg md:text-xl">{index}</span>
        <div className="flex flex-col gap-2 md:gap-4 transition-transform duration-300 group-hover:translate-x-4">
          <h3 className="font-archivo text-3xl sm:text-4xl md:text-7xl uppercase leading-none tracking-tighter">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-3 md:px-4 py-1 border border-white/40 rounded-full font-mono text-[10px] md:text-xs uppercase opacity-60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <motion.div 
        className="hidden md:block opacity-0 group-hover:opacity-100 transition-all duration-300"
        initial={{ rotate: 0 }}
        whileHover={{ rotate: 45 }}
      >
        <ArrowUpRight className="w-16 h-16 text-brand-orange" />
      </motion.div>
    </motion.div>
  );
};

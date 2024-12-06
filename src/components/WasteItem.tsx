import React from 'react';
import { motion } from 'framer-motion';
import type { WasteItem as WasteItemType } from '../types';

interface WasteItemProps extends WasteItemType {
  dropSpeed: number;
  isCollected?: boolean;
}

const WasteItem: React.FC<WasteItemProps> = ({ 
  x, 
  y, 
  name, 
  icon,
  type, 
  dropSpeed,
  isCollected 
}) => {
  const typeColors = {
    Wet: 'bg-green-500/20 border-green-500/50',
    Dry: 'bg-blue-500/20 border-blue-500/50',
    Hazardous: 'bg-red-500/20 border-red-500/50'
  };

  return (
    <motion.div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{ 
        left: x, 
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      }}
      initial={{ y, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ 
        y: isCollected ? y - 50 : window.innerHeight,
        opacity: isCollected ? 0 : 1,
        scale: isCollected ? 1.2 : 1,
        rotate: isCollected ? [-10, 10, -10] : 0
      }}
      transition={{ 
        y: {
          duration: isCollected ? 0.5 : (window.innerHeight - y) / (dropSpeed * 16),
          ease: isCollected ? 'easeOut' : 'linear'
        },
        opacity: {
          duration: 0.3
        },
        scale: {
          duration: 0.3
        },
        rotate: {
          duration: 0.5,
          repeat: 0
        }
      }}
    >
      <motion.div
        className={`p-3 rounded-lg border ${typeColors[type]} backdrop-blur-sm`}
        animate={{ rotate: isCollected ? [0, -15, 15, -15, 0] : 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-5xl filter drop-shadow-lg">{icon}</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-2 text-sm text-white bg-black/60 px-3 py-1 rounded-full border border-white/30 whitespace-nowrap backdrop-blur-sm"
      >
        {name}
      </motion.div>
    </motion.div>
  );
};

export default WasteItem;
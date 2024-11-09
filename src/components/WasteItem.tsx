import React from 'react';
import { motion } from 'framer-motion';
import type { WasteItem as WasteItemType } from '../types';

interface WasteItemProps extends WasteItemType {
  dropSpeed: number;
  isCollected?: boolean;
}

const WasteItem: React.FC<WasteItemProps> = ({ 
  type, 
  x, 
  y, 
  name, 
  icon, 
  dropSpeed,
  isCollected 
}) => {
  const getTypeStyle = () => {
    switch (type) {
      case 'Hazardous':
        return 'text-red-400';
      case 'Wet':
        return 'text-green-400';
      case 'Dry':
        return 'text-blue-400';
    }
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
      initial={{ y, opacity: 1, scale: 1 }}
      animate={{ 
        y: isCollected ? y : window.innerHeight,
        opacity: isCollected ? 0 : 1,
        scale: isCollected ? 0.5 : 1
      }}
      transition={{ 
        y: {
          duration: isCollected ? 0.2 : (window.innerHeight - y) / (dropSpeed * 16),
          ease: isCollected ? 'easeOut' : 'linear'
        },
        opacity: {
          duration: 0.2
        },
        scale: {
          duration: 0.2
        }
      }}
    >
      <span className="text-4xl mb-1">{icon}</span>
      <span className={`text-sm ${getTypeStyle()}`}>{name}</span>
    </motion.div>
  );
};

export default WasteItem;
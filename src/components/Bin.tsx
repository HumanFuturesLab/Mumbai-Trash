import React from 'react';
import type { WasteCategory } from '../types';

interface BinProps {
  position: number;
  category: WasteCategory;
}

const Bin: React.FC<BinProps> = ({ position, category }) => {
  // Define bin colors based on category
  const getBinColor = (category: WasteCategory) => {
    switch (category) {
      case 'Dry':
        return 'bg-blue-500';
      case 'Wet':
        return 'bg-green-500';
      case 'Hazardous':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`absolute bottom-8 transform -translate-x-1/2 transition-transform duration-100 ease-linear`}
      style={{ left: position }}
    >
      {/* Bin lid */}
      <div className={`w-16 h-3 ${getBinColor(category)} rounded-t-lg`} />
      
      {/* Bin body */}
      <div className={`w-16 h-16 ${getBinColor(category)} relative`}>
        {/* Optional: Add bin details/decorations */}
        <div className="absolute inset-2 border-2 border-opacity-20 border-white rounded" />
        
        {/* Optional: Add recycling symbol or category indicator */}
        <div className="absolute inset-0 flex items-center justify-center text-white opacity-70 text-xs">
          {category}
        </div>
      </div>
    </div>
  );
};

export default Bin;
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { WasteCategory } from '../types';

interface BinProps {
  position: number;
  category: WasteCategory;
}

const Bin: React.FC<BinProps> = ({ position, category }) => {
  const getBinColor = () => {
    switch (category) {
      case 'Hazardous':
        return 'bg-red-500';
      case 'Wet':
        return 'bg-green-500';
      case 'Dry':
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-100"
      style={{ 
        left: position, 
        bottom: '15%', // Positioned at 85% of screen height
        transform: 'translateX(-50%)' 
      }}
    >
      <Trash2 className={`w-8 h-8 mb-2 ${getBinColor().replace('bg-', 'text-')}`} />
      <div className={`w-16 h-16 ${getBinColor()} rounded-lg relative`}>
        {/* Visual indicator for collection zone */}
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-white opacity-50" />
      </div>
    </div>
  );
};

export default Bin;
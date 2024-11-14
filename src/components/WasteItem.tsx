import React from 'react';
import type { WasteCategory } from '../types';

interface WasteItemProps {
  x: number;
  y: number;
  icon: string;
  name: string;
  type: WasteCategory;
  isCollected?: boolean;
}

const ITEM_SIZE = 40; // Ensure consistency with App.tsx

const WasteItem: React.FC<WasteItemProps> = ({
  x,
  y,
  icon,
  name,
  isCollected = false,
}) => {
  return (
    <div
      className={`absolute flex flex-col items-center transition-all ${
        isCollected ? 'opacity-0 scale-0' : ''
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${ITEM_SIZE}px`,
        height: `${ITEM_SIZE}px`,
        transition: 'opacity 0.3s, transform 0.3s',
      }}
      title={name}
    >
      <div className="w-full h-full flex items-center justify-center">
        <span
          className="text-3xl select-none"
          role="img"
          aria-label={name}
        >
          {icon}
        </span>
      </div>
      {/* Ensure the item name text is always white */}
      <span className="mt-1 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm">
        {name}
      </span>
    </div>
  );
};

export default React.memo(WasteItem);
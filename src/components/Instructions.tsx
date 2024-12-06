import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InstructionsProps {
  onStart: (name: string) => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleStart = () => {
    if (!playerName.trim()) {
      setError('Please enter your name to start!');
      return;
    }
    onStart(playerName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onStart(playerName);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && playerName.trim()) {
      onStart(playerName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg text-white max-w-md w-full">
        <div className="text-center">
          <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Beat The Kid</h2>
          
          <div className="mb-6">
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter your name"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 outline-none"
                maxLength={10}
                autoFocus
              />
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
          </div>
          
          <div className="text-left space-y-4 mb-6">
            <p className="hidden md:block">🎮 Use <span className="font-bold">left</span> and <span className="font-bold">right</span> arrow keys to move the bin</p>
            <p className="md:hidden">🎮 <span className="font-bold">Swipe left or right</span> to move the bin</p>
            <p>🎯 Each round you'll be assigned a waste type to collect:</p>
            <ul className="space-y-2 pl-4">
              <li className="text-green-400">Wet waste (food scraps)</li>
              <li className="text-blue-400">Dry waste (plastic, paper)</li>
              <li className="text-red-400">Hazardous waste (batteries)</li>
            </ul>
            <p>⚠️ Game ends if you:</p>
            <ul className="list-disc list-inside pl-4">
              <li>Miss 3 correct items</li>
              <li>Collect a wrong item</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-xl hover:bg-blue-600 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
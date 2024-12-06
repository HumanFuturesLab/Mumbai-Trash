import React, { useState, useRef, useEffect } from 'react';
import { Info, Trophy } from 'lucide-react';

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
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Beat The Kid</h2>
          <p className="text-lg text-green-400 mb-6">
            Play to unlock early access to the GLEO gang!
          </p>
          
          <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-3">🎯 Your Goal</h3>
            <p className="text-gray-300 mb-4">
              Score {10} points to receive an exclusive invite code <br />Also get 200 GLEO coins to get started.
            </p>
            <div className="text-sm text-gray-400">
              GLEO points can be used in the app to unlock exclusive rewards.
            </div>
          </div>

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

          <div className="space-y-4 text-left mb-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">🎮 How to Play</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="hidden md:block">• Use <span className="font-bold">left</span> and <span className="font-bold">right</span> arrow keys to move</li>
                <li className="md:hidden">• <span className="font-bold">Swipe left or right</span> to move the bin</li>
                <li>• Collect items in the correct waste bin</li>
                <li>• Build combos for bonus points</li>
                <li>• You have 3 lives - don't miss or mix waste types!</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">🗑️ Waste Types</h3>
              <ul className="grid grid-cols-3 gap-2">
                <li className="text-green-400 text-center p-2 bg-green-900/20 rounded">
                  <div className="font-bold">Wet</div>
                  <div className="text-xs">Food waste</div>
                </li>
                <li className="text-blue-400 text-center p-2 bg-blue-900/20 rounded">
                  <div className="font-bold">Dry</div>
                  <div className="text-xs">Paper, plastic</div>
                </li>
                <li className="text-red-400 text-center p-2 bg-red-900/20 rounded">
                  <div className="font-bold">Hazardous</div>
                  <div className="text-xs">Chemicals</div>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-xl hover:bg-blue-600 transition-colors w-full"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
import React from 'react';
import { Trophy } from 'lucide-react';

interface GameOverProps {
  score: number;
  reason: string;
  onRestart: () => void;
  highScores: { name: string; points: number; date: string }[];
  playerName: string;
}

const GameOver: React.FC<GameOverProps> = ({ score, reason, onRestart, highScores, playerName }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-2xl text-white mb-4">Game Over!</h2>
        
        <div className="text-red-400 mb-4 whitespace-pre-line">
          {reason}
        </div>
        
        <p className="text-white mb-4">Final Score: {score}</p>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">High Scores</h3>
          <div className="space-y-2">
            {highScores.map((score, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                  score.name === playerName ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span className="font-medium">{score.name}</span>
                <span className="text-gray-300">{score.points}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onRestart}
          className="bg-blue-500 text-white px-8 py-3 rounded-lg text-xl hover:bg-blue-600 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOver;
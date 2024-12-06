import React, { useState } from 'react';
import { Trophy, XCircle, CheckCircle2 } from 'lucide-react';

interface GameOverProps {
  score: number;
  reason: string;
  onRestart: () => void;
  playerName: string;
}

const REWARD_THRESHOLD = 10; // Score needed to get an invite code
const REWARD_API_URL = 'https://devapi.gleo.club/api/partner/reward/';
const REWARD_API_TOKEN = '0589f7bc-6757-4ae1-a40e-ac58a55931cd';

const GameOver: React.FC<GameOverProps> = ({ score, reason, onRestart, playerName }) => {
  const [email, setEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(REWARD_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: 200,
          token: REWARD_API_TOKEN
        })
      });

      const data = await response.json();
      if (data.success) {
        setCouponCode(data.data.coupon_code);
      } else {
        setError('Failed to generate invite code. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reachedThreshold = score >= REWARD_THRESHOLD;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
        <div className="text-center mb-6">
          {reachedThreshold ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl text-white mb-2">Game Over!</h2>
          <p className="text-xl text-white mb-4">Final Score: {score}</p>
          
          {reachedThreshold ? (
            <p className="text-green-400 text-lg">
              Congratulations! You've qualified for app access!
            </p>
          ) : (
            <div>
              <p className="text-red-400 text-lg mb-2">
                Score {REWARD_THRESHOLD - score} more points to unlock app access
              </p>
              <p className="text-gray-400">
                You need a score of {REWARD_THRESHOLD} to qualify
              </p>
            </div>
          )}
        </div>

        {reachedThreshold && !couponCode && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              🎉 Claim Your Reward
            </h3>
            <p className="text-white mb-4">
              Enter your email to receive an invite code with 200 GLEO points!
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded bg-gray-600 text-white border-2 border-gray-500 focus:border-blue-500 outline-none mb-2"
                disabled={isLoading}
              />
              {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
              <button
                type="submit"
                className={`w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Get Invite Code'}
              </button>
            </form>
          </div>
        )}

        {couponCode && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              🎉 Your Invite Code is Ready!
            </h3>
            <p className="text-white mb-2">
              Use this code to access the app with 200 GLEO points:
            </p>
            <div className="bg-gray-900 p-3 rounded text-center text-xl font-mono text-green-400 select-all">
              {couponCode}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onRestart}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg text-xl hover:bg-blue-600 transition-colors"
          >
            {reachedThreshold ? 'Play Again' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
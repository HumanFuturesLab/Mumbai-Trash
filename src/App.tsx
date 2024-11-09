import React, { useState, useEffect, useCallback } from 'react';
import { Heart, HeartCrack } from 'lucide-react';
import Bin from './components/Bin';
import WasteItem from './components/WasteItem';
import GameOver from './components/GameOver';
import Instructions from './components/Instructions';
import type { WasteItem as WasteItemType, WasteCategory, Score, PlayerInfo, ExtendedWasteItem } from './types';

const GAME_WIDTH = 800;
const BIN_WIDTH = 64;
const INITIAL_LIVES = 3;
const BIN_TOP_Y = 0.85; // Position of bin top relative to screen height
const BIN_COLLECTION_ZONE = 30; // Increased for better detection
const BIN_HIT_ZONE = BIN_WIDTH * 0.8; // Wider hit zone
const BIN_MOVE_SPEED = 70;
const INITIAL_DROP_SPEED = 2;
const MAX_DROP_SPEED = 8;
const SPEED_INCREMENT = 0.2;
const SPEED_INTERVAL = 15000;
const INITIAL_SPAWN_INTERVAL = 2500;
const MIN_SPAWN_INTERVAL = 1500;
const ITEM_SIZE = 40; // Size of waste items for collision detection

const wasteItems = [
  { type: 'Wet' as WasteCategory, name: 'Banana Peel', icon: '🍌' },
  { type: 'Wet' as WasteCategory, name: 'Apple Core', icon: '🍎' },
  { type: 'Wet' as WasteCategory, name: 'Tea Waste', icon: '🫖' },
  { type: 'Dry' as WasteCategory, name: 'Plastic Bottle', icon: '🍾' },
  { type: 'Dry' as WasteCategory, name: 'Paper', icon: '📄' },
  { type: 'Dry' as WasteCategory, name: 'Cardboard', icon: '📦' },
  { type: 'Hazardous' as WasteCategory, name: 'Battery', icon: '🔋' },
  { type: 'Hazardous' as WasteCategory, name: 'Paint', icon: '🎨' },
  { type: 'Hazardous' as WasteCategory, name: 'Chemical', icon: '⚗️' },
];

function App() {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [binPosition, setBinPosition] = useState(GAME_WIDTH / 2);
  const [assignedBin, setAssignedBin] = useState<WasteCategory>('Wet');
  const [items, setItems] = useState<ExtendedWasteItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [highScores, setHighScores] = useState<Score[]>([]);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [dropSpeed, setDropSpeed] = useState(INITIAL_DROP_SPEED);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [gameWidth, setGameWidth] = useState(Math.min(GAME_WIDTH, window.innerWidth));
  const [processedCollisions] = useState(new Set<string>());
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [lifeLostAnimation, setLifeLostAnimation] = useState(false);
  const [lastScorePosition, setLastScorePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
      setGameWidth(Math.min(GAME_WIDTH, window.innerWidth));
      setBinPosition(prev => Math.min(Math.max(BIN_WIDTH / 2, prev), gameWidth - BIN_WIDTH / 2));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = useCallback((name: string) => {
    if (!name.trim()) return;
    
    setPlayerInfo({ name: name.toUpperCase() });
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(INITIAL_LIVES);
    setItems([]);
    setDropSpeed(INITIAL_DROP_SPEED);
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setAssignedBin(['Wet', 'Dry', 'Hazardous'][Math.floor(Math.random() * 3)] as WasteCategory);
    setBinPosition(gameWidth / 2);
    processedCollisions.clear();
  }, [gameWidth, processedCollisions]);

  const endGame = useCallback((reason: string) => {
    setGameOver(true);
    setGameStarted(false);
    setGameOverReason(reason);
    
    if (playerInfo) {
      const newScore: Score = {
        name: playerInfo.name,
        points: score,
        date: new Date().toISOString(),
      };
      setHighScores(prev => {
        const updatedScores = [...prev, newScore]
          .sort((a, b) => b.points - a.points)
          .slice(0, 5);
        return updatedScores;
      });
    }
  }, [score, playerInfo]);

  const checkCollision = useCallback((item: ExtendedWasteItem) => {
    if (processedCollisions.has(item.id) || item.isCollected) return false;

    const binTopY = screenHeight * BIN_TOP_Y;
    const itemCenterY = item.y + ITEM_SIZE / 2;
    const itemCenterX = item.x + ITEM_SIZE / 2;
    
    const inVerticalZone = Math.abs(itemCenterY - binTopY) <= BIN_COLLECTION_ZONE;
    
    const binLeft = binPosition - BIN_HIT_ZONE / 2;
    const binRight = binPosition + BIN_HIT_ZONE / 2;
    const inHorizontalZone = itemCenterX >= binLeft && itemCenterX <= binRight;
    
    return inVerticalZone && inHorizontalZone;
  }, [binPosition, screenHeight, processedCollisions]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX;
    
    setBinPosition(prev => {
      const newPos = prev + deltaX;
      return Math.max(BIN_WIDTH / 2, Math.min(gameWidth - BIN_WIDTH / 2, newPos));
    });
    
    setTouchStartX(touchX);
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const moveDistance = BIN_MOVE_SPEED * (e.shiftKey ? 1.5 : 1);
      
      if (e.key === 'ArrowLeft') {
        setBinPosition(pos => Math.max(BIN_WIDTH / 2, pos - moveDistance));
      } else if (e.key === 'ArrowRight') {
        setBinPosition(pos => Math.min(gameWidth - BIN_WIDTH / 2, pos + moveDistance));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver, gameWidth]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const difficultyInterval = setInterval(() => {
      setDropSpeed(prev => Math.min(prev + SPEED_INCREMENT, MAX_DROP_SPEED));
      setSpawnInterval(prev => Math.max(prev * 0.97, MIN_SPAWN_INTERVAL));
    }, SPEED_INTERVAL);

    return () => clearInterval(difficultyInterval);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawn = setInterval(() => {
      const randomItem = wasteItems[Math.floor(Math.random() * wasteItems.length)];
      const safeWidth = gameWidth - ITEM_SIZE;
      const safeX = Math.max(ITEM_SIZE, Math.min(safeWidth, Math.random() * safeWidth));
      
      const newItem: WasteItemType = {
        id: Date.now().toString(),
        ...randomItem,
        x: safeX,
        y: -ITEM_SIZE, // Start above the screen
      };
      setItems(prev => [...prev, newItem]);
    }, spawnInterval);

    return () => clearInterval(spawn);
  }, [gameStarted, gameOver, spawnInterval, gameWidth]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setItems(prevItems => {
        let shouldEndGame = false;
        let gameEndReason = '';
        
        const itemsToProcess = prevItems.map(item => {
          if (item.isCollected) {
            return { ...item, shouldRemove: true };
          }

          const newY = item.y + dropSpeed;
          const binTopY = screenHeight * BIN_TOP_Y;
          const itemCenterY = newY + ITEM_SIZE / 2;
          const itemCenterX = item.x + ITEM_SIZE / 2;

          // Check for collection at bin's top edge
          if (!processedCollisions.has(item.id)) {
            // Item is approaching or crossing the bin's top edge
            if (itemCenterY >= binTopY - BIN_COLLECTION_ZONE) {
              const binLeftEdge = binPosition - BIN_WIDTH / 2;
              const binRightEdge = binPosition + BIN_WIDTH / 2;
              
              if (itemCenterX >= binLeftEdge && itemCenterX <= binRightEdge) {
                processedCollisions.add(item.id);
                if (item.type === assignedBin) {
                  setScore(prev => prev + 1);
                  setScoreAnimation(true);
                  setLastScorePosition({ x: item.x, y: item.y });
                  return { ...item, isCollected: true };
                } else {
                  shouldEndGame = true;
                  gameEndReason = `Wrong item! ${item.name} is ${item.type} waste. You're collecting ${assignedBin} waste.`;
                  return { ...item, shouldRemove: true };
                }
              }
            }
          }

          // Remove items that have completely passed the bin
          if (newY > binTopY + BIN_COLLECTION_ZONE) {
            if (item.type === assignedBin && !processedCollisions.has(item.id)) {
              processedCollisions.add(item.id);
              setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  shouldEndGame = true;
                  gameEndReason = 'Out of lives! Too many items missed.';
                }
                setLifeLostAnimation(true);
                return newLives;
              });
            }
            return { ...item, shouldRemove: true };
          }

          return { ...item, y: newY };
        });

        if (shouldEndGame) {
          endGame(gameEndReason);
          return [];
        }

        return itemsToProcess.filter(item => !item.shouldRemove);
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, assignedBin, binPosition, screenHeight, endGame, dropSpeed, processedCollisions]);

  useEffect(() => {
    if (scoreAnimation) {
      const timer = setTimeout(() => setScoreAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [scoreAnimation]);

  useEffect(() => {
    if (lifeLostAnimation) {
      const timer = setTimeout(() => setLifeLostAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lifeLostAnimation]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {!gameStarted && !gameOver && <Instructions onStart={startGame} />}
      
      {gameStarted && !gameOver && (
        <>
          <div className="absolute top-4 left-4 text-white">
            <div className="text-xl mb-2">Player: {playerInfo?.name}</div>
            <div className="relative">
              <div className={`text-xl mb-2 transition-all duration-200 ${scoreAnimation ? 'scale-125' : ''}`}>
                Score: {score}
              </div>
              {scoreAnimation && (
                <div 
                  className="absolute text-green-400 text-lg animate-bounce-fade"
                  style={{ 
                    left: `${lastScorePosition.x}px`, 
                    top: `${lastScorePosition.y}px` 
                  }}
                >
                  +1
                </div>
              )}
            </div>
            <div className="flex mt-2 items-center">
              {[...Array(INITIAL_LIVES)].map((_, i) => (
                <div 
                  key={i} 
                  className={`transition-transform duration-200 ${
                    i === lives && lifeLostAnimation ? 'scale-150' : ''
                  }`}
                >
                  {i < lives ? (
                    <Heart className="w-6 h-6 text-red-500 mr-1" />
                  ) : (
                    <HeartCrack className={`w-6 h-6 mr-1 ${
                      i === lives && lifeLostAnimation ? 'text-red-600' : 'text-gray-500'
                    }`} />
                  )}
                </div>
              ))}
              {lifeLostAnimation && (
                <div className="text-red-400 text-lg ml-2 animate-fade-out">
                  Life Lost!
                </div>
              )}
            </div>
            <div className="mt-4 text-xl">
              Collecting: {assignedBin} Waste
            </div>
          </div>

          <div 
            className="relative mx-auto h-full touch-none"
            style={{ width: gameWidth }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {items.map(item => (
              <WasteItem 
                key={item.id} 
                {...item} 
                dropSpeed={dropSpeed}
                isCollected={item.isCollected}
              />
            ))}
            <Bin position={binPosition} category={assignedBin} />
          </div>

          <div className="absolute bottom-4 left-4 text-white text-sm">
            <p className="hidden md:block">Use left and right arrow keys to move the bin (hold Shift for faster movement)</p>
            <p className="md:hidden">Swipe left or right to move the bin</p>
            <p>Collect only {assignedBin} waste items!</p>
          </div>
        </>
      )}

      {gameOver && (
        <GameOver
          score={score}
          reason={gameOverReason}
          onRestart={() => startGame(playerInfo?.name || '')}
          highScores={highScores}
          playerName={playerInfo?.name || ''}
        />
      )}
    </div>
  );
}

export default App;
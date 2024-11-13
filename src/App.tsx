import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, HeartCrack } from 'lucide-react';
import Bin from './components/Bin';
import WasteItem from './components/WasteItem';
import GameOver from './components/GameOver';
import Instructions from './components/Instructions';
import type { WasteCategory, Score, PlayerInfo, ExtendedWasteItem } from './types';

const GAME_WIDTH = 800;
const BIN_WIDTH = 64;
const INITIAL_LIVES = 3;
const BIN_TOP_Y = 0.85; // Position of bin top relative to screen height
const BIN_COLLECTION_ZONE = 60; // Increased for better detection
const BIN_HIT_ZONE = BIN_WIDTH * 0.8; // Wider hit zone
const BIN_MOVE_SPEED = 10;
const INITIAL_DROP_SPEED = 1.5;
const MAX_DROP_SPEED = 4;
const SPEED_INCREMENT = 0.25;
const SPEED_INTERVAL = 15000;
const INITIAL_SPAWN_INTERVAL = 2500;
const MIN_SPAWN_INTERVAL = 1000;
const ITEM_SIZE = 40; // Size of waste items for collision detection
const COMBO_MULTIPLIER = 0.5; // Each combo adds 50% more points
const MAX_COMBO = 5; // Maximum combo multiplier
const DIFFICULTY_INTERVAL = 6000; // Increase difficulty every 6 seconds

const VERTICAL_SAFE_DISTANCE = ITEM_SIZE * 4; // Minimum vertical gap between items
const HORIZONTAL_SAFE_DISTANCE = ITEM_SIZE * 2; // Minimum horizontal gap between items

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
  const [gameWidth, setGameWidth] = useState(Math.min(GAME_WIDTH, window.innerWidth));
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [lifeLostAnimation, setLifeLostAnimation] = useState(false);
  const [lastScorePosition, setLastScorePosition] = useState({ x: 0, y: 0 });
  const [comboCount, setComboCount] = useState(0);
  const [lastCollectedType, setLastCollectedType] = useState<WasteCategory | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const processedCollisions = useRef<Set<string>>(new Set());
  const dropSpeedRef = useRef(INITIAL_DROP_SPEED);
  const spawnIntervalRef = useRef(INITIAL_SPAWN_INTERVAL);
  const binDirection = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const animationFrameId = useRef<number | null>(null);
  const binMoveIntervalId = useRef<number | null>(null);
  const spawnTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const difficultyIntervalId = useRef<NodeJS.Timeout | null>(null);

  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const difficultyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
      setGameWidth(Math.min(GAME_WIDTH, window.innerWidth));
      setBinPosition(prev => Math.min(Math.max(BIN_WIDTH / 2, prev), Math.min(GAME_WIDTH, window.innerWidth) - BIN_WIDTH / 2));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start Game
  const startGame = useCallback((name: string) => {
    if (!name.trim()) return;

    setPlayerInfo({ name: name.toUpperCase() });
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(INITIAL_LIVES);
    setItems([]);
    setComboCount(0);
    setLastCollectedType(null);
    setDifficultyLevel(1);
    dropSpeedRef.current = INITIAL_DROP_SPEED;
    spawnIntervalRef.current = INITIAL_SPAWN_INTERVAL;
    setAssignedBin(['Wet', 'Dry', 'Hazardous'][Math.floor(Math.random() * 3)] as WasteCategory);
    setBinPosition(gameWidth / 2);
    processedCollisions.current.clear();
  }, [gameWidth]);

  // End Game
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

  // Keyboard Handlers
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        binDirection.current.left = true;
      } else if (e.key === 'ArrowRight') {
        binDirection.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        binDirection.current.left = false;
      } else if (e.key === 'ArrowRight') {
        binDirection.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  // Bin Movement
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveBin = () => {
      if (binDirection.current.left || binDirection.current.right) {
        const moveDistance = BIN_MOVE_SPEED * (binDirection.current.left ? -1 : 1);
        setBinPosition(pos => {
          const newPos = pos + moveDistance;
          return Math.max(BIN_WIDTH / 2, Math.min(gameWidth - BIN_WIDTH / 2, newPos));
        });
      }
    };

    binMoveIntervalId.current = window.setInterval(moveBin, 16);
    return () => {
      if (binMoveIntervalId.current !== null) {
        clearInterval(binMoveIntervalId.current);
      }
    };
  }, [gameStarted, gameOver, gameWidth]);

  // Difficulty Increment
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    difficultyIntervalId.current = setInterval(() => {
      dropSpeedRef.current = Math.min(dropSpeedRef.current + SPEED_INCREMENT, MAX_DROP_SPEED);
      spawnIntervalRef.current = Math.max(spawnIntervalRef.current * 0.97, MIN_SPAWN_INTERVAL);
    }, SPEED_INTERVAL);

    return () => {
      if (difficultyIntervalId.current !== null) {
        clearInterval(difficultyIntervalId.current);
      }
    };
  }, [gameStarted, gameOver]);

  // Spawn Items
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnItem = () => {
      const itemsToSpawn = Math.min(Math.floor(difficultyLevel / 3) + 1, 2);
      const usedCategories = new Set<WasteCategory>();
      const usedPositions: { x: number, y: number }[] = [];

      // Helper to check if a position is safe
      const isPositionSafe = (x: number, y: number): boolean => {
        return !usedPositions.some(pos => {
          const xDist = Math.abs(pos.x - x);
          const yDist = Math.abs(pos.y - y);
          return xDist < HORIZONTAL_SAFE_DISTANCE && yDist < VERTICAL_SAFE_DISTANCE;
        });
      };

      // Helper to get a random category not yet used
      const getNextCategory = (): WasteCategory => {
        const categories: WasteCategory[] = ['Wet', 'Dry', 'Hazardous'];
        const availableCategories = categories.filter(cat => !usedCategories.has(cat));
        return availableCategories[Math.floor(Math.random() * availableCategories.length)];
      };

      // Spawn items with safe spacing
      for (let i = 0; i < itemsToSpawn; i++) {
        let safeX: number;
        let safeY: number;
        let attempts = 0;
        const maxAttempts = 10;

        // Find a safe position
        do {
          safeX = Math.random() * (gameWidth - ITEM_SIZE);
          safeY = -ITEM_SIZE - (Math.random() * VERTICAL_SAFE_DISTANCE * i);
          attempts++;
        } while (!isPositionSafe(safeX, safeY) && attempts < maxAttempts);

        // Only spawn if we found a safe position
        if (attempts < maxAttempts) {
          const category = getNextCategory();
          const randomItem = wasteItems.find(item => item.type === category);
          
          if (randomItem) {
            usedCategories.add(category);
            usedPositions.push({ x: safeX, y: safeY });

            setItems(prev => [...prev, {
              ...randomItem,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + i,
              x: safeX,
              y: safeY,
              isCollected: false
            }]);
          }
        }
      }

      spawnTimeoutId.current = setTimeout(spawnItem, spawnIntervalRef.current);
    };

    spawnTimeoutId.current = setTimeout(spawnItem, spawnIntervalRef.current);

    return () => {
      if (spawnTimeoutId.current) {
        clearTimeout(spawnTimeoutId.current);
      }
    };
  }, [gameStarted, gameOver, gameWidth, difficultyLevel]);

  // Game Loop using requestAnimationFrame
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      setItems(prevItems => {
        const updatedItems: ExtendedWasteItem[] = [];

        prevItems.forEach(item => {
          if (item.isCollected) {
            return;
          }

          const newY = item.y + dropSpeedRef.current;
          const itemCenterY = newY + ITEM_SIZE / 2;
          const itemCenterX = item.x + ITEM_SIZE / 2;
          const binTopY = screenHeight * BIN_TOP_Y;

          // Check for collisions near the bin's top edge for wrong items
          if (!processedCollisions.current.has(item.id) && 
              item.type !== assignedBin && 
              Math.abs(itemCenterY - binTopY) < 10) { // Small tolerance zone at bin top
            
            const binLeftEdge = binPosition - BIN_HIT_ZONE / 2;
            const binRightEdge = binPosition + BIN_HIT_ZONE / 2;

            if (itemCenterX >= binLeftEdge && itemCenterX <= binRightEdge) {
              processedCollisions.current.add(item.id);
              endGame(`Wrong bin! ${item.name} doesn't belong in the ${assignedBin} waste bin!`);
              return;
            }
          }

          // Check for correct item collisions within collection zone
          if (!processedCollisions.current.has(item.id) && 
              item.type === assignedBin &&
              itemCenterY >= binTopY - BIN_COLLECTION_ZONE && 
              itemCenterY <= binTopY + BIN_COLLECTION_ZONE) {
            
            const binLeftEdge = binPosition - BIN_HIT_ZONE / 2;
            const binRightEdge = binPosition + BIN_HIT_ZONE / 2;

            if (itemCenterX >= binLeftEdge && itemCenterX <= binRightEdge) {
              processedCollisions.current.add(item.id);
              
              const comboBonus = Math.min(comboCount, MAX_COMBO) * COMBO_MULTIPLIER;
              const pointsToAdd = Math.ceil(1 + comboBonus);
              
              setScore(prev => prev + pointsToAdd);
              setScoreAnimation(true);
              setLastScorePosition({ x: item.x, y: item.y });
              
              if (lastCollectedType === assignedBin) {
                setComboCount(prev => prev + 1);
              } else {
                setComboCount(1);
              }
              setLastCollectedType(assignedBin);
              return;
            }
          }

          // Check if correct item has passed the collection zone
          if (newY > binTopY + BIN_COLLECTION_ZONE) {
            if (item.type === assignedBin && !processedCollisions.current.has(item.id)) {
              processedCollisions.current.add(item.id);
              setLives(prev => prev - 1);
              setLifeLostAnimation(true);
              if (lives <= 1) {
                endGame(`Game Over! You ran out of lives!`);
              }
              return;
            }
          }

          // Continue updating position for items that haven't been collected
          updatedItems.push({ ...item, y: newY });
        });

        return updatedItems;
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, gameOver, assignedBin, binPosition, screenHeight, endGame]);

  // Score Animation
  useEffect(() => {
    if (scoreAnimation) {
      const timer = setTimeout(() => setScoreAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [scoreAnimation]);

  // Life Lost Animation
  useEffect(() => {
    if (lifeLostAnimation) {
      const timer = setTimeout(() => setLifeLostAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lifeLostAnimation]);

  // Touch Handlers
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;

    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartXRef.current;

    requestAnimationFrame(() => {
      setBinPosition(prev => {
        const newPos = prev + deltaX;
        return Math.max(BIN_WIDTH / 2, Math.min(gameWidth - BIN_WIDTH / 2, newPos));
      });
    });

    touchStartXRef.current = touchX;
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
  };

  // Add new useEffect for the timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      // Time limit removed - game continues until player loses all lives
    }, 100);

    gameTimerRef.current = timer;
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, score]);

  // Add new useEffect for difficulty progression
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const increaseDifficulty = () => {
      setDifficultyLevel(prev => prev + 1);
      
      // Gentler drop speed increase
      dropSpeedRef.current = Math.min(
        INITIAL_DROP_SPEED + (difficultyLevel * SPEED_INCREMENT * 0.5),
        MAX_DROP_SPEED
      );

      // Gentler spawn interval decrease
      spawnIntervalRef.current = Math.max(
        INITIAL_SPAWN_INTERVAL * Math.pow(0.92, difficultyLevel),
        MIN_SPAWN_INTERVAL
      );
    };

    const difficultyTimer = setInterval(increaseDifficulty, DIFFICULTY_INTERVAL);
    difficultyTimerRef.current = difficultyTimer;

    return () => {
      if (difficultyTimerRef.current) {
        clearInterval(difficultyTimerRef.current);
      }
    };
  }, [gameStarted, gameOver, difficultyLevel]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {!gameStarted && !gameOver && <Instructions onStart={startGame} />}

      {gameStarted && !gameOver && (
        <>
          <div className="absolute top-4 left-4 text-white">
            <div className="text-xl mb-2">Player: {playerInfo?.name}</div>
            <div className="relative">
              <div className={`text-xl mb-2 transition-transform duration-200 ${scoreAnimation ? 'scale-125' : ''}`}>
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
                  +{Math.ceil(1 + Math.min(comboCount, MAX_COMBO) * COMBO_MULTIPLIER)}
                </div>
              )}
            </div>
            <div className="flex mt-2 items-center">
              {[...Array(INITIAL_LIVES)].map((_, i) => (
                <div 
                  key={i} 
                  className={`transition-transform duration-200 ${
                    i >= lives && lifeLostAnimation ? 'scale-150' : ''
                  }`}
                >
                  {i < lives ? (
                    <Heart className="w-6 h-6 text-red-500 mr-1" />
                  ) : (
                    <HeartCrack className={`w-6 h-6 mr-1 ${
                      i >= lives && lifeLostAnimation ? 'text-red-600' : 'text-gray-500'
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
                dropSpeed={dropSpeedRef.current}
                isCollected={item.isCollected || false}
              />
            ))}
            <Bin position={binPosition} category={assignedBin} />
          </div>

          <div className="absolute bottom-4 left-4 text-white text-sm">
            <p className="hidden md:block">Use left and right arrow keys to move the bin (hold Shift for faster movement)</p>
            <p className="md:hidden">Swipe left or right to move the bin</p>
            <p>Collect only {assignedBin} waste items!</p>
          </div>

          <div className="absolute top-4 right-4 text-white">
            <div className="text-xl mb-2">
              Level: {difficultyLevel}
            </div>
            {comboCount > 1 && (
              <div className="text-yellow-400 text-xl">
                Combo x{Math.min(comboCount, MAX_COMBO)}
              </div>
            )}
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
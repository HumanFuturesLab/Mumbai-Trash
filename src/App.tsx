import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, HeartCrack } from 'lucide-react';
import Bin from './components/Bin';
import WasteItem from './components/WasteItem';
import GameOver from './components/GameOver';
import Instructions from './components/Instructions';
import type { WasteCategory, Score, PlayerInfo, ExtendedWasteItem } from './types';

const GAME_WIDTH = 800;
const BIN_WIDTH = 80;
const INITIAL_LIVES = 3;
const BIN_TOP_Y = 0.85;
const BIN_COLLECTION_ZONE = 80;
const BIN_HIT_ZONE = BIN_WIDTH * 0.9;
const BIN_MOVE_SPEED = 12;
const INITIAL_DROP_SPEED = 1.0;
const MAX_DROP_SPEED = 2.8;
const SPEED_INCREMENT = 0.1;
const SPEED_INTERVAL = 25000;
const INITIAL_SPAWN_INTERVAL = 3500;
const MIN_SPAWN_INTERVAL = 1800;
const ITEM_SIZE = 48;
const COMBO_MULTIPLIER = 1.0;
const MAX_COMBO = 10;
const DIFFICULTY_INTERVAL = 12000;

const VERTICAL_SAFE_DISTANCE = ITEM_SIZE * 6;
const HORIZONTAL_SAFE_DISTANCE = ITEM_SIZE * 3;

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

const SPAWN_PATTERNS = {
  TUTORIAL: [
    { type: 'Wet', delay: 1000 },
    { type: 'Wet', delay: 2500 },
    { type: 'Dry', delay: 4000 },
    { type: 'Wet', delay: 5500 },
  ],
  EARLY_GAME: [
    { correctProb: 0.8, maxItems: 1 }, // Level 2
    { correctProb: 0.7, maxItems: 1 }, // Level 3
    { correctProb: 0.6, maxItems: 2 }, // Level 4
  ],
  MID_GAME: [
    { correctProb: 0.5, maxItems: 2 }, // Level 5-6
    { correctProb: 0.5, maxItems: 2 }, // Level 7-8
  ],
  LATE_GAME: [
    { correctProb: 0.4, maxItems: 2 }, // Level 9+
    { correctProb: 0.4, maxItems: 3 }  // Level 10+
  ]
};

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
  const binDirection = useRef<{ left: boolean; right: boolean; speedBoost: number }>({ left: false, right: false, speedBoost: 1 });
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
      const speedMultiplier = e.shiftKey ? 2 : 1;
      if (e.key === 'ArrowLeft') {
        binDirection.current.left = true;
        binDirection.current.speedBoost = speedMultiplier;
      } else if (e.key === 'ArrowRight') {
        binDirection.current.right = true;
        binDirection.current.speedBoost = speedMultiplier;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        binDirection.current.left = false;
      } else if (e.key === 'ArrowRight') {
        binDirection.current.right = false;
      }
      if (!binDirection.current.left && !binDirection.current.right) {
        binDirection.current.speedBoost = 1;
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
        const speedBoost = binDirection.current.speedBoost || 1;
        const moveDistance = BIN_MOVE_SPEED * speedBoost * (binDirection.current.left ? -1 : 1);
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
      // Get spawn configuration based on difficulty level
      let spawnConfig;
      if (difficultyLevel === 1) {
        spawnConfig = SPAWN_PATTERNS.TUTORIAL[0];
      } else if (difficultyLevel <= 4) {
        spawnConfig = SPAWN_PATTERNS.EARLY_GAME[difficultyLevel - 2];
      } else if (difficultyLevel <= 8) {
        spawnConfig = SPAWN_PATTERNS.MID_GAME[Math.floor((difficultyLevel - 5) / 2)];
      } else {
        spawnConfig = SPAWN_PATTERNS.LATE_GAME[Math.min(Math.floor((difficultyLevel - 9) / 2), SPAWN_PATTERNS.LATE_GAME.length - 1)];
      }

      const itemsToSpawn = Math.min(spawnConfig.maxItems || 1, 3);
      const usedPositions: { x: number, y: number }[] = [];

      // Helper to check if a position is safe
      const isPositionSafe = (x: number, y: number): boolean => {
        return !usedPositions.some(pos => {
          const xDist = Math.abs(pos.x - x);
          const yDist = Math.abs(pos.y - y);
          return xDist < HORIZONTAL_SAFE_DISTANCE && yDist < VERTICAL_SAFE_DISTANCE;
        });
      };

      // Helper to get a random category with weighted probability
      const getRandomCategory = (): WasteCategory => {
        const isCorrect = Math.random() < (spawnConfig.correctProb || 0.5);
        if (isCorrect) {
          return assignedBin;
        } else {
          const otherTypes = ['Wet', 'Dry', 'Hazardous'].filter(type => type !== assignedBin);
          return otherTypes[Math.floor(Math.random() * otherTypes.length)] as WasteCategory;
        }
      };

      // Spawn items with improved positioning
      for (let i = 0; i < itemsToSpawn; i++) {
        let safeX: number;
        let safeY: number;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          // Divide screen into sections for better distribution
          const section = gameWidth / itemsToSpawn;
          const sectionStart = i * section;
          const sectionEnd = (i + 1) * section;
          
          safeX = sectionStart + Math.random() * (sectionEnd - sectionStart - ITEM_SIZE);
          safeY = -ITEM_SIZE - (Math.random() * VERTICAL_SAFE_DISTANCE * i);
          attempts++;
        } while (!isPositionSafe(safeX, safeY) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
          const category = getRandomCategory();
          const randomItem = wasteItems.find(item => item.type === category);
          
          if (randomItem) {
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

    // Start with tutorial pattern if it's the first level
    if (difficultyLevel === 1) {
      SPAWN_PATTERNS.TUTORIAL.forEach(({ type, delay }) => {
        setTimeout(() => {
          const tutorialItem = wasteItems.find(item => item.type === type);
          if (tutorialItem) {
            setItems(prev => [...prev, {
              ...tutorialItem,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              x: gameWidth / 2,
              y: -ITEM_SIZE,
              isCollected: false
            }]);
          }
        }, delay);
      });
      spawnTimeoutId.current = setTimeout(spawnItem, 6000); // Start normal spawning after tutorial
    } else {
      spawnTimeoutId.current = setTimeout(spawnItem, spawnIntervalRef.current);
    }

    return () => {
      if (spawnTimeoutId.current) {
        clearTimeout(spawnTimeoutId.current);
      }
    };
  }, [gameStarted, gameOver, gameWidth, difficultyLevel, assignedBin]);

  // Update scoring system
  const calculateScore = useCallback((comboCount: number) => {
    const basePoints = 1;
    const comboBonus = Math.min(comboCount, MAX_COMBO) * COMBO_MULTIPLIER;
    const levelBonus = Math.log(difficultyLevel) * 0.2;
    return Math.ceil(basePoints + comboBonus + levelBonus);
  }, [difficultyLevel]);

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

          // Improved collision detection with gradual scoring zone
          if (!processedCollisions.current.has(item.id)) {
            const binLeftEdge = binPosition - BIN_HIT_ZONE / 2;
            const binRightEdge = binPosition + BIN_HIT_ZONE / 2;
            const inBinXRange = itemCenterX >= binLeftEdge && itemCenterX <= binRightEdge;
            const distanceToBinTop = Math.abs(itemCenterY - binTopY);

            // Wrong item collision
            if (item.type !== assignedBin && 
                inBinXRange && 
                distanceToBinTop < 10) {
              processedCollisions.current.add(item.id);
              endGame(`Wrong bin! ${item.name} doesn't belong in the ${assignedBin} waste bin!`);
              return;
            }

            // Correct item collection with distance-based scoring
            if (item.type === assignedBin &&
                inBinXRange &&
                distanceToBinTop <= BIN_COLLECTION_ZONE) {
              processedCollisions.current.add(item.id);
              
              const points = calculateScore(comboCount);
              setScore(prev => prev + points);
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

          // Life loss check
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

          // Remove items that are off screen
          if (newY < window.innerHeight + ITEM_SIZE) {
            updatedItems.push({ ...item, y: newY });
          }
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
  }, [gameStarted, gameOver, assignedBin, binPosition, screenHeight, endGame, lives, comboCount, lastCollectedType, calculateScore]);

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
    const sensitivity = 1.2; // Add touch sensitivity multiplier

    requestAnimationFrame(() => {
      setBinPosition(prev => {
        const newPos = prev + (deltaX * sensitivity);
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

  // Update difficulty progression
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const increaseDifficulty = () => {
      setDifficultyLevel(prev => {
        const newLevel = prev + 1;
        
        // Smoother difficulty curve
        dropSpeedRef.current = Math.min(
          INITIAL_DROP_SPEED + (Math.log(newLevel) * SPEED_INCREMENT),
          MAX_DROP_SPEED
        );

        // Smoother spawn interval reduction
        spawnIntervalRef.current = Math.max(
          INITIAL_SPAWN_INTERVAL * Math.pow(0.95, newLevel),
          MIN_SPAWN_INTERVAL
        );

        // Change waste type every few levels
        if (newLevel % 3 === 0) {
          const currentType = assignedBin;
          const availableTypes = ['Wet', 'Dry', 'Hazardous'].filter(type => type !== currentType);
          const newType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          setAssignedBin(newType as WasteCategory);
        }

        return newLevel;
      });
    };

    const difficultyTimer = setInterval(increaseDifficulty, DIFFICULTY_INTERVAL);
    difficultyTimerRef.current = difficultyTimer;

    return () => {
      if (difficultyTimerRef.current) {
        clearInterval(difficultyTimerRef.current);
      }
    };
  }, [gameStarted, gameOver, assignedBin]);

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
          playerName={playerInfo?.name || ''}
        />
      )}
    </div>
  );
}

export default App;
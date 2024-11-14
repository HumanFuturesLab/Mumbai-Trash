import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, HeartCrack } from 'lucide-react';
import Bin from './components/Bin';
import WasteItem from './components/WasteItem';
import GameOver from './components/GameOver';
import Instructions from './components/Instructions';
import type { WasteCategory, Score, PlayerInfo, ExtendedWasteItem } from './types';

const GAME_WIDTH = 800;
const BIN_WIDTH = 64;
const INITIAL_LIVES = 3;
const BIN_TOP_Y = 0.85;
const BIN_COLLECTION_ZONE = 60;
const INITIAL_DROP_SPEED = 1.5;
const SPEED_INCREMENT = 0.25;
const INITIAL_SPAWN_INTERVAL = 2500;
const MIN_SPAWN_INTERVAL = 1000;
const ITEM_SIZE = 40;
const COMBO_MULTIPLIER = 0.5;
const MAX_COMBO = 5;
const DIFFICULTY_INTERVAL = 6000;


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
  const [scoreAnimation] = useState(false);
  const [lifeLostAnimation] = useState(false);
  const [lastScorePosition] = useState({ x: 0, y: 0 });
  const [comboCount, setComboCount] = useState(0);
  const [, setLastCollectedType] = useState<WasteCategory | null>(null);

  const processedCollisions = useRef<Set<string>>(new Set());
  const dropSpeedRef = useRef(INITIAL_DROP_SPEED);
  const spawnIntervalRef = useRef(INITIAL_SPAWN_INTERVAL);
  const animationFrameId = useRef<number | null>(null);
  const spawnTimeoutId = useRef<NodeJS.Timeout | null>(null);

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
      const newHighScore = { name: playerInfo.name, points: score, date: new Date().toISOString() };
      const newHighScores = [...highScores, newHighScore];
      newHighScores.sort((a, b) => b.points - a.points);
      setHighScores(newHighScores.slice(0, 10));
      localStorage.setItem('highScores', JSON.stringify(newHighScores.slice(0, 10)));
    }
  }, [gameStarted, gameOver, difficultyLevel, highScores, playerInfo, score]);

  // Define spawnItem and other game mechanics here
  // ...

  // Handle Collision Detection and Item Collection
  const checkCollisions = useCallback(() => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (processedCollisions.current.has(item.id) || item.isCollected) {
          return item;
        }

        const itemBottom = item.y + ITEM_SIZE;
        const binTop = screenHeight * BIN_TOP_Y;
        const binLeft = binPosition - BIN_WIDTH / 2;
        const binRight = binPosition + BIN_WIDTH / 2;

        // Calculate item center
        const itemCenter = item.x + ITEM_SIZE / 2;

        // Check if item is within collection zone
        if (itemBottom >= binTop && itemBottom <= binTop + BIN_COLLECTION_ZONE) {
          if (itemCenter >= binLeft && itemCenter <= binRight) {
            // Item is collected
            processedCollisions.current.add(item.id);

            // Update score and combo
            const isCorrect = item.type === assignedBin;
            if (isCorrect) {
              setScore(prev => prev + Math.ceil(1 + Math.min(comboCount, MAX_COMBO) * COMBO_MULTIPLIER));
              setComboCount(prev => prev + 1);
              setLastCollectedType(item.type);
            } else {
              setLives(prev => prev - 1);
              setComboCount(0);
              setLastCollectedType(null);
              if (lives <= 1) {
                endGame('Collected incorrect item!');
              }
            }

            // Update item as collected
            return { ...item, isCollected: true };
          }
        }

        // Check if item is missed
        if (itemBottom > screenHeight + ITEM_SIZE) {
          if (item.type === assignedBin) {
            setLives(prev => prev - 1);
            setComboCount(0);
            setLastCollectedType(null);
            if (lives <= 1) {
              endGame('Missed too many items!');
            }
          }
          return { ...item, isCollected: true };
        }

        return item;
      })
    );
  }, [assignedBin, binPosition, endGame, comboCount, lives, screenHeight]);

  // Animation Loop
  useEffect(() => {
    const animate = () => {
      setItems(currentItems =>
        currentItems.map(item => ({
          ...item,
          y: item.y + dropSpeedRef.current,
        }))
      );
      checkCollisions();
      animationFrameId.current = requestAnimationFrame(animate);
    };

    if (gameStarted) {
      animationFrameId.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, checkCollisions]);

  // Spawn Items at Intervals
  useEffect(() => {
    const spawn = () => {
      spawnItem();
      spawnTimeoutId.current = setTimeout(spawn, spawnIntervalRef.current);
    };

    if (gameStarted) {
      spawn();
    }

    return () => {
      if (spawnTimeoutId.current) {
        clearTimeout(spawnTimeoutId.current);
      }
    };
  }, [gameStarted]);

  // Increase difficulty over time
  useEffect(() => {
    if (gameStarted) {
      difficultyTimerRef.current = setInterval(() => {
        setDifficultyLevel(prev => prev + 1);
        dropSpeedRef.current += SPEED_INCREMENT;
        if (spawnIntervalRef.current > MIN_SPAWN_INTERVAL) {
          spawnIntervalRef.current -= 200; // Decrease spawn interval to spawn faster
        }
      }, DIFFICULTY_INTERVAL);

      return () => {
        if (difficultyTimerRef.current) {
          clearInterval(difficultyTimerRef.current);
        }
      };
    }
  }, [gameStarted]);

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
            // Event handlers (handleTouchStart, etc.) need to be defined properly
            // onTouchStart={handleTouchStart}
            // onTouchMove={handleTouchMove}
            // onTouchEnd={handleTouchEnd}
          >
            {items.map(item => (
              <WasteItem 
                key={item.id} 
                {...item} 
              />
            ))}
            <Bin position={binPosition} category={assignedBin} />
          </div>

          <div className="absolute bottom-4 left-4 text-white text-sm">
            <p className="hidden md:block">
              Use left and right arrow keys to move the bin (hold Shift for faster movement)
            </p>
            <p className="md:hidden">
              Swipe left or right to move the bin
            </p>
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

function spawnItem() {
  throw new Error('Function not implemented.');
}

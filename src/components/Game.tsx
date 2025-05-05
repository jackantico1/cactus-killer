import React, { useEffect, useRef, useState } from 'react';
import { GameState, Tower, Cactus, Position, TowerType, TOWER_CONFIGS } from '../game/types';
import { WaveManager } from '../game/WaveManager';
import '../styles/Game.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const INITIAL_TOKENS = 300;
const INITIAL_LIVES = 10;

// Define the path that cacti will follow
const GAME_PATH: Position[] = [
  { x: 0, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 300 },
  { x: 400, y: 300 },
  { x: 400, y: 500 },
  { x: 600, y: 500 },
  { x: 600, y: 100 },
  { x: CANVAS_WIDTH, y: 100 }
];

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    tokens: INITIAL_TOKENS,
    wave: 1,
    lives: INITIAL_LIVES,
    towers: [],
    cacti: [],
    isGameOver: false,
    isPaused: false,
    score: 0
  });

  const waveManagerRef = useRef<WaveManager | null>(null);

  useEffect(() => {
    waveManagerRef.current = new WaveManager(
      GAME_PATH,
      (cactus) => setGameState(prev => ({ ...prev, cacti: [...prev.cacti, cactus] })),
      () => setGameState(prev => ({ ...prev, wave: prev.wave + 1 }))
    );
  }, []);

  // Game loop
  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = () => {
      if (!gameState.isPaused && !gameState.isGameOver) {
        updateGame();
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  // Start new wave when previous one is complete
  useEffect(() => {
    if (!waveManagerRef.current?.isWaveInProgress() && !gameState.isGameOver) {
      waveManagerRef.current?.startWave(gameState.wave);
    }
  }, [gameState.wave, gameState.isGameOver]);

  const updateGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw path
    drawPath(ctx);

    // Update and draw towers
    drawTowers(ctx);

    // Update and draw cacti
    updateCacti();
    drawCacti(ctx);

    // Check for collisions and handle tower shooting
    handleTowerShooting();
  };

  const drawPath = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(GAME_PATH[0].x, GAME_PATH[0].y);
    GAME_PATH.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 20;
    ctx.stroke();
  };

  const drawTowers = (ctx: CanvasRenderingContext2D) => {
    gameState.towers.forEach(tower => {
      ctx.beginPath();
      ctx.arc(tower.position.x, tower.position.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = getTowerColor(tower.type);
      ctx.fill();
      ctx.closePath();

      // Draw range circle when tower is selected
      if (selectedTowerType === tower.type) {
        ctx.beginPath();
        ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.stroke();
        ctx.closePath();
      }
    });
  };

  const getTowerColor = (type: TowerType): string => {
    switch (type) {
      case TowerType.WATER_CANNON: return '#4287f5';
      case TowerType.POISON_SPRAYER: return '#2ecc71';
      case TowerType.FIRE_TOWER: return '#e74c3c';
      case TowerType.ICE_TOWER: return '#3498db';
      case TowerType.LIGHTNING_ROD: return '#f1c40f';
    }
  };

  const drawCacti = (ctx: CanvasRenderingContext2D) => {
    gameState.cacti.forEach(cactus => {
      // Draw cactus body
      ctx.beginPath();
      ctx.arc(cactus.position.x, cactus.position.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#27ae60';
      ctx.fill();
      ctx.closePath();

      // Draw health bar
      const healthBarWidth = 30;
      const healthBarHeight = 5;
      const healthPercentage = cactus.health / cactus.maxHealth;

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(
        cactus.position.x - healthBarWidth / 2,
        cactus.position.y - 25,
        healthBarWidth,
        healthBarHeight
      );

      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(
        cactus.position.x - healthBarWidth / 2,
        cactus.position.y - 25,
        healthBarWidth * healthPercentage,
        healthBarHeight
      );
    });
  };

  const updateCacti = () => {
    setGameState(prevState => {
      const updatedCacti = prevState.cacti.map(cactus => {
        // Handle effects
        if (cactus.effects.poison) {
          cactus.health -= cactus.effects.poison.damage;
          cactus.effects.poison.duration--;
          if (cactus.effects.poison.duration <= 0) {
            delete cactus.effects.poison;
          }
        }

        if (cactus.effects.slow) {
          cactus.speed = cactus.baseSpeed * cactus.effects.slow.factor;
          cactus.effects.slow.duration--;
          if (cactus.effects.slow.duration <= 0) {
            delete cactus.effects.slow;
            cactus.speed = cactus.baseSpeed;
          }
        }

        // Move cactus along path
        if (cactus.currentPathIndex >= cactus.path.length - 1) {
          return cactus;
        }

        const nextPoint = cactus.path[cactus.currentPathIndex + 1];
        const dx = nextPoint.x - cactus.position.x;
        const dy = nextPoint.y - cactus.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < cactus.speed) {
          return {
            ...cactus,
            position: nextPoint,
            currentPathIndex: cactus.currentPathIndex + 1
          };
        }

        const ratio = cactus.speed / distance;
        return {
          ...cactus,
          position: {
            x: cactus.position.x + dx * ratio,
            y: cactus.position.y + dy * ratio
          }
        };
      });

      // Remove dead cacti and update score
      const remainingCacti = updatedCacti.filter(cactus => {
        if (cactus.health <= 0) {
          return false;
        }
        if (cactus.currentPathIndex >= cactus.path.length - 1) {
          prevState.lives--;
          return false;
        }
        return true;
      });

      // Check game over condition
      if (prevState.lives <= 0) {
        return { ...prevState, cacti: [], isGameOver: true };
      }

      return { ...prevState, cacti: remainingCacti };
    });
  };

  const handleTowerShooting = () => {
    const now = Date.now();
    setGameState(prevState => {
      const updatedTowers = [...prevState.towers];
      const updatedCacti = [...prevState.cacti];
      let tokensGained = 0;

      updatedTowers.forEach(tower => {
        if (now - tower.lastShot < 1000 / tower.fireRate) return;

        // Find closest cactus in range
        let closestCactus: Cactus | null = null;
        let closestDistance = Infinity;

        updatedCacti.forEach(cactus => {
          const distance = Math.sqrt(
            Math.pow(tower.position.x - cactus.position.x, 2) +
            Math.pow(tower.position.y - cactus.position.y, 2)
          );

          if (distance <= tower.range && distance < closestDistance) {
            closestDistance = distance;
            closestCactus = cactus;
          }
        });

        if (closestCactus) {
          tower.lastShot = now;
          const cactusIndex = updatedCacti.findIndex(c => c.id === closestCactus!.id);
          
          if (cactusIndex !== -1) {
            // Apply tower effects
            switch (tower.type) {
              case TowerType.POISON_SPRAYER:
                updatedCacti[cactusIndex].effects.poison = {
                  damage: tower.damage / 5,
                  duration: 50
                };
                break;
              case TowerType.ICE_TOWER:
                updatedCacti[cactusIndex].effects.slow = {
                  factor: 0.5,
                  duration: 30
                };
                break;
            }

            updatedCacti[cactusIndex].health -= tower.damage;
            
            if (updatedCacti[cactusIndex].health <= 0) {
              tokensGained += updatedCacti[cactusIndex].reward;
              updatedCacti.splice(cactusIndex, 1);
            }
          }
        }
      });

      return {
        ...prevState,
        towers: updatedTowers,
        cacti: updatedCacti,
        tokens: prevState.tokens + tokensGained,
        score: prevState.score + tokensGained
      };
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTowerType) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const towerConfig = TOWER_CONFIGS[selectedTowerType];
    if (gameState.tokens >= towerConfig.cost) {
      const newTower: Tower = {
        ...towerConfig,
        id: Math.random().toString(),
        position: { x, y },
        lastShot: 0
      };

      setGameState(prevState => ({
        ...prevState,
        tokens: prevState.tokens - towerConfig.cost,
        towers: [...prevState.towers, newTower]
      }));
    }
  };

  const handleRestartGame = () => {
    setGameState({
      tokens: INITIAL_TOKENS,
      wave: 1,
      lives: INITIAL_LIVES,
      towers: [],
      cacti: [],
      isGameOver: false,
      isPaused: false,
      score: 0
    });
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <div>Tokens: {gameState.tokens}</div>
        <div>Wave: {gameState.wave}</div>
        <div>Lives: {gameState.lives}</div>
        <div>Score: {gameState.score}</div>
      </div>
      <div className="tower-selection">
        {Object.values(TowerType).map(type => (
          <button
            key={type}
            className={`tower-button ${selectedTowerType === type ? 'selected' : ''}`}
            onClick={() => setSelectedTowerType(type)}
            disabled={gameState.tokens < TOWER_CONFIGS[type].cost}
          >
            {type} (Cost: {TOWER_CONFIGS[type].cost})
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="game-canvas"
      />
      {gameState.isGameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {gameState.score}</p>
          <button onClick={handleRestartGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Game; 
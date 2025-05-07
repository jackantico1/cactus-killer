import React, { useEffect, useRef, useState } from 'react';
import { Tower, Cactus, Position, TowerType, TOWER_CONFIGS, GameState } from '../game/types';
import { WaveManager } from '../game/WaveManager';
import { Projectile, createProjectile, drawProjectile } from '../game/Projectile';
import TowerIcon from './TowerIcon';
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

interface ExtendedGameState {
  tokens: number;
  wave: number;
  lives: number;
  towers: Tower[];
  cacti: Cactus[];
  projectiles: Projectile[];
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
}

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<ExtendedGameState>({
    tokens: INITIAL_TOKENS,
    wave: 1,
    lives: INITIAL_LIVES,
    towers: [],
    cacti: [],
    projectiles: [],
    isGameOver: false,
    isPaused: false,
    score: 0
  });
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [isWaveReady, setIsWaveReady] = useState(true);
  const [gameState, setGameState] = useState<ExtendedGameState>({
    tokens: INITIAL_TOKENS,
    wave: 1,
    lives: INITIAL_LIVES,
    towers: [],
    cacti: [],
    projectiles: [],
    isGameOver: false,
    isPaused: false,
    score: 0
  });

  const waveManagerRef = useRef<WaveManager | null>(null);

  // Update ref whenever gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    waveManagerRef.current = new WaveManager(
      GAME_PATH,
      (cactus) => setGameState(prev => ({ ...prev, cacti: [...prev.cacti, cactus] })),
      () => {
        setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
        setIsWaveReady(true);
      }
    );
  }, []);

  const updateGame = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw path first (bottom layer)
    drawPath(ctx);

    // Draw towers (middle layer)
    drawTowers(ctx);

    // Update game state
    const now = Date.now();
    const newProjectiles: Projectile[] = [];
    const updatedCacti = [...gameStateRef.current.cacti];
    let tokensGained = 0;

    // Handle tower shooting
    gameStateRef.current.towers.forEach(tower => {
      if (now - tower.lastShot < 1000 / tower.fireRate) return;

      // Find closest cactus in range
      let closestCactus: Cactus | null = null;
      let closestDistance = Infinity;

      for (const cactus of updatedCacti) {
        const dx = tower.position.x - cactus.position.x;
        const dy = tower.position.y - cactus.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= tower.range && distance < closestDistance) {
          closestDistance = distance;
          closestCactus = cactus;
        }
      }

      if (closestCactus !== null) {
        tower.lastShot = now;
        
        // Create new projectile
        const projectile = createProjectile(
          {
            x: tower.position.x,
            y: tower.position.y - 20
          },
          closestCactus.position,
          tower.type
        );
        newProjectiles.push(projectile);

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

    // Update projectiles
    const updatedProjectiles = gameStateRef.current.projectiles
      .map(projectile => {
        const dx = projectile.targetPosition.x - projectile.position.x;
        const dy = projectile.targetPosition.y - projectile.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          return null;
        }

        const speed = 8;
        const ratio = speed / distance;
        
        const newX = projectile.position.x + dx * ratio;
        const newY = projectile.position.y + dy * ratio;
        
        return {
          ...projectile,
          position: { x: newX, y: newY },
          progress: Math.min(1, projectile.progress + speed / 100)
        };
      })
      .filter((p): p is Projectile => p !== null);

    // Update cacti
    const finalCacti = updatedCacti.map(cactus => {
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

    // Filter out dead cacti and update lives
    const remainingCacti = finalCacti.filter(cactus => {
      if (cactus.health <= 0) {
        return false;
      }
      if (cactus.currentPathIndex >= cactus.path.length - 1) {
        return false;
      }
      return true;
    });

    const livesLost = finalCacti.length - remainingCacti.length;

    // Update state once with all changes
    setGameState(prevState => ({
      ...prevState,
      cacti: remainingCacti,
      projectiles: [...updatedProjectiles, ...newProjectiles],
      tokens: prevState.tokens + tokensGained,
      score: prevState.score + tokensGained,
      lives: prevState.lives - livesLost,
      isGameOver: prevState.lives - livesLost <= 0
    }));

    // Draw cacti (upper middle layer)
    drawCacti(ctx);

    // Draw projectiles last (top layer)
    if (gameStateRef.current.projectiles.length > 0) {
      drawProjectiles(ctx);
    }
  }, []);

  // Game loop
  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = () => {
      if (!gameStateRef.current.isPaused && !gameStateRef.current.isGameOver) {
        updateGame();
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [updateGame]);

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
    gameStateRef.current.towers.forEach(tower => {
      // Draw tower base
      ctx.beginPath();
      ctx.rect(tower.position.x - 20, tower.position.y - 20, 40, 40);
      ctx.fillStyle = '#666';
      ctx.fill();
      ctx.closePath();

      // Draw tower specific elements
      switch (tower.type) {
        case TowerType.WATER_CANNON:
          // Draw cannon barrel
          ctx.beginPath();
          ctx.rect(tower.position.x - 5, tower.position.y - 25, 10, 30);
          ctx.fillStyle = '#4287f5';
          ctx.fill();
          ctx.closePath();
          
          // Draw water tank
          ctx.beginPath();
          ctx.arc(tower.position.x, tower.position.y + 5, 15, 0, Math.PI * 2);
          ctx.fillStyle = '#87CEEB';
          ctx.fill();
          ctx.closePath();
          break;

        case TowerType.POISON_SPRAYER:
          // Draw toxic container
          ctx.beginPath();
          ctx.arc(tower.position.x, tower.position.y, 15, 0, Math.PI * 2);
          ctx.fillStyle = '#2ecc71';
          ctx.fill();
          ctx.closePath();
          
          // Draw spray nozzles
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(tower.position.x - 10 + i * 10, tower.position.y - 15, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#27ae60';
            ctx.fill();
            ctx.closePath();
          }
          break;

        case TowerType.FIRE_TOWER:
          // Draw tower body
          ctx.beginPath();
          ctx.moveTo(tower.position.x - 15, tower.position.y + 15);
          ctx.lineTo(tower.position.x, tower.position.y - 20);
          ctx.lineTo(tower.position.x + 15, tower.position.y + 15);
          ctx.closePath();
          ctx.fillStyle = '#e74c3c';
          ctx.fill();

          // Draw flames
          const flameColors = ['#f39c12', '#e67e22', '#d35400'];
          flameColors.forEach((color, i) => {
            ctx.beginPath();
            ctx.moveTo(tower.position.x - 10 + i * 10, tower.position.y - 15);
            ctx.quadraticCurveTo(
              tower.position.x - 5 + i * 10,
              tower.position.y - 30,
              tower.position.x + i * 10,
              tower.position.y - 15
            );
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
          });
          break;

        case TowerType.ICE_TOWER:
          // Draw ice crystal base
          ctx.beginPath();
          ctx.moveTo(tower.position.x, tower.position.y - 20);
          ctx.lineTo(tower.position.x + 15, tower.position.y);
          ctx.lineTo(tower.position.x, tower.position.y + 20);
          ctx.lineTo(tower.position.x - 15, tower.position.y);
          ctx.closePath();
          ctx.fillStyle = '#3498db';
          ctx.fill();

          // Draw frost effect
          ctx.beginPath();
          ctx.arc(tower.position.x, tower.position.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;

        case TowerType.LIGHTNING_ROD:
          // Draw rod
          ctx.beginPath();
          ctx.rect(tower.position.x - 3, tower.position.y - 25, 6, 50);
          ctx.fillStyle = '#f1c40f';
          ctx.fill();
          ctx.closePath();

          // Draw lightning bolts
          const boltPoints = [
            { x: -10, y: -15 },
            { x: 10, y: 0 },
            { x: -5, y: 5 },
            { x: 15, y: 15 }
          ];

          ctx.beginPath();
          ctx.moveTo(tower.position.x, tower.position.y - 25);
          boltPoints.forEach(point => {
            ctx.lineTo(tower.position.x + point.x, tower.position.y + point.y);
          });
          ctx.strokeStyle = '#f39c12';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
      }

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

  const drawCacti = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.cacti.forEach(cactus => {
      const x = cactus.position.x;
      const y = cactus.position.y;
      const size = 15;

      // Draw cactus body with 3D effect
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(x - size/2, y - size/2, 0, x, y, size);
      gradient.addColorStop(0, '#32CD32'); // Light green center
      gradient.addColorStop(1, '#228B22'); // Darker green edge
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#006400';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();

      // Draw spikes
      const numSpikes = 12;
      const spikeLength = 8;
      for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * Math.PI * 2;
        const innerX = x + Math.cos(angle) * size;
        const innerY = y + Math.sin(angle) * size;
        const outerX = x + Math.cos(angle) * (size + spikeLength);
        const outerY = y + Math.sin(angle) * (size + spikeLength);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }

      // Draw smaller segments for 3D effect
      const numSegments = 3;
      for (let i = 0; i < numSegments; i++) {
        const segmentSize = size * 0.4;
        const offsetX = Math.cos(i * Math.PI * 2/3) * size/2;
        const offsetY = Math.sin(i * Math.PI * 2/3) * size/2;
        
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, segmentSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();

        // Add spikes to segments
        const segmentSpikes = 6;
        for (let j = 0; j < segmentSpikes; j++) {
          const sAngle = (j / segmentSpikes) * Math.PI * 2;
          const sInnerX = x + offsetX + Math.cos(sAngle) * segmentSize;
          const sInnerY = y + offsetY + Math.sin(sAngle) * segmentSize;
          const sOuterX = x + offsetX + Math.cos(sAngle) * (segmentSize + spikeLength * 0.7);
          const sOuterY = y + offsetY + Math.sin(sAngle) * (segmentSize + spikeLength * 0.7);

          ctx.beginPath();
          ctx.moveTo(sInnerX, sInnerY);
          ctx.lineTo(sOuterX, sOuterY);
          ctx.strokeStyle = '#A0522D';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.closePath();
        }
      }

      // Draw health bar
      const healthBarWidth = 30;
      const healthBarHeight = 5;
      const healthPercentage = cactus.health / cactus.maxHealth;

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(
        x - healthBarWidth / 2,
        y - size - 15,
        healthBarWidth,
        healthBarHeight
      );

      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(
        x - healthBarWidth / 2,
        y - size - 15,
        healthBarWidth * healthPercentage,
        healthBarHeight
      );
    });
  };

  const drawProjectiles = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    gameStateRef.current.projectiles.forEach(projectile => {
      drawProjectile(ctx, projectile);
    });
    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTowerType) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const towerConfig = TOWER_CONFIGS[selectedTowerType];
    if (gameStateRef.current.tokens >= towerConfig.cost) {
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
      projectiles: [],
      isGameOver: false,
      isPaused: false,
      score: 0
    });
  };

  const handleStartWave = () => {
    if (isWaveReady && !gameStateRef.current.isGameOver) {
      setIsWaveReady(false);
      waveManagerRef.current?.startWave(gameStateRef.current.wave);
    }
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <div>Tokens: {gameStateRef.current.tokens}</div>
        <div>Wave: {gameStateRef.current.wave}</div>
        <div>Lives: {gameStateRef.current.lives}</div>
        <div>Score: {gameStateRef.current.score}</div>
        <button 
          className={`wave-button ${isWaveReady ? 'ready' : ''}`}
          onClick={handleStartWave}
          disabled={!isWaveReady || gameStateRef.current.isGameOver}
        >
          {isWaveReady ? 'Start Wave' : 'Wave in Progress'}
        </button>
      </div>
      <div className="tower-selection">
        {Object.values(TowerType).map(type => (
          <button
            key={type}
            className={`tower-button ${selectedTowerType === type ? 'selected' : ''}`}
            onClick={() => setSelectedTowerType(type)}
            disabled={gameStateRef.current.tokens < TOWER_CONFIGS[type].cost}
          >
            <div className="tower-button-content">
              <TowerIcon type={type} size={40} />
              <div className="tower-info">
                <div className="tower-name">{type}</div>
                <div className="tower-cost">Cost: {TOWER_CONFIGS[type].cost}</div>
              </div>
            </div>
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
      {gameStateRef.current.isGameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {gameStateRef.current.score}</p>
          <button onClick={handleRestartGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Game; 
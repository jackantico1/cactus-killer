import { Position, TowerType } from './types';

export interface Projectile {
  id: string;
  position: Position;
  targetPosition: Position;
  towerType: TowerType;
  progress: number;
  speed: number;
}

export const createProjectile = (
  startPos: Position,
  targetPos: Position,
  towerType: TowerType
): Projectile => ({
  id: Math.random().toString(),
  position: { ...startPos },
  targetPosition: { ...targetPos },
  towerType,
  progress: 0,
  speed: 0.1 // Adjust this value to change projectile speed
});

export const updateProjectile = (projectile: Projectile): Projectile => {
  const newProgress = projectile.progress + projectile.speed;
  
  if (newProgress >= 1) {
    return { ...projectile, progress: 1 };
  }

  const newX = projectile.position.x + (projectile.targetPosition.x - projectile.position.x) * projectile.speed;
  const newY = projectile.position.y + (projectile.targetPosition.y - projectile.position.y) * projectile.speed;

  return {
    ...projectile,
    position: { x: newX, y: newY },
    progress: newProgress
  };
};

export const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  const { position, towerType, progress } = projectile;
  const rotation = progress * Math.PI * 4; // Rotate projectiles as they move

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation);

  switch (towerType) {
    case TowerType.WATER_CANNON:
      // Animated water droplet
      const dropSize = 5 + Math.sin(progress * Math.PI * 2) * 2;
      ctx.beginPath();
      ctx.arc(0, 0, dropSize, 0, Math.PI * 2);
      const waterGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, dropSize);
      waterGradient.addColorStop(0, '#87CEEB');
      waterGradient.addColorStop(1, '#4682B4');
      ctx.fillStyle = waterGradient;
      ctx.fill();
      
      // Water trail
      ctx.beginPath();
      ctx.moveTo(-dropSize, 0);
      ctx.quadraticCurveTo(-dropSize * 3, -dropSize, -dropSize * 4, 0);
      ctx.quadraticCurveTo(-dropSize * 3, dropSize, -dropSize, 0);
      ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
      ctx.fill();
      break;

    case TowerType.POISON_SPRAYER:
      // Animated poison cloud
      const cloudSize = 8 + Math.sin(progress * Math.PI * 4) * 2;
      const poisonGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloudSize);
      poisonGradient.addColorStop(0, 'rgba(46, 204, 113, 0.8)');
      poisonGradient.addColorStop(0.6, 'rgba(46, 204, 113, 0.4)');
      poisonGradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
      
      ctx.beginPath();
      ctx.arc(0, 0, cloudSize, 0, Math.PI * 2);
      ctx.fillStyle = poisonGradient;
      ctx.fill();

      // Poison particles
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + progress * Math.PI * 4;
        const x = Math.cos(angle) * cloudSize * 0.7;
        const y = Math.sin(angle) * cloudSize * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#27ae60';
        ctx.fill();
      }
      break;

    case TowerType.FIRE_TOWER:
      // Animated fireball
      const fireSize = 6 + Math.sin(progress * Math.PI * 6) * 2;
      const fireColors = ['#e74c3c', '#e67e22', '#d35400'];
      
      fireColors.forEach((color, i) => {
        const size = fireSize * (1 - i * 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // Fire trail
      for (let i = 1; i <= 3; i++) {
        const trailSize = fireSize * (1 - i * 0.2);
        ctx.beginPath();
        ctx.arc(-i * 5, 0, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = fireColors[i - 1];
        ctx.globalAlpha = 0.5 / i;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;

    case TowerType.ICE_TOWER:
      // Animated ice crystal
      const crystalSize = 8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const point1X = Math.cos(angle) * crystalSize;
        const point1Y = Math.sin(angle) * crystalSize;
        const point2X = Math.cos(angle + Math.PI/6) * (crystalSize * 0.5);
        const point2Y = Math.sin(angle + Math.PI/6) * (crystalSize * 0.5);
        
        if (i === 0) {
          ctx.moveTo(point1X, point1Y);
        } else {
          ctx.lineTo(point1X, point1Y);
        }
        ctx.lineTo(point2X, point2Y);
      }
      ctx.closePath();
      
      const iceGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, crystalSize);
      iceGradient.addColorStop(0, '#A5F2F3');
      iceGradient.addColorStop(1, '#3498db');
      ctx.fillStyle = iceGradient;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      break;

    case TowerType.LIGHTNING_ROD:
      // Animated lightning bolt
      const boltLength = 12;
      const boltWidth = 3;
      const flickerIntensity = Math.random() * 0.4 + 0.6;
      
      // Main bolt
      ctx.beginPath();
      ctx.moveTo(0, -boltLength);
      ctx.lineTo(boltWidth, 0);
      ctx.lineTo(0, boltLength);
      ctx.lineTo(-boltWidth, 0);
      ctx.closePath();
      
      const boltGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, boltLength);
      boltGradient.addColorStop(0, `rgba(241, 196, 15, ${flickerIntensity})`);
      boltGradient.addColorStop(1, `rgba(243, 156, 18, ${flickerIntensity * 0.7})`);
      ctx.fillStyle = boltGradient;
      ctx.fill();

      // Electric arcs
      for (let i = 0; i < 3; i++) {
        const arcAngle = (i / 3) * Math.PI * 2 + progress * Math.PI * 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(arcAngle) * boltLength * 0.7,
          Math.sin(arcAngle) * boltLength * 0.7
        );
        ctx.strokeStyle = `rgba(241, 196, 15, ${flickerIntensity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;
  }

  ctx.restore();
}; 
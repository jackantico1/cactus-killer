import React from 'react';
import { TowerType } from '../game/types';

interface TowerIconProps {
  type: TowerType;
  size?: number;
}

export const TowerIcon: React.FC<TowerIconProps> = ({ type, size = 40 }) => {
  const drawTower = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number) => {
    const s = scale || 1;
    
    // Draw base for all towers
    ctx.beginPath();
    ctx.rect(centerX - 15 * s, centerY - 15 * s, 30 * s, 30 * s);
    ctx.fillStyle = '#555';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.closePath();

    switch (type) {
      case TowerType.WATER_CANNON:
        // Base structure
        ctx.beginPath();
        ctx.arc(centerX, centerY + 5 * s, 12 * s, 0, Math.PI * 2);
        ctx.fillStyle = '#4287f5';
        ctx.fill();
        ctx.strokeStyle = '#2d5ca8';
        ctx.stroke();
        ctx.closePath();

        // Cannon barrel
        ctx.beginPath();
        ctx.rect(centerX - 4 * s, centerY - 20 * s, 8 * s, 25 * s);
        ctx.fillStyle = '#2d5ca8';
        ctx.fill();
        ctx.strokeStyle = '#1a3c6e';
        ctx.stroke();
        ctx.closePath();

        // Water drops
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(centerX, centerY - (25 + i * 8) * s, 3 * s, 0, Math.PI * 2);
          ctx.fillStyle = '#87CEEB';
          ctx.fill();
          ctx.closePath();
        }
        break;

      case TowerType.POISON_SPRAYER:
        // Main container
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12 * s, 0, Math.PI * 2);
        ctx.fillStyle = '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2 * s;
        ctx.stroke();
        ctx.closePath();

        // Toxic symbol
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6 * s, 0, Math.PI * 2);
        ctx.moveTo(centerX - 8 * s, centerY);
        ctx.lineTo(centerX + 8 * s, centerY);
        ctx.moveTo(centerX, centerY - 8 * s);
        ctx.lineTo(centerX, centerY + 8 * s);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * s;
        ctx.stroke();
        ctx.closePath();

        // Spray nozzles
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.arc(centerX + (i * 8) * s, centerY - 12 * s, 3 * s, 0, Math.PI * 2);
          ctx.fillStyle = '#27ae60';
          ctx.fill();
          ctx.strokeStyle = '#219a52';
          ctx.stroke();
          ctx.closePath();
        }
        break;

      case TowerType.FIRE_TOWER:
        // Tower base
        ctx.beginPath();
        ctx.moveTo(centerX - 12 * s, centerY + 12 * s);
        ctx.lineTo(centerX, centerY - 15 * s);
        ctx.lineTo(centerX + 12 * s, centerY + 12 * s);
        ctx.closePath();
        ctx.fillStyle = '#c0392b';
        ctx.fill();
        ctx.strokeStyle = '#a93226';
        ctx.stroke();

        // Flames
        const flameColors = ['#e74c3c', '#d35400', '#e67e22'];
        flameColors.forEach((color, i) => {
          ctx.beginPath();
          ctx.moveTo(centerX + (-10 + i * 10) * s, centerY - 15 * s);
          ctx.quadraticCurveTo(
            centerX + (-5 + i * 10) * s,
            centerY - 30 * s,
            centerX + (0 + i * 10) * s,
            centerY - 15 * s
          );
          ctx.fillStyle = color;
          ctx.fill();
          ctx.closePath();
        });
        break;

      case TowerType.ICE_TOWER:
        // Crystal structure
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 15 * s);
        ctx.lineTo(centerX + 12 * s, centerY);
        ctx.lineTo(centerX, centerY + 15 * s);
        ctx.lineTo(centerX - 12 * s, centerY);
        ctx.closePath();
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.stroke();

        // Ice crystals
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(
            centerX + Math.cos(angle) * 8 * s,
            centerY + Math.sin(angle) * 8 * s
          );
          ctx.lineTo(
            centerX + Math.cos(angle + 0.2) * 15 * s,
            centerY + Math.sin(angle + 0.2) * 15 * s
          );
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 * s;
          ctx.stroke();
          ctx.closePath();
        }
        break;

      case TowerType.LIGHTNING_ROD:
        // Rod base
        ctx.beginPath();
        ctx.rect(centerX - 2 * s, centerY - 20 * s, 4 * s, 40 * s);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.stroke();
        ctx.closePath();

        // Lightning bolts
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 20 * s);
        ctx.lineTo(centerX - 8 * s, centerY - 10 * s);
        ctx.lineTo(centerX + 4 * s, centerY);
        ctx.lineTo(centerX - 8 * s, centerY + 10 * s);
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3 * s;
        ctx.stroke();
        ctx.closePath();

        // Energy orb
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6 * s, 0, Math.PI * 2);
        ctx.fillStyle = '#f39c12';
        ctx.fill();
        ctx.closePath();
        break;
    }
  };

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw tower
    drawTower(ctx, size / 2, size / 2, size / 50);
  }, [type, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
};

export default TowerIcon; 
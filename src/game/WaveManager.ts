import { Cactus, Position } from './types';

export class WaveManager {
  private readonly baseHealth = 100;
  private readonly baseSpeed = 0.5;
  private readonly baseReward = 25;
  private readonly waveCooldown = 5000; // 5 seconds between waves
  private readonly spawnCooldown = 1000; // 1 second between spawns
  private lastSpawnTime = 0;
  private currentWaveStarted = false;

  constructor(
    private readonly path: Position[],
    private readonly onCactusSpawned: (cactus: Cactus) => void,
    private readonly onWaveComplete: () => void
  ) {}

  public startWave(waveNumber: number): void {
    this.currentWaveStarted = true;
    this.spawnCacti(waveNumber);
  }

  private spawnCacti(waveNumber: number): void {
    const numCacti = Math.floor(5 + waveNumber * 1.5); // Increase number of cacti per wave
    let spawnedCount = 0;

    const spawnInterval = setInterval(() => {
      if (spawnedCount >= numCacti) {
        clearInterval(spawnInterval);
        setTimeout(() => {
          this.currentWaveStarted = false;
          this.onWaveComplete();
        }, this.waveCooldown);
        return;
      }

      const now = Date.now();
      if (now - this.lastSpawnTime >= this.spawnCooldown) {
        this.spawnCactus(waveNumber);
        this.lastSpawnTime = now;
        spawnedCount++;
      }
    }, 100);
  }

  private spawnCactus(waveNumber: number): void {
    const healthMultiplier = 1 + (waveNumber - 1) * 0.2; // 20% increase per wave
    const speedMultiplier = 1 + (waveNumber - 1) * 0.05;  // Reduced from 0.1 to 0.05 (5% increase per wave)
    const rewardMultiplier = 1 + (waveNumber - 1) * 0.15; // 15% increase per wave

    const cactus: Cactus = {
      id: Math.random().toString(),
      position: { ...this.path[0] },
      health: this.baseHealth * healthMultiplier,
      maxHealth: this.baseHealth * healthMultiplier,
      speed: this.baseSpeed * speedMultiplier,
      baseSpeed: this.baseSpeed * speedMultiplier,
      reward: Math.floor(this.baseReward * rewardMultiplier),
      path: this.path,
      currentPathIndex: 0,
      effects: {}
    };

    this.onCactusSpawned(cactus);
  }

  public isWaveInProgress(): boolean {
    return this.currentWaveStarted;
  }
} 
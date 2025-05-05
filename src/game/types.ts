export interface Position {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  position: Position;
  damage: number;
  range: number;
  cost: number;
  fireRate: number; // shots per second
  lastShot: number; // timestamp of last shot
}

export enum TowerType {
  WATER_CANNON = 'WATER_CANNON',     // High fire rate, medium damage
  POISON_SPRAYER = 'POISON_SPRAYER', // Damage over time
  FIRE_TOWER = 'FIRE_TOWER',         // High damage, low fire rate
  ICE_TOWER = 'ICE_TOWER',           // Slows enemies
  LIGHTNING_ROD = 'LIGHTNING_ROD'     // Chain damage
}

export interface Cactus {
  id: string;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number; // Original speed before effects
  reward: number;
  path: Position[];
  currentPathIndex: number;
  effects: {
    poison?: {
      damage: number;
      duration: number;
    };
    slow?: {
      factor: number;
      duration: number;
    };
  };
}

export interface GameState {
  tokens: number;
  wave: number;
  lives: number;
  towers: Tower[];
  cacti: Cactus[];
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
}

export const TOWER_CONFIGS: Record<TowerType, Omit<Tower, 'id' | 'position' | 'lastShot'>> = {
  [TowerType.WATER_CANNON]: {
    type: TowerType.WATER_CANNON,
    damage: 15,
    range: 150,
    cost: 100,
    fireRate: 2
  },
  [TowerType.POISON_SPRAYER]: {
    type: TowerType.POISON_SPRAYER,
    damage: 5,
    range: 120,
    cost: 150,
    fireRate: 1
  },
  [TowerType.FIRE_TOWER]: {
    type: TowerType.FIRE_TOWER,
    damage: 40,
    range: 130,
    cost: 200,
    fireRate: 0.5
  },
  [TowerType.ICE_TOWER]: {
    type: TowerType.ICE_TOWER,
    damage: 10,
    range: 140,
    cost: 175,
    fireRate: 1
  },
  [TowerType.LIGHTNING_ROD]: {
    type: TowerType.LIGHTNING_ROD,
    damage: 25,
    range: 160,
    cost: 250,
    fireRate: 0.8
  }
}; 
/**
 * Type definitions for "طريق الغيوم" (Path of Clouds)
 */

export type GameState = 'LOADING' | 'START' | 'PLAYING' | 'LEVEL_TRANSITION' | 'ENDING' | 'PAUSED' | 'GAME_OVER';

export interface DefeatInfo {
  obstacleType: ObstacleType;
  progressPercent: number; // 0 to 100
  levelName: string;
  levelIndex: number;
  shardsCollected: number;
  totalShards: number;
  hasCheckpoint: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  wobbleAngle: number;
  trail: Point[];
  stringNodes: Point[]; // Multi-segment string simulation
  isHolding: boolean;
  isInWind: boolean;
  windEffect: Point;
  isDissolving: boolean;
  dissolveProgress: number;
}

export type WindDirection = 'UP' | 'DOWN' | 'FORWARD' | 'TURBULENT';

export interface WindZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: WindDirection;
  strength: number; // e.g., 0.5 to 2.0
  particles?: Point[];
}

export type ObstacleType = 
  | 'BRANCH' 
  | 'POWER_LINE' 
  | 'BIRD' 
  | 'CHIMNEY' 
  | 'BUILDING_ROOF' 
  | 'STORM_CLOUD' 
  | 'LIGHTNING_NODE' 
  | 'KITE';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Dynamic properties (for birds, swaying kites, electric arcs)
  animOffset?: number;
  speed?: number;
  points?: Point[]; // For lines or custom polygon shapes
}

export interface MemoryShard {
  id: string;
  x: number;
  y: number;
  text: string; // The poetic Arabic memory line
  collected: boolean;
  order: number; // 1 to 5
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  activated: boolean;
}

export interface LevelTheme {
  name: string;
  subtitle: string;
  description: string;
  skyTop: string;
  skyBottom: string;
  cloudColor: string;
  cloudShadow: string;
  accentColor: string;
  particleColor: string;
  weatherType: 'CLEAR' | 'BREEZY' | 'RAIN_STORM' | 'STARRY' | 'GOLDEN_DAWN';
}

export interface LevelData {
  id: number;
  name: string;
  theme: LevelTheme;
  width: number; // Level length in world units
  height: number; // Level height
  playerStart: Point;
  targetWindow: Point; // Destination coordinates
  windZones: WindZone[];
  obstacles: Obstacle[];
  shards: MemoryShard[];
  checkpoints: Checkpoint[];
  sceneryElements: {
    hills?: { x: number; height: number; width: number; color: string }[];
    buildings?: { x: number; y: number; width: number; height: number; color: string; windows?: boolean }[];
    trees?: { x: number; y: number; height: number; color: string }[];
    kites?: { x: number; y: number; color: string; size: number }[];
    stars?: { x: number; y: number; size: number; opacity: number }[];
  };
}

export interface GameStats {
  currentLevelIndex: number;
  collectedShardsTotal: number;
  collectedShardsThisLevel: number;
  collectedMemories: { levelId: number; text: string; order: number }[];
  deaths: number;
}

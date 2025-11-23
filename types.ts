export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum CellType {
  EMPTY = 'EMPTY',
  OBSTACLE = 'OBSTACLE',
  START = 'START',
  GOAL = 'GOAL',
}

export interface Position {
  x: number;
  y: number;
}

export interface LevelData {
  id: number | string;
  name: string;
  gridSize: number;
  start: Position;
  goal: Position;
  obstacles: Position[];
  par?: number; // Optimal number of moves
}

export enum GameStatus {
  PLANNING = 'PLANNING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export type Command = Direction;
import { LevelData } from "./types";

export const PREDEFINED_LEVELS: LevelData[] = [
  {
    id: 1,
    name: "ด่านที่ 1: ก้าวแรก",
    gridSize: 5,
    start: { x: 0, y: 0 },
    goal: { x: 2, y: 0 },
    obstacles: [],
    par: 2
  },
  {
    id: 2,
    name: "ด่านที่ 2: กำแพงกั้น",
    gridSize: 5,
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    par: 6
  },
  {
    id: 3,
    name: "ด่านที่ 3: เส้นทางงูเลื้อย",
    gridSize: 5,
    start: { x: 0, y: 0 },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }
    ],
    par: 8
  }
];
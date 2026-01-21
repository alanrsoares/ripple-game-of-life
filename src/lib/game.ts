import type { Grid, Point } from "./types";

const wrapIndex = (size: number, value: number) => (value + size) % size;

export const getNeighbours = (grid: Grid, position: Point): number => {
  const size = grid.length;
  let count = 0;

  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      if (yOffset === 0 && xOffset === 0) {
        continue;
      }

      const y = wrapIndex(size, position.y + yOffset);
      const x = wrapIndex(size, position.x + xOffset);

      if (grid[y]?.[x]) {
        count += 1;
      }
    }
  }

  return count;
};

export const willLive = (isAlive: boolean, neighbours: number) =>
  isAlive ? neighbours >= 2 && neighbours <= 3 : neighbours === 3;

export const nextState = (grid: Grid): Grid =>
  grid.map((row, y) =>
    row.map((cell, x) => willLive(cell, getNeighbours(grid, { y, x }))),
  );

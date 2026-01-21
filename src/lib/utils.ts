import type { Grid, Point } from "./types";

export const createGrid = (size: number): Grid =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

export const createRandomGrid = (size: number, density = 0.22): Grid =>
  createGrid(size).map((row) => row.map(() => Math.random() < density));

export const toggleCell = (grid: Grid, point: Point): Grid =>
  grid.map((row, y) =>
    y === point.y
      ? row.map((cell, x) => (x === point.x ? !cell : cell))
      : row.slice(),
  );

export const setCell = (grid: Grid, point: Point, value: boolean): Grid =>
  grid.map((row, y) =>
    y === point.y
      ? row.map((cell, x) => (x === point.x ? value : cell))
      : row.slice(),
  );

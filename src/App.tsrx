import { effect, track } from "ripple";
import { nextState } from "./lib/game";
import { createGrid, createRandomGrid, setCell } from "./lib/utils";
import { DEFAULT_SIZE, MIN_SIZE, MAX_SIZE, DENSITY } from "./lib/constants";
import { Header } from "./components/Header.tsrx";
import { Controls } from "./components/Controls.tsrx";
import { Habitat } from "./components/Habitat.tsrx";

export function App() {
  let &[size] = track(DEFAULT_SIZE);
  let &[grid] = track(createRandomGrid(DEFAULT_SIZE, DENSITY));
  let &[running] = track(false);
  let &[generation] = track(0);
  let &[fps] = track(0);
  let &[renderMode] = track("canvas" as "canvas" | "dom");
  let &[living] = track(
    () => grid.reduce((total, row) => total + row.filter(Boolean).length, 0),
  );

  const stepForward = () => {
    grid = nextState(grid);
    generation += 1;
  };

  const toggleRunning = () => {
    running = !running;
  };

  const handleClear = () => {
    running = false;
    generation = 0;
    grid = createGrid(size);
  };

  const handleRandom = () => {
    running = false;
    generation = 0;
    grid = createRandomGrid(size, DENSITY);
  };

  const handleSizeChange = (nextSize: number) => {
    if (Number.isNaN(nextSize)) {
      return;
    }

    const clampedSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, nextSize));
    if (clampedSize === size) {
      return;
    }

    running = false;
    generation = 0;
    size = clampedSize;
    grid = createGrid(clampedSize);
  };

  const handleSetCell = (y: number, x: number, value: boolean) => {
    grid = setCell(grid, { y, x }, value);
  };

  const handleToggleRenderMode = (mode: "canvas" | "dom") => {
    renderMode = mode;
  };

  effect(() => {
    if (!running) {
      fps = 0;
      return;
    }

    let rafId = 0;
    let frames = 0;
    let fpsStamp = performance.now();
    let lastFrameTime = performance.now();

    const loop = (now: number) => {
      frames += 1;

      // Calculate time since last frame was processed
      const delta = Math.max(1, now - lastFrameTime);
      lastFrameTime = now;

      if (now - fpsStamp >= 200) {
        fps = Math.round((frames * 1000) / (now - fpsStamp));
        fpsStamp = now;
        frames = 0;
      } else if (frames === 1) {
        fps = Math.round(1000 / delta);
      }

      grid = nextState(grid);
      generation += 1;

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  });

  return <div class="min-h-screen px-4 pb-8 pt-8 sm:px-8 lg:px-12">
    <Header />

    <main
      class="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <Controls
        {size}
        {generation}
        {living}
        {fps}
        {running}
        {renderMode}
        onToggleRunning={toggleRunning}
        onStep={stepForward}
        onRandom={handleRandom}
        onClear={handleClear}
        onSizeChange={handleSizeChange}
        onToggleRenderMode={handleToggleRenderMode}
      />

      <Habitat {grid} {size} {renderMode} onSetCell={handleSetCell} />
    </main>
  </div>;
}

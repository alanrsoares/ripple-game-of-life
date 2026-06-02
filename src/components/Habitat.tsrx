import { effect, track } from "ripple";

interface HabitatProps {
  grid: boolean[][];
  size: number;
  renderMode: "canvas" | "dom";
  onSetCell: (y: number, x: number, value: boolean) => void;
}

export function Habitat(&{ grid, size, renderMode, onSetCell }: HabitatProps) {
  let &[canvasRef] = track(null as HTMLCanvasElement | null);

  let paintMode = null as boolean | null;
  const paintedCells = new Set<string>();

  const getCellFromEvent = (event: PointerEvent) => {
    const canvas = canvasRef;
    if (!canvas) return { row: 0, col: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellSize = rect.width / size;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    return {
      row: Math.min(Math.max(0, row), size - 1),
      col: Math.min(Math.max(0, col), size - 1),
    };
  };

  const startPaintCanvas = (event: PointerEvent) => {
    const { row, col } = getCellFromEvent(event);
    const currentState = grid[row]?.[col];
    if (currentState === undefined) return;

    paintMode = !currentState;
    paintedCells.clear();
    paintedCells.add(`${row},${col}`);
    onSetCell(row, col, paintMode);

    canvasRef?.setPointerCapture(event.pointerId);
  };

  const continuePaintCanvas = (event: PointerEvent) => {
    if (paintMode === null) return;

    const { row, col } = getCellFromEvent(event);
    const key = `${row},${col}`;
    if (paintedCells.has(key)) return;

    paintedCells.add(key);
    onSetCell(row, col, paintMode);
  };

  const endPaintCanvas = (event: PointerEvent) => {
    paintMode = null;
    paintedCells.clear();
    canvasRef?.releasePointerCapture(event.pointerId);
  };

  const setCanvasRef = (element: HTMLCanvasElement) => {
    canvasRef = element;
  };

  const draw = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / size;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    for (let x = 1; x < size; x++) {
      const xPos = Math.floor(x * cellSize) - 1;
      ctx.fillRect(xPos, 0, 2, height);
    }
    for (let y = 1; y < size; y++) {
      const yPos = Math.floor(y * cellSize) - 1;
      ctx.fillRect(0, yPos, width, 2);
    }

    ctx.fillStyle = "#ff6b9d";
    for (let y = 0; y < size; y++) {
      const row = grid[y];
      if (!row) continue;

      for (let x = 0; x < size; x++) {
        if (!row[x]) continue;

        const xPos = Math.floor(x * cellSize);
        const yPos = Math.floor(y * cellSize);
        const nextX = Math.floor((x + 1) * cellSize);
        const nextY = Math.floor((y + 1) * cellSize);
        ctx.fillRect(xPos, yPos, nextX - xPos, nextY - yPos);
      }
    }
  };

  effect(() => {
    if (renderMode !== "canvas") {
      if (canvasRef) canvasRef = null;
      return;
    }

    let canvas = canvasRef;
    const isDetached = canvas && !document.body.contains(canvas);

    if (!canvas || isDetached) {
      canvas = document.getElementById("habitat-canvas") as HTMLCanvasElement;
      if (canvas) {
        canvasRef = canvas;
      } else {
        const timer = setTimeout(() => {
          canvasRef = document.getElementById(
            "habitat-canvas",
          ) as HTMLCanvasElement | null;
        }, 20);
        return () => clearTimeout(timer);
      }
    }

    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      draw();
    });

    resizeObserver.observe(canvas);
    draw();

    return () => resizeObserver.disconnect();
  });

  effect(() => {
    if (renderMode === "canvas" && canvasRef) {
      draw();
    }
  });

  const startPaintDOM = (y: number, x: number) => {
    const currentState = grid[y]?.[x];
    if (currentState === undefined) return;

    paintMode = !currentState;
    paintedCells.clear();
    paintedCells.add(`${y},${x}`);
    onSetCell(y, x, paintMode);
  };

  const continuePaintDOM = (y: number, x: number) => {
    if (paintMode === null) return;

    const key = `${y},${x}`;
    if (paintedCells.has(key)) return;

    paintedCells.add(key);
    onSetCell(y, x, paintMode);
  };

  const endPaintDOM = () => {
    paintMode = null;
    paintedCells.clear();
  };

  effect(() => {
    const handleUp = () => endPaintDOM();
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  });

  const cellBase = "aspect-square w-full border border-black/20 transition-colors duration-75 hover:border-black";
  const cellAlive = "!bg-[var(--neo-pink)] !border-[var(--neo-pink)]";
  const cellDead = "bg-white";
  let &[cells] = track(
    () => grid.flatMap(
      (row, y) => row.map(
        (alive, x) => ({
          alive,
          id: `${y}-${x}`,
          x,
          y,
        }),
      ),
    ),
  );

  return <section
    class="border-3 border-black bg-white p-4 neo-shadow-lg flex flex-col"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 mb-4"
    >
      <h2 class="font-['Syne'] text-lg font-bold uppercase">{"Habitat"}</h2>
      <div
        class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide"
      >
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 border border-black/20 bg-[var(--neo-pink)]" />
          {"Alive"}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 border border-black/20 bg-white" />
          {"Dead"}
        </span>
      </div>
    </div>

    if (renderMode === "canvas") {
      <canvas
        id="habitat-canvas"
        class="border-2 border-black bg-black/10 flex-1 w-full aspect-square max-w-[min(100%,640px)] self-center hover:cursor-pointer touch-none"
        ref={setCanvasRef}
        onPointerDown={startPaintCanvas}
        onPointerMove={continuePaintCanvas}
        onPointerUp={endPaintCanvas}
        onPointerCancel={endPaintCanvas}
        aria-label="Game of Life Grid (Canvas)"
        role="grid"
      />
    } else {
      <div
        class="grid touch-none gap-0 border-2 border-black bg-black/10 flex-1 w-full aspect-square max-w-[min(100%,640px)] self-center hover:cursor-pointer"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          contain: "strict",
        }}
        onPointerUp={endPaintDOM}
      >
        for (const cell of cells; key cell.id) {
          <button
            class={[cellBase, cell.alive ? cellAlive : cellDead]}
            onPointerDown={() => startPaintDOM(cell.y, cell.x)}
            onPointerEnter={(event: PointerEvent) => {
              if (event.buttons === 1) {
                continuePaintDOM(cell.y, cell.x);
              }
            }}
            aria-label={`Cell ${cell.y + 1}, ${cell.x + 1}`}
          />
        }
      </div>
    }

    <p
      class="mt-3 text-[10px] text-black/40 text-center font-medium uppercase tracking-wider"
    >
      {"Built with Ripple + Bun"}
    </p>
  </section>;
}

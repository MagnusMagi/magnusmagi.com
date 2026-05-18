"use client";

import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

const SIZE = 4;
const WIN_VALUE = 2048;
const SWIPE_THRESHOLD = 28;
const STORAGE_KEY = "magimerge.best";
const SLIDE_DURATION_MS = 130;
const SETTLE_DELAY_MS = 150;

type Direction = "up" | "down" | "left" | "right";
type GameStatus = "playing" | "won" | "over";

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
  willRemove?: boolean;
}

interface Game2049Labels {
  score: string;
  best: string;
  newGame: string;
  youWon: string;
  keepGoing: string;
  gameOver: string;
  controlsHint: string;
  ariaLabel: string;
}

interface Game2049Props {
  labels: Game2049Labels;
}

interface GameState {
  tiles: Tile[];
  score: number;
  best: number;
  status: GameStatus;
  continuedAfterWin: boolean;
  nextId: number;
}

type Action =
  | { type: "move"; direction: Direction }
  | { type: "settle" }
  | { type: "restart" }
  | { type: "continue" }
  | { type: "loadBest"; best: number };

function emptyState(): GameState {
  return {
    tiles: [],
    score: 0,
    best: 0,
    status: "playing",
    continuedAfterWin: false,
    nextId: 1,
  };
}

function liveTiles(tiles: Tile[]): Tile[] {
  return tiles.filter((t) => !t.willRemove);
}

function spawnRandomTile(state: GameState): GameState {
  const occupied = new Set<string>();
  for (const t of liveTiles(state.tiles)) {
    occupied.add(`${t.row},${t.col}`);
  }
  const empty: Array<[number, number]> = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return state;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return {
    ...state,
    tiles: [
      ...state.tiles,
      { id: state.nextId, value, row, col, isNew: true },
    ],
    nextId: state.nextId + 1,
  };
}

function startState(seed: GameState): GameState {
  const cleared: GameState = {
    ...seed,
    tiles: [],
    score: 0,
    status: "playing",
    continuedAfterWin: false,
  };
  return spawnRandomTile(spawnRandomTile(cleared));
}

function getVector(direction: Direction): { r: number; c: number } {
  switch (direction) {
    case "up":
      return { r: -1, c: 0 };
    case "down":
      return { r: 1, c: 0 };
    case "left":
      return { r: 0, c: -1 };
    case "right":
      return { r: 0, c: 1 };
  }
}

function getTraversals(direction: Direction): {
  rows: number[];
  cols: number[];
} {
  const rows = Array.from({ length: SIZE }, (_, i) => i);
  const cols = Array.from({ length: SIZE }, (_, i) => i);
  if (direction === "down") rows.reverse();
  if (direction === "right") cols.reverse();
  return { rows, cols };
}

function findFarthest(
  grid: Array<Array<Tile | null>>,
  row: number,
  col: number,
  vec: { r: number; c: number },
): {
  far: { row: number; col: number };
  next: { row: number; col: number } | null;
} {
  let curRow = row;
  let curCol = col;
  while (true) {
    const tryRow = curRow + vec.r;
    const tryCol = curCol + vec.c;
    if (tryRow < 0 || tryRow >= SIZE || tryCol < 0 || tryCol >= SIZE) break;
    if (grid[tryRow][tryCol] !== null) break;
    curRow = tryRow;
    curCol = tryCol;
  }
  const nextRow = curRow + vec.r;
  const nextCol = curCol + vec.c;
  const inBounds =
    nextRow >= 0 && nextRow < SIZE && nextCol >= 0 && nextCol < SIZE;
  return {
    far: { row: curRow, col: curCol },
    next: inBounds ? { row: nextRow, col: nextCol } : null,
  };
}

function applyMove(
  state: GameState,
  direction: Direction,
): { state: GameState; changed: boolean; gained: number } {
  const grid: Array<Array<Tile | null>> = Array.from({ length: SIZE }, () =>
    Array<Tile | null>(SIZE).fill(null),
  );
  const live = liveTiles(state.tiles);
  for (const t of live) {
    grid[t.row][t.col] = t;
  }

  const traversals = getTraversals(direction);
  const vec = getVector(direction);

  let gained = 0;
  let changed = false;
  let nextId = state.nextId;

  const tilesUpdated = new Map<number, { row: number; col: number }>();
  const tilesToRemove = new Set<number>();
  const newMergedTiles: Tile[] = [];
  const mergedIdsThisTurn = new Set<number>();

  for (const r of traversals.rows) {
    for (const c of traversals.cols) {
      const tile = grid[r][c];
      if (!tile) continue;
      if (mergedIdsThisTurn.has(tile.id)) continue;

      const { far, next } = findFarthest(grid, r, c, vec);
      const beyondTile = next ? grid[next.row][next.col] : null;

      if (
        beyondTile &&
        beyondTile.value === tile.value &&
        !mergedIdsThisTurn.has(beyondTile.id) &&
        next
      ) {
        grid[r][c] = null;
        const mergedTile: Tile = {
          id: nextId++,
          value: tile.value * 2,
          row: next.row,
          col: next.col,
          isMerged: true,
        };
        mergedIdsThisTurn.add(mergedTile.id);
        newMergedTiles.push(mergedTile);
        tilesUpdated.set(tile.id, { row: next.row, col: next.col });
        tilesToRemove.add(tile.id);
        tilesToRemove.add(beyondTile.id);
        grid[next.row][next.col] = mergedTile;
        gained += mergedTile.value;
        changed = true;
      } else if (far.row !== r || far.col !== c) {
        grid[r][c] = null;
        const moved: Tile = { ...tile, row: far.row, col: far.col };
        grid[far.row][far.col] = moved;
        tilesUpdated.set(tile.id, { row: far.row, col: far.col });
        changed = true;
      }
    }
  }

  if (!changed) {
    return { state, changed: false, gained: 0 };
  }

  const newTiles: Tile[] = [];
  for (const t of live) {
    const pos = tilesUpdated.get(t.id);
    const willRemove = tilesToRemove.has(t.id);
    if (pos) {
      newTiles.push({
        ...t,
        row: pos.row,
        col: pos.col,
        isNew: false,
        isMerged: false,
        willRemove,
      });
    } else if (willRemove) {
      newTiles.push({
        ...t,
        isNew: false,
        isMerged: false,
        willRemove: true,
      });
    } else {
      newTiles.push({ ...t, isNew: false, isMerged: false });
    }
  }
  for (const merged of newMergedTiles) {
    newTiles.push(merged);
  }

  return {
    state: { ...state, tiles: newTiles, nextId },
    changed: true,
    gained,
  };
}

function isGameOver(tiles: Tile[]): boolean {
  if (tiles.length < SIZE * SIZE) return false;
  const grid: number[][] = Array.from({ length: SIZE }, () =>
    Array<number>(SIZE).fill(0),
  );
  for (const t of tiles) grid[t.row][t.col] = t.value;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function settleTiles(tiles: Tile[]): Tile[] {
  return tiles
    .filter((t) => !t.willRemove)
    .map((t) => ({ ...t, isNew: false, isMerged: false }));
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "loadBest":
      return { ...state, best: Math.max(state.best, action.best) };
    case "restart":
      return startState(state);
    case "continue":
      return { ...state, status: "playing", continuedAfterWin: true };
    case "settle":
      return { ...state, tiles: settleTiles(state.tiles) };
    case "move": {
      if (state.status === "over") return state;
      if (state.status === "won" && !state.continuedAfterWin) return state;

      const settled: GameState = {
        ...state,
        tiles: settleTiles(state.tiles),
      };

      const moveResult = applyMove(settled, action.direction);
      if (!moveResult.changed) return state;

      let next = moveResult.state;
      next = spawnRandomTile(next);

      const newScore = state.score + moveResult.gained;
      const best = Math.max(state.best, newScore);
      const live = liveTiles(next.tiles);

      let status: GameStatus = state.status;
      if (
        !state.continuedAfterWin &&
        live.some((t) => t.value >= WIN_VALUE)
      ) {
        status = "won";
      } else if (isGameOver(live)) {
        status = "over";
      }

      return {
        ...next,
        score: newScore,
        best,
        status,
      };
    }
    default:
      return state;
  }
}

function directionFromCode(code: string): Direction | null {
  if (code === "ArrowUp" || code === "KeyW" || code === "KeyK") return "up";
  if (code === "ArrowDown" || code === "KeyS" || code === "KeyJ") return "down";
  if (code === "ArrowLeft" || code === "KeyA" || code === "KeyH") return "left";
  if (code === "ArrowRight" || code === "KeyD" || code === "KeyL")
    return "right";
  return null;
}

function tileClasses(value: number): string {
  if (value <= 4) {
    return "bg-subtle text-foreground";
  }
  if (value <= 32) {
    return "bg-subtle text-foreground border border-border";
  }
  if (value <= 512) {
    return "bg-foreground text-background";
  }
  return "bg-accent text-background";
}

function tileFontClass(value: number): string {
  if (value < 100) return "text-3xl sm:text-4xl";
  if (value < 1000) return "text-2xl sm:text-3xl";
  if (value < 10000) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

export function Game2049({ labels }: Game2049Props) {
  const [state, dispatch] = useReducer(reducer, undefined, emptyState);
  const boardRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const wonTitleId = useId();
  const overTitleId = useId();
  const wonPrimaryRef = useRef<HTMLButtonElement>(null);
  const overPrimaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.status === "won") {
      wonPrimaryRef.current?.focus({ preventScroll: true });
    } else if (state.status === "over") {
      overPrimaryRef.current?.focus({ preventScroll: true });
    }
  }, [state.status]);

  useEffect(() => {
    dispatch({ type: "restart" });
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? Number.parseInt(stored, 10) : 0;
      if (Number.isFinite(parsed) && parsed > 0) {
        dispatch({ type: "loadBest", best: parsed });
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    if (state.best <= 0) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(state.best));
    } catch {
      /* ignore */
    }
  }, [state.best]);

  useEffect(() => {
    const hasPending = state.tiles.some(
      (t) => t.willRemove || t.isNew || t.isMerged,
    );
    if (!hasPending) return;
    const handle = window.setTimeout(() => {
      dispatch({ type: "settle" });
    }, SETTLE_DELAY_MS);
    return () => window.clearTimeout(handle);
  }, [state.tiles]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.code === "KeyR") {
        event.preventDefault();
        dispatch({ type: "restart" });
        return;
      }
      const direction = directionFromCode(event.code);
      if (!direction) return;
      event.preventDefault();
      dispatch({ type: "move", direction });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      swipeStart.current = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
      };
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;
      if (absDx > absDy) {
        dispatch({ type: "move", direction: dx > 0 ? "right" : "left" });
      } else {
        dispatch({ type: "move", direction: dy > 0 ? "down" : "up" });
      }
    },
    [],
  );

  const handlePointerCancel = useCallback(() => {
    swipeStart.current = null;
  }, []);

  const handleRestart = useCallback(() => {
    dispatch({ type: "restart" });
  }, []);

  const handleContinue = useCallback(() => {
    dispatch({ type: "continue" });
  }, []);

  const showWonOverlay = state.status === "won";
  const showOverOverlay = state.status === "over";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <ScoreCard label={labels.score} value={state.score} live />
          <ScoreCard label={labels.best} value={state.best} />
        </div>
        <button
          type="button"
          onClick={handleRestart}
          className="rounded-full border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {labels.newGame}
        </button>
      </div>

      <div className="relative isolate">
        <div
          ref={boardRef}
          role="application"
          aria-label={labels.ariaLabel}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="relative touch-none select-none rounded-md border border-border bg-background"
          style={{ aspectRatio: "1 / 1", padding: "8px" }}
        >
          <div className="absolute inset-2">
            {Array.from({ length: SIZE * SIZE }, (_, i) => {
              const r = Math.floor(i / SIZE);
              const c = i % SIZE;
              return (
                <div
                  key={`bg-${i}`}
                  className="absolute"
                  style={{
                    width: `${100 / SIZE}%`,
                    height: `${100 / SIZE}%`,
                    transform: `translate(${c * 100}%, ${r * 100}%)`,
                    padding: "4px",
                  }}
                >
                  <div className="h-full w-full rounded bg-subtle" />
                </div>
              );
            })}
          </div>

          <div className="absolute inset-2">
            {state.tiles.map((tile) => (
              <TileView key={tile.id} tile={tile} />
            ))}
          </div>
        </div>

        {showWonOverlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={wonTitleId}
              className="rounded-md border border-border bg-background/95 px-5 py-4 text-center shadow-sm"
            >
              <div
                id={wonTitleId}
                className="text-sm font-medium text-accent"
              >
                {labels.youWon}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-xs text-foreground">
                <span>
                  {labels.score} {state.score}
                </span>
                <span className="text-muted">·</span>
                <span>
                  {labels.best} {state.best}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  ref={wonPrimaryRef}
                  type="button"
                  onClick={handleContinue}
                  className="rounded-full bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {labels.keepGoing}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {labels.newGame}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showOverOverlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={overTitleId}
              className="rounded-md border border-border bg-background/95 px-5 py-4 text-center shadow-sm"
            >
              <div
                id={overTitleId}
                className="text-sm font-medium text-accent"
              >
                {labels.gameOver}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-xs text-foreground">
                <span>
                  {labels.score} {state.score}
                </span>
                <span className="text-muted">·</span>
                <span>
                  {labels.best} {state.best}
                </span>
              </div>
              <div className="mt-3">
                <button
                  ref={overPrimaryRef}
                  type="button"
                  onClick={handleRestart}
                  className="rounded-full bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {labels.newGame}
                </button>
              </div>
            </div>
          </div>
        ) : null}

      </div>

      <div className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {labels.controlsHint}
      </div>
    </div>
  );
}

interface ScoreCardProps {
  label: string;
  value: number;
}

function ScoreCard({
  label,
  value,
  live,
}: ScoreCardProps & { live?: boolean }) {
  return (
    <div className="flex min-w-[72px] flex-col rounded-md border border-border bg-subtle px-3 py-2 text-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <span
        aria-live={live ? "polite" : undefined}
        className="font-mono text-base font-semibold tabular-nums text-foreground"
      >
        {value}
      </span>
    </div>
  );
}

interface TileViewProps {
  tile: Tile;
}

function TileView({ tile }: TileViewProps) {
  const popClass = tile.isNew
    ? "tile-pop-new"
    : tile.isMerged
      ? "tile-pop-merge"
      : "";
  const transitionStyle: React.CSSProperties = {
    width: `${100 / SIZE}%`,
    height: `${100 / SIZE}%`,
    transform: `translate(${tile.col * 100}%, ${tile.row * 100}%)`,
    transition: `transform ${SLIDE_DURATION_MS}ms ease, opacity 80ms ease ${tile.willRemove ? SLIDE_DURATION_MS - 30 : 0}ms`,
    opacity: tile.willRemove ? 0 : 1,
    padding: "4px",
    pointerEvents: "none",
    zIndex: tile.isMerged ? 2 : tile.willRemove ? 0 : 1,
  };

  return (
    <div className="absolute" style={transitionStyle}>
      <div
        className={`flex h-full w-full items-center justify-center rounded font-mono font-semibold tabular-nums ${tileClasses(tile.value)} ${tileFontClass(tile.value)} ${popClass}`}
      >
        {tile.value}
      </div>
    </div>
  );
}

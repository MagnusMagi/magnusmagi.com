"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

interface SnakeLabels {
  pressToStart: string;
  controlsHint: string;
  gameOver: string;
  score: string;
  best: string;
  restart: string;
  ariaLabel: string;
}

interface SnakeProps {
  labels: SnakeLabels;
}

const COLS = 20;
const ROWS = 20;
const CELL = 22;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;

const TICK_INITIAL_MS = 95;
const TICK_MIN_MS = 50;
const TICK_DECREASE_PER_SCORE = 2.5;
const SWIPE_THRESHOLD = 24;

const STORAGE_KEY = "snake.best";

type Direction = "up" | "down" | "left" | "right";
type GameState = "idle" | "playing" | "gameover";

interface Cell {
  row: number;
  col: number;
}

interface MutableState {
  snake: Cell[];
  direction: Direction;
  pendingDirection: Direction | null;
  food: Cell;
  score: number;
  state: GameState;
  lastMoveTime: number;
  tickInterval: number;
  flashUntil: number;
}

interface Colors {
  fg: string;
  bg: string;
  muted: string;
  accent: string;
  border: string;
  subtle: string;
}

const DEFAULT_COLORS: Colors = {
  fg: "#0d0d0d",
  bg: "#fafaf7",
  muted: "#525252",
  accent: "#c2410c",
  border: "#e5e5e0",
  subtle: "#ededea",
};

function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

function nextHead(head: Cell, direction: Direction): Cell {
  switch (direction) {
    case "up":
      return { row: head.row - 1, col: head.col };
    case "down":
      return { row: head.row + 1, col: head.col };
    case "left":
      return { row: head.row, col: head.col - 1 };
    case "right":
      return { row: head.row, col: head.col + 1 };
  }
}

function spawnFood(snake: Cell[]): Cell {
  const occupied = new Set(snake.map((c) => `${c.row},${c.col}`));
  const empty: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });
    }
  }
  if (empty.length === 0) return { row: 0, col: 0 };
  return empty[Math.floor(Math.random() * empty.length)];
}

function createInitialState(): MutableState {
  const midRow = Math.floor(ROWS / 2);
  const midCol = Math.floor(COLS / 2);
  const startSnake: Cell[] = [
    { row: midRow, col: midCol },
    { row: midRow, col: midCol - 1 },
    { row: midRow, col: midCol - 2 },
  ];
  return {
    snake: startSnake,
    direction: "right",
    pendingDirection: null,
    food: spawnFood(startSnake),
    score: 0,
    state: "idle",
    lastMoveTime: 0,
    tickInterval: TICK_INITIAL_MS,
    flashUntil: 0,
  };
}

function readCssVar(el: Element, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

function readColors(el: Element): Colors {
  return {
    fg: readCssVar(el, "--foreground", DEFAULT_COLORS.fg),
    bg: readCssVar(el, "--background", DEFAULT_COLORS.bg),
    muted: readCssVar(el, "--muted", DEFAULT_COLORS.muted),
    accent: readCssVar(el, "--accent", DEFAULT_COLORS.accent),
    border: readCssVar(el, "--border", DEFAULT_COLORS.border),
    subtle: readCssVar(el, "--subtle", DEFAULT_COLORS.subtle),
  };
}

function directionFromCode(code: string): Direction | null {
  if (code === "ArrowUp" || code === "KeyW" || code === "KeyK") return "up";
  if (code === "ArrowDown" || code === "KeyS" || code === "KeyJ") return "down";
  if (code === "ArrowLeft" || code === "KeyA" || code === "KeyH") return "left";
  if (code === "ArrowRight" || code === "KeyD" || code === "KeyL")
    return "right";
  return null;
}

export function Snake({ labels }: SnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MutableState>(createInitialState());
  const colorsRef = useRef<Colors>(DEFAULT_COLORS);
  const swipeStart = useRef<{
    x: number;
    y: number;
    id: number;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameState, setGameState] = useState<GameState>("idle");
  const dialogTitleId = useId();
  const restartButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (gameState === "gameover") {
      restartButtonRef.current?.focus({ preventScroll: true });
    }
  }, [gameState]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? Number.parseInt(stored, 10) : 0;
      if (Number.isFinite(parsed) && parsed > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage (external system)
        setBest(parsed);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const startGame = useCallback((withDirection?: Direction) => {
    const fresh = createInitialState();
    fresh.state = "playing";
    if (withDirection && withDirection !== "left") {
      fresh.direction = withDirection;
    }
    stateRef.current = fresh;
    setScore(0);
    setGameState("playing");
  }, []);

  const setDirection = useCallback(
    (dir: Direction) => {
      const s = stateRef.current;
      if (s.state === "gameover") {
        return;
      }
      if (s.state === "idle") {
        startGame(dir === "left" ? undefined : dir);
        return;
      }
      if (isOpposite(dir, s.direction) || dir === s.direction) return;
      s.pendingDirection = dir;
    },
    [startGame],
  );

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
      if (event.code === "KeyR" || event.code === "Enter") {
        if (stateRef.current.state === "gameover") {
          event.preventDefault();
          startGame();
        }
        return;
      }
      const dir = directionFromCode(event.code);
      if (!dir) return;
      event.preventDefault();
      setDirection(dir);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setDirection, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () => {
      colorsRef.current = readColors(canvas);
    };
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) {
        stateRef.current.lastMoveTime = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;

    const recordBest = (finalScore: number) => {
      if (finalScore <= 0) return;
      setBest((prev) => {
        const next = Math.max(prev, finalScore);
        if (next !== prev) {
          try {
            window.localStorage.setItem(STORAGE_KEY, String(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    };

    const step = (now: number) => {
      const s = stateRef.current;
      const colors = colorsRef.current;

      if (s.state === "playing") {
        if (!s.lastMoveTime) s.lastMoveTime = now;
        if (now - s.lastMoveTime >= s.tickInterval) {
          s.lastMoveTime = now;

          if (
            s.pendingDirection &&
            !isOpposite(s.pendingDirection, s.direction)
          ) {
            s.direction = s.pendingDirection;
          }
          s.pendingDirection = null;

          const head = s.snake[0];
          const newHead = nextHead(head, s.direction);

          const hitWall =
            newHead.row < 0 ||
            newHead.row >= ROWS ||
            newHead.col < 0 ||
            newHead.col >= COLS;

          if (hitWall) {
            s.state = "gameover";
            setGameState("gameover");
            recordBest(s.score);
          } else {
            const ate =
              newHead.row === s.food.row && newHead.col === s.food.col;
            const bodyToCheck = ate ? s.snake : s.snake.slice(0, -1);
            const collided = bodyToCheck.some(
              (c) => c.row === newHead.row && c.col === newHead.col,
            );

            if (collided) {
              s.state = "gameover";
              setGameState("gameover");
              recordBest(s.score);
            } else {
              s.snake = ate
                ? [newHead, ...s.snake]
                : [newHead, ...s.snake.slice(0, -1)];
              if (ate) {
                s.score += 1;
                s.flashUntil = now + 100;
                s.tickInterval = Math.max(
                  TICK_MIN_MS,
                  s.tickInterval - TICK_DECREASE_PER_SCORE,
                );
                s.food = spawnFood(s.snake);
                setScore(s.score);
              }
            }
          }
        }
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = colors.border;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.fillRect(c * CELL + CELL / 2, r * CELL + CELL / 2, 1, 1);
        }
      }

      const flashing = now < s.flashUntil;
      ctx.fillStyle = flashing ? colors.fg : colors.accent;
      const foodPad = 5;
      ctx.fillRect(
        s.food.col * CELL + foodPad,
        s.food.row * CELL + foodPad,
        CELL - foodPad * 2,
        CELL - foodPad * 2,
      );

      ctx.fillStyle = colors.fg;
      for (let i = 0; i < s.snake.length; i++) {
        const cell = s.snake[i];
        const isHead = i === 0;
        const pad = isHead ? 1 : 2;
        ctx.fillRect(
          cell.col * CELL + pad,
          cell.row * CELL + pad,
          CELL - pad * 2,
          CELL - pad * 2,
        );
      }

      if (s.state === "playing" && s.snake.length > 0) {
        const head = s.snake[0];
        ctx.fillStyle = colors.bg;
        const eyeSize = 3;
        let ex = head.col * CELL + CELL / 2;
        let ey = head.row * CELL + CELL / 2;
        if (s.direction === "right") ex = head.col * CELL + CELL - 6;
        else if (s.direction === "left") ex = head.col * CELL + 3;
        else if (s.direction === "up") ey = head.row * CELL + 3;
        else if (s.direction === "down") ey = head.row * CELL + CELL - 6;
        ctx.fillRect(ex, ey, eyeSize, eyeSize);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      canvasRef.current?.focus({ preventScroll: true });
      swipeStart.current = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
      };
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
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

      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) {
        return;
      }

      let dir: Direction;
      if (absDx > absDy) {
        dir = dx > 0 ? "right" : "left";
      } else {
        dir = dy > 0 ? "down" : "up";
      }
      setDirection(dir);
    },
    [setDirection],
  );

  const handlePointerCancel = useCallback(() => {
    swipeStart.current = null;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-full"
        style={{
          maxWidth: WIDTH,
          aspectRatio: `${WIDTH} / ${HEIGHT}`,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label={labels.ariaLabel}
          role="application"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="block h-full w-full touch-none select-none border border-border bg-background outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ imageRendering: "pixelated" }}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col p-4 font-mono">
          <div className="flex items-start justify-between text-[11px] uppercase tracking-[0.18em] text-muted">
            <span>
              {labels.score} ·{" "}
              <span className="text-foreground" aria-live="polite">
                {String(score).padStart(2, "0")}
              </span>
            </span>
            <span>
              {labels.best} ·{" "}
              <span className="text-foreground">
                {String(best).padStart(2, "0")}
              </span>
            </span>
          </div>

          {gameState === "idle" ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-md border border-border bg-background/90 px-5 py-4 text-center shadow-sm">
                <div className="text-sm font-medium text-foreground">
                  {labels.pressToStart}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                  {labels.controlsHint}
                </div>
              </div>
            </div>
          ) : null}

          {gameState === "gameover" ? (
            <div className="flex flex-1 items-center justify-center">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="pointer-events-auto rounded-md border border-border bg-background/95 px-5 py-4 text-center shadow-sm"
              >
                <div
                  id={dialogTitleId}
                  className="text-sm font-medium text-accent"
                >
                  {labels.gameOver}
                </div>
                <div className="mt-2 flex items-center justify-center gap-3 text-xs text-foreground">
                  <span>
                    {labels.score} {score}
                  </span>
                  <span className="text-muted">·</span>
                  <span>
                    {labels.best} {best}
                  </span>
                </div>
                <div className="mt-3">
                  <button
                    ref={restartButtonRef}
                    type="button"
                    onClick={() => startGame()}
                    className="rounded-full bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {labels.restart}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

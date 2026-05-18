"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

interface MagiBirdLabels {
  pressToStart: string;
  controlsHint: string;
  gameOver: string;
  score: string;
  best: string;
  restart: string;
  ariaLabel: string;
  easy: string;
  hard: string;
}

interface MagiBirdProps {
  labels: MagiBirdLabels;
}

const WIDTH = 480;
const HEIGHT = 640;
const GROUND_HEIGHT = 64;

const GRAVITY = 1500;
const JUMP_VELOCITY = -440;
const PIPE_WIDTH = 64;
const FIRST_PIPE_DELAY = 0.5;

const PIPE_MIN_GAP_Y = 80;
const PIPE_MAX_GAP_Y_PADDING = 80;

const BIRD_SIZE = 22;
const BIRD_X = WIDTH * 0.28;
const BIRD_HITBOX_INSET = 3;

const STORAGE_PREFIX = "magibird.best.";
const LEGACY_STORAGE_KEY = "magibird.best";

type Difficulty = "easy" | "hard";
type GameState = "idle" | "playing" | "gameover";

interface DifficultyConfig {
  pipeGap: number;
  pipeSpeed: number;
  pipeInterval: number;
  speedPerScore: number;
  speedMaxBonus: number;
  intervalReductionPerScore: number;
  intervalMin: number;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    pipeGap: 130,
    pipeSpeed: 180,
    pipeInterval: 1.5,
    speedPerScore: 4,
    speedMaxBonus: 110,
    intervalReductionPerScore: 0.02,
    intervalMin: 0.95,
  },
  hard: {
    pipeGap: 108,
    pipeSpeed: 215,
    pipeInterval: 1.25,
    speedPerScore: 5,
    speedMaxBonus: 150,
    intervalReductionPerScore: 0.025,
    intervalMin: 0.85,
  },
};

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

interface MutableState {
  bird: { y: number; vy: number; rotation: number };
  pipes: Pipe[];
  timeSincePipe: number;
  score: number;
  state: GameState;
  lastTime: number;
  flashUntil: number;
}

interface Colors {
  fg: string;
  bg: string;
  muted: string;
  accent: string;
  border: string;
}

const DEFAULT_COLORS: Colors = {
  fg: "#0d0d0d",
  bg: "#fafaf7",
  muted: "#525252",
  accent: "#c2410c",
  border: "#e5e5e0",
};

function createInitialState(): MutableState {
  return {
    bird: { y: HEIGHT / 2, vy: 0, rotation: 0 },
    pipes: [],
    timeSincePipe: 0,
    score: 0,
    state: "idle",
    lastTime: 0,
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
  };
}

function currentPipeSpeed(score: number, cfg: DifficultyConfig): number {
  return cfg.pipeSpeed + Math.min(cfg.speedMaxBonus, score * cfg.speedPerScore);
}

function currentPipeInterval(score: number, cfg: DifficultyConfig): number {
  return Math.max(
    cfg.intervalMin,
    cfg.pipeInterval - score * cfg.intervalReductionPerScore,
  );
}

export function MagiBird({ labels }: MagiBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MutableState>(createInitialState());
  const colorsRef = useRef<Colors>(DEFAULT_COLORS);

  const [score, setScore] = useState(0);
  const [bestEasy, setBestEasy] = useState(0);
  const [bestHard, setBestHard] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const difficultyRef = useRef<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState>("idle");
  const dialogTitleId = useId();
  const restartButtonRef = useRef<HTMLButtonElement>(null);

  const best = difficulty === "easy" ? bestEasy : bestHard;

  useEffect(() => {
    if (gameState === "gameover") {
      restartButtonRef.current?.focus({ preventScroll: true });
    }
  }, [gameState]);

  useEffect(() => {
    const readKey = (key: string): number => {
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? Number.parseInt(raw, 10) : 0;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      } catch {
        return 0;
      }
    };
    let easyScore = readKey(`${STORAGE_PREFIX}easy`);
    const hardScore = readKey(`${STORAGE_PREFIX}hard`);
    const legacy = readKey(LEGACY_STORAGE_KEY);
    if (legacy > easyScore) {
      easyScore = legacy;
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}easy`, String(legacy));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    if (easyScore > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage (external system)
      setBestEasy(easyScore);
    }
    if (hardScore > 0) {
      setBestHard(hardScore);
    }
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;

    if (s.state === "gameover") {
      return;
    }

    const cfg = DIFFICULTIES[difficultyRef.current];

    if (s.state === "idle") {
      s.state = "playing";
      s.bird.vy = JUMP_VELOCITY;
      s.timeSincePipe = cfg.pipeInterval - FIRST_PIPE_DELAY;
      setGameState("playing");
      return;
    }

    s.bird.vy = JUMP_VELOCITY;
  }, []);

  const restart = useCallback(() => {
    const fresh = createInitialState();
    fresh.state = "playing";
    fresh.bird.vy = JUMP_VELOCITY;
    fresh.timeSincePipe =
      DIFFICULTIES[difficultyRef.current].pipeInterval - FIRST_PIPE_DELAY;
    stateRef.current = fresh;
    setScore(0);
    setGameState("playing");
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  const handleDifficultyChange = useCallback((next: Difficulty) => {
    if (difficultyRef.current === next) return;
    difficultyRef.current = next;
    setDifficulty(next);
    stateRef.current = createInitialState();
    setScore(0);
    setGameState("idle");
  }, []);

  useEffect(() => {
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateColors = () => {
      colorsRef.current = readColors(canvas);
    };
    updateColors();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", updateColors);
      return () => mq.removeEventListener("change", updateColors);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) {
        stateRef.current.lastTime = 0;
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

    const step = (now: number) => {
      const s = stateRef.current;
      if (!s.lastTime) s.lastTime = now;
      const dt = Math.min(1 / 30, (now - s.lastTime) / 1000);
      s.lastTime = now;

      const colors = colorsRef.current;

      const cfg = DIFFICULTIES[difficultyRef.current];
      const pipeGap = cfg.pipeGap;

      if (s.state === "playing") {
        const pipeSpeed = currentPipeSpeed(s.score, cfg);
        const pipeInterval = currentPipeInterval(s.score, cfg);

        s.bird.vy += GRAVITY * dt;
        s.bird.y += s.bird.vy * dt;
        s.bird.rotation = Math.max(-0.45, Math.min(1.2, s.bird.vy / 600));

        s.timeSincePipe += dt;
        if (s.timeSincePipe >= pipeInterval) {
          s.timeSincePipe = 0;
          const maxGapY =
            HEIGHT - GROUND_HEIGHT - pipeGap - PIPE_MAX_GAP_Y_PADDING;
          const gapY = PIPE_MIN_GAP_Y + Math.random() * (maxGapY - PIPE_MIN_GAP_Y);
          s.pipes.push({ x: WIDTH + 4, gapY, passed: false });
        }

        for (const p of s.pipes) {
          p.x -= pipeSpeed * dt;
          if (!p.passed && p.x + PIPE_WIDTH < BIRD_X - BIRD_SIZE / 2) {
            p.passed = true;
            s.score += 1;
            s.flashUntil = now + 120;
            setScore(s.score);
          }
        }
        s.pipes = s.pipes.filter((p) => p.x + PIPE_WIDTH > -20);

        const halfBird = BIRD_SIZE / 2 - BIRD_HITBOX_INSET;
        const birdLeft = BIRD_X - halfBird;
        const birdRight = BIRD_X + halfBird;
        const birdTop = s.bird.y - halfBird;
        const birdBottom = s.bird.y + halfBird;

        let collided = false;
        if (birdBottom >= HEIGHT - GROUND_HEIGHT || birdTop <= 0) {
          collided = true;
        } else {
          for (const p of s.pipes) {
            if (
              birdRight > p.x &&
              birdLeft < p.x + PIPE_WIDTH &&
              (birdTop < p.gapY || birdBottom > p.gapY + pipeGap)
            ) {
              collided = true;
              break;
            }
          }
        }

        if (collided) {
          s.state = "gameover";
          s.bird.vy = Math.max(s.bird.vy, 60);
          setGameState("gameover");
          if (s.score > 0) {
            const activeDifficulty = difficultyRef.current;
            const updater =
              activeDifficulty === "easy" ? setBestEasy : setBestHard;
            const storageKey = `${STORAGE_PREFIX}${activeDifficulty}`;
            updater((prev) => {
              const next = Math.max(prev, s.score);
              if (next !== prev) {
                try {
                  window.localStorage.setItem(storageKey, String(next));
                } catch {
                  /* ignore */
                }
              }
              return next;
            });
          }
        }
      } else if (s.state === "gameover") {
        const groundY = HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2;
        if (s.bird.y < groundY) {
          s.bird.vy += GRAVITY * dt;
          s.bird.y = Math.min(groundY, s.bird.y + s.bird.vy * dt);
          s.bird.rotation = Math.min(1.4, s.bird.rotation + 4 * dt);
        }
      } else {
        s.bird.y = HEIGHT / 2 + Math.sin(now / 320) * 8;
        s.bird.rotation = Math.sin(now / 320) * 0.08;
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = colors.border;
      const grid = 24;
      for (let x = grid; x < WIDTH; x += grid) {
        for (let y = grid; y < HEIGHT - GROUND_HEIGHT; y += grid) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      ctx.fillStyle = colors.fg;
      for (const p of s.pipes) {
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
        ctx.fillRect(
          p.x,
          p.gapY + pipeGap,
          PIPE_WIDTH,
          HEIGHT - GROUND_HEIGHT - (p.gapY + pipeGap),
        );
        ctx.fillStyle = colors.bg;
        ctx.fillRect(p.x + 4, p.gapY - 14, PIPE_WIDTH - 8, 4);
        ctx.fillRect(p.x + 4, p.gapY + pipeGap + 10, PIPE_WIDTH - 8, 4);
        ctx.fillStyle = colors.fg;
      }

      ctx.fillStyle = colors.fg;
      ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 1);
      ctx.fillStyle = colors.muted;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "top";
      const stride = 14;
      const groundScrollSpeed = s.state === "playing" ? 0.08 : 0.02;
      const offset = (now * groundScrollSpeed) % stride;
      for (let x = -stride + offset; x < WIDTH; x += stride) {
        ctx.fillText("/", x, HEIGHT - GROUND_HEIGHT + 14);
      }

      ctx.save();
      ctx.translate(BIRD_X, s.bird.y);
      ctx.rotate(s.bird.rotation);
      const flashing = now < s.flashUntil;
      ctx.fillStyle = flashing ? colors.fg : colors.accent;
      ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(BIRD_SIZE / 2 - 8, -BIRD_SIZE / 2 + 5, 3, 3);
      ctx.fillStyle = colors.fg;
      ctx.fillRect(BIRD_SIZE / 2, -2, 6, 4);
      ctx.fillStyle = colors.bg;
      const wingPhase = Math.sin(now / 80);
      const wingY = wingPhase > 0 ? 1 : 5;
      ctx.fillRect(-BIRD_SIZE / 2 + 3, wingY - BIRD_SIZE / 2 + 8, 8, 3);
      ctx.restore();

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      canvasRef.current?.focus({ preventScroll: true });
      flap();
    },
    [flap],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (event.code === "KeyR") {
        if (stateRef.current.state === "gameover") {
          event.preventDefault();
          restart();
        }
        return;
      }
      if (
        event.code !== "Space" &&
        event.code !== "ArrowUp" &&
        event.code !== "Enter"
      ) {
        return;
      }
      event.preventDefault();
      flap();
    },
    [flap, restart],
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="flex w-full items-center justify-center gap-2"
        style={{ maxWidth: WIDTH }}
      >
        {(["easy", "hard"] as const).map((d) => {
          const active = difficulty === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => handleDifficultyChange(d)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-background"
                  : "rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-subtle"
              }
            >
              {d === "easy" ? labels.easy : labels.hard}
            </button>
          );
        })}
      </div>
      <div
        className="relative w-full"
        style={{ maxWidth: WIDTH, aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      >
        <canvas
          ref={canvasRef}
          aria-label={labels.ariaLabel}
          role="application"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
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
                    onClick={restart}
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

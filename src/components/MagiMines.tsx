"use client";

import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface MagiMinesLabels {
  mines: string;
  time: string;
  best: string;
  newGame: string;
  easy: string;
  hard: string;
  youWon: string;
  gameOver: string;
  controlsHint: string;
  ariaLabel: string;
  flagAria: string;
  mineAria: string;
  hiddenAria: string;
  restart: string;
}

interface MagiMinesProps {
  labels: MagiMinesLabels;
}

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  hard: { rows: 10, cols: 10, mines: 18 },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;
type GameStatus = "playing" | "won" | "over";

interface Cell {
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type Board = Cell[][];

interface GameState {
  difficulty: Difficulty;
  board: Board;
  rows: number;
  cols: number;
  mineCount: number;
  flagCount: number;
  status: GameStatus;
  minesPlaced: boolean;
  startTime: number;
  endTime: number;
}

type Action =
  | { type: "click"; row: number; col: number }
  | { type: "flag"; row: number; col: number }
  | { type: "restart"; difficulty?: Difficulty };

const STORAGE_PREFIX = "magimines.best.";
const LONG_PRESS_MS = 420;
const LONG_PRESS_MOVE_THRESHOLD = 10;

function emptyCell(): Cell {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0,
  };
}

function createBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, emptyCell),
  );
}

function neighbors(
  rows: number,
  cols: number,
  r: number,
  c: number,
): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

function placeMines(
  board: Board,
  count: number,
  safeR: number,
  safeC: number,
): Board {
  const rows = board.length;
  const cols = board[0].length;
  const safe = new Set<string>();
  safe.add(`${safeR},${safeC}`);
  for (const [r, c] of neighbors(rows, cols, safeR, safeC)) {
    safe.add(`${r},${c}`);
  }
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safe.has(`${r},${c}`)) candidates.push([r, c]);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const next: Board = board.map((row) => row.map((cell) => ({ ...cell })));
  const placed = Math.min(count, candidates.length);
  for (let i = 0; i < placed; i++) {
    const [r, c] = candidates[i];
    next[r][c].hasMine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].hasMine) continue;
      let n = 0;
      for (const [nr, nc] of neighbors(rows, cols, r, c)) {
        if (next[nr][nc].hasMine) n++;
      }
      next[r][c].adjacentMines = n;
    }
  }
  return next;
}

function revealFlood(board: Board, r: number, c: number): Board {
  const rows = board.length;
  const cols = board[0].length;
  const next: Board = board.map((row) => row.map((cell) => ({ ...cell })));
  const queue: Array<[number, number]> = [[r, c]];
  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    const cell = next[cr][cc];
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (!cell.hasMine && cell.adjacentMines === 0) {
      for (const [nr, nc] of neighbors(rows, cols, cr, cc)) {
        const nb = next[nr][nc];
        if (!nb.isRevealed && !nb.isFlagged) queue.push([nr, nc]);
      }
    }
  }
  return next;
}

function revealAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((cell) =>
      cell.hasMine ? { ...cell, isRevealed: true, isFlagged: false } : cell,
    ),
  );
}

function isWon(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.hasMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

function initialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTIES[difficulty];
  return {
    difficulty,
    board: createBoard(config.rows, config.cols),
    rows: config.rows,
    cols: config.cols,
    mineCount: config.mines,
    flagCount: 0,
    status: "playing",
    minesPlaced: false,
    startTime: 0,
    endTime: 0,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "restart":
      return initialState(action.difficulty ?? state.difficulty);
    case "click": {
      if (state.status !== "playing") return state;
      const { row, col } = action;
      const target = state.board[row][col];
      if (target.isRevealed || target.isFlagged) return state;

      let board = state.board;
      let minesPlaced = state.minesPlaced;
      let startTime = state.startTime;

      if (!minesPlaced) {
        board = placeMines(board, state.mineCount, row, col);
        minesPlaced = true;
        startTime = Date.now();
      }

      if (board[row][col].hasMine) {
        return {
          ...state,
          board: revealAllMines(board),
          status: "over",
          minesPlaced,
          startTime,
          endTime: Date.now(),
        };
      }

      const flooded = revealFlood(board, row, col);
      if (isWon(flooded)) {
        return {
          ...state,
          board: flooded,
          status: "won",
          minesPlaced,
          startTime,
          endTime: Date.now(),
        };
      }

      return { ...state, board: flooded, minesPlaced, startTime };
    }
    case "flag": {
      if (state.status !== "playing") return state;
      const { row, col } = action;
      const cell = state.board[row][col];
      if (cell.isRevealed) return state;
      const next: Board = state.board.map((r) => r.map((c) => ({ ...c })));
      next[row][col].isFlagged = !cell.isFlagged;
      const delta = next[row][col].isFlagged ? 1 : -1;
      return { ...state, board: next, flagCount: state.flagCount + delta };
    }
    default:
      return state;
  }
}

function formatTime(seconds: number): string {
  const clamped = Math.max(0, Math.min(9999, Math.floor(seconds)));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function numberClass(value: number): string {
  if (value <= 2) return "text-foreground";
  if (value <= 4) return "text-foreground font-bold";
  return "text-accent font-bold";
}

function readCellCoords(target: EventTarget | null): [number, number] | null {
  if (!(target instanceof HTMLElement)) return null;
  const cell = target.closest<HTMLElement>("[data-row][data-col]");
  if (!cell) return null;
  const r = Number(cell.dataset.row);
  const c = Number(cell.dataset.col);
  if (!Number.isFinite(r) || !Number.isFinite(c)) return null;
  return [r, c];
}

interface CellViewProps {
  cell: Cell;
  row: number;
  col: number;
  isFocused: boolean;
  size: number;
  labelHidden: string;
  labelFlag: string;
  labelMine: string;
  cellRef: (node: HTMLDivElement | null) => void;
}

function CellView({
  cell,
  row,
  col,
  isFocused,
  size,
  labelHidden,
  labelFlag,
  labelMine,
  cellRef,
}: CellViewProps) {
  let stateClass: string;
  let content: React.ReactNode = "";
  let aria = labelHidden;

  if (!cell.isRevealed) {
    if (cell.isFlagged) {
      stateClass = "bg-subtle text-accent";
      content = "▲";
      aria = labelFlag;
    } else {
      stateClass = "bg-subtle hover:bg-subtle/70 transition-colors";
    }
  } else if (cell.hasMine) {
    stateClass = "bg-accent text-background";
    content = "●";
    aria = labelMine;
  } else if (cell.adjacentMines > 0) {
    stateClass = `bg-background ${numberClass(cell.adjacentMines)}`;
    content = cell.adjacentMines;
    aria = String(cell.adjacentMines);
  } else {
    stateClass = "bg-background";
  }

  const fontSize = size <= 28 ? "text-xs" : size <= 36 ? "text-sm" : "text-base";

  return (
    <div
      ref={cellRef}
      role="gridcell"
      data-row={row}
      data-col={col}
      tabIndex={isFocused ? 0 : -1}
      aria-label={aria}
      className={`flex aspect-square select-none items-center justify-center font-mono font-semibold tabular-nums outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${fontSize} ${stateClass}`}
    >
      {content}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-md border border-border bg-subtle px-3 py-2 text-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <span className="font-mono text-base font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

export function MagiMines({ labels }: MagiMinesProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState("easy"),
  );
  const [bestEasy, setBestEasy] = useState<number | null>(null);
  const [bestHard, setBestHard] = useState<number | null>(null);
  const [tickNow, setTickNow] = useState<number>(0);
  const [focusedCell, setFocusedCell] = useState<[number, number]>([0, 0]);
  const focusedCellRef = useRef<HTMLDivElement | null>(null);
  const dialogTitleId = useId();
  const dialogButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.status === "won" || state.status === "over") {
      dialogButtonRef.current?.focus({ preventScroll: true });
    }
  }, [state.status]);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  const pointerStart = useRef<{
    row: number;
    col: number;
    x: number;
    y: number;
  } | null>(null);
  const focusGridOnUpdate = useRef(false);

  useEffect(() => {
    try {
      const e = window.localStorage.getItem(`${STORAGE_PREFIX}easy`);
      const h = window.localStorage.getItem(`${STORAGE_PREFIX}hard`);
      const eParsed = e ? Number.parseInt(e, 10) : NaN;
      const hParsed = h ? Number.parseInt(h, 10) : NaN;
      if (Number.isFinite(eParsed) && eParsed > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage (external system)
        setBestEasy(eParsed);
      }
      if (Number.isFinite(hParsed) && hParsed > 0) {
        setBestHard(hParsed);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    if (state.status !== "playing" || !state.minesPlaced) return;
    const tick = () => setTickNow(Date.now());
    const raf = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, 250);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [state.status, state.minesPlaced]);

  useEffect(() => {
    if (state.status !== "won") return;
    if (!state.startTime || !state.endTime) return;
    const elapsed = Math.floor((state.endTime - state.startTime) / 1000);
    const key = `${STORAGE_PREFIX}${state.difficulty}`;
    const updater = state.difficulty === "easy" ? setBestEasy : setBestHard;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- recording win time after game ends (external system: localStorage)
    updater((prev) => {
      if (prev !== null && prev <= elapsed) return prev;
      try {
        window.localStorage.setItem(key, String(elapsed));
      } catch {
        /* ignore */
      }
      return elapsed;
    });
  }, [state.status, state.startTime, state.endTime, state.difficulty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset focus when board dimensions change
    setFocusedCell([0, 0]);
  }, [state.rows, state.cols]);

  useEffect(() => {
    if (focusGridOnUpdate.current) {
      focusGridOnUpdate.current = false;
      focusedCellRef.current?.focus({ preventScroll: true });
    }
  }, [focusedCell]);

  const elapsedSeconds = state.startTime
    ? Math.max(
        0,
        Math.floor(
          ((state.endTime || tickNow) - state.startTime) / 1000,
        ),
      )
    : 0;
  const minesRemaining = Math.max(0, state.mineCount - state.flagCount);
  const bestForCurrent =
    state.difficulty === "easy" ? bestEasy : bestHard;

  const handleRestart = useCallback((difficulty?: Difficulty) => {
    dispatch({ type: "restart", difficulty });
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleGridPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (state.status !== "playing") return;
      const coords = readCellCoords(event.target);
      if (!coords) return;
      const [row, col] = coords;
      pointerStart.current = {
        row,
        col,
        x: event.clientX,
        y: event.clientY,
      };
      longPressFired.current = false;
      cancelLongPress();
      longPressTimer.current = window.setTimeout(() => {
        longPressTimer.current = null;
        longPressFired.current = true;
        if (pointerStart.current) {
          dispatch({ type: "flag", row, col });
        }
      }, LONG_PRESS_MS);
    },
    [state.status, cancelLongPress],
  );

  const handleGridPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = pointerStart.current;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD) {
        cancelLongPress();
        pointerStart.current = null;
      }
    },
    [cancelLongPress],
  );

  const handleGridPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      cancelLongPress();
      const start = pointerStart.current;
      pointerStart.current = null;

      if (longPressFired.current) {
        longPressFired.current = false;
        return;
      }
      if (!start) return;
      if (state.status !== "playing") return;

      const coords = readCellCoords(event.target);
      if (!coords) return;
      const [row, col] = coords;
      if (row !== start.row || col !== start.col) return;

      dispatch({ type: "click", row, col });
      setFocusedCell([row, col]);
    },
    [state.status, cancelLongPress],
  );

  const handleGridPointerCancel = useCallback(() => {
    cancelLongPress();
    pointerStart.current = null;
    longPressFired.current = false;
  }, [cancelLongPress]);

  const handleGridContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      cancelLongPress();
      pointerStart.current = null;
      longPressFired.current = true;
      if (state.status !== "playing") return;
      const coords = readCellCoords(event.target);
      if (!coords) return;
      const [row, col] = coords;
      dispatch({ type: "flag", row, col });
      setFocusedCell([row, col]);
    },
    [state.status, cancelLongPress],
  );

  const handleGridKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const [r, c] = focusedCell;
      let newR = r;
      let newC = c;
      let movement = false;

      switch (event.code) {
        case "ArrowUp":
          newR = Math.max(0, r - 1);
          movement = true;
          break;
        case "ArrowDown":
          newR = Math.min(state.rows - 1, r + 1);
          movement = true;
          break;
        case "ArrowLeft":
          newC = Math.max(0, c - 1);
          movement = true;
          break;
        case "ArrowRight":
          newC = Math.min(state.cols - 1, c + 1);
          movement = true;
          break;
        case "Home":
          newC = 0;
          movement = true;
          break;
        case "End":
          newC = state.cols - 1;
          movement = true;
          break;
        case "Space":
        case "Enter":
          event.preventDefault();
          if (state.status === "playing") {
            dispatch({ type: "click", row: r, col: c });
          }
          return;
        case "KeyF":
          event.preventDefault();
          if (state.status === "playing") {
            dispatch({ type: "flag", row: r, col: c });
          }
          return;
        default:
          return;
      }

      if (movement) {
        event.preventDefault();
        if (newR !== r || newC !== c) {
          focusGridOnUpdate.current = true;
          setFocusedCell([newR, newC]);
        }
      }
    },
    [focusedCell, state.rows, state.cols, state.status],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code !== "KeyR") return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      dispatch({ type: "restart" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const cellSize = state.cols >= 10 ? 32 : 36;
  const showOverlay = state.status === "won" || state.status === "over";

  const setCellRef = (r: number, c: number) => (node: HTMLDivElement | null) => {
    if (focusedCell[0] === r && focusedCell[1] === c) {
      focusedCellRef.current = node;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <StatCard
          label={labels.mines}
          value={String(minesRemaining).padStart(2, "0")}
        />
        <StatCard label={labels.time} value={formatTime(elapsedSeconds)} />
        <StatCard
          label={labels.best}
          value={
            bestForCurrent !== null ? formatTime(bestForCurrent) : "--:--"
          }
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
            const active = state.difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleRestart(d)}
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
        <button
          type="button"
          onClick={() => handleRestart()}
          className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {labels.newGame}
        </button>
      </div>

      <div className="relative">
        <div
          role="grid"
          aria-label={labels.ariaLabel}
          onPointerDown={handleGridPointerDown}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerCancel={handleGridPointerCancel}
          onPointerLeave={handleGridPointerCancel}
          onContextMenu={handleGridContextMenu}
          onKeyDown={handleGridKeyDown}
          className="grid select-none gap-px overflow-hidden rounded-md border border-border bg-border touch-pan-y"
          style={{
            gridTemplateColumns: `repeat(${state.cols}, minmax(0, 1fr))`,
          }}
        >
          {state.board.map((row, r) => (
            <div
              key={r}
              role="row"
              style={{ display: "contents" }}
            >
              {row.map((cell, c) => (
                <CellView
                  key={`${r}-${c}`}
                  cell={cell}
                  row={r}
                  col={c}
                  isFocused={focusedCell[0] === r && focusedCell[1] === c}
                  size={cellSize}
                  labelHidden={labels.hiddenAria}
                  labelFlag={labels.flagAria}
                  labelMine={labels.mineAria}
                  cellRef={setCellRef(r, c)}
                />
              ))}
            </div>
          ))}
        </div>

        {showOverlay ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
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
                {state.status === "won" ? labels.youWon : labels.gameOver}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 font-mono text-xs text-foreground">
                <span>
                  {labels.time} {formatTime(elapsedSeconds)}
                </span>
                {bestForCurrent !== null && state.status === "won" ? (
                  <>
                    <span className="text-muted">·</span>
                    <span>
                      {labels.best} {formatTime(bestForCurrent)}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-3">
                <button
                  ref={dialogButtonRef}
                  type="button"
                  onClick={() => handleRestart()}
                  className="rounded-full bg-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {labels.restart}
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

"use client";

import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

interface KolmikLabels {
  wins: string;
  draws: string;
  losses: string;
  newGame: string;
  easy: string;
  hard: string;
  youWon: string;
  youLost: string;
  draw: string;
  yourTurn: string;
  aiThinking: string;
  controlsHint: string;
  ariaLabel: string;
  cellEmptyAria: string;
  cellPlayerAria: string;
  cellAiAria: string;
  restart: string;
}

interface KolmikProps {
  labels: KolmikLabels;
}

type Mark = "X" | "O" | null;
type Difficulty = "easy" | "hard";
type Status = "playing" | "won" | "lost" | "draw";
type Turn = "player" | "ai";

interface Stats {
  wins: number;
  draws: number;
  losses: number;
}

interface GameState {
  board: Mark[];
  difficulty: Difficulty;
  turn: Turn;
  status: Status;
  winLine: number[] | null;
}

type Action =
  | { type: "place"; index: number; mark: Mark }
  | { type: "restart"; difficulty?: Difficulty };

const STORAGE_PREFIX = "kolmik.stats.";
const AI_DELAY_MS = 380;

const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const PLAYER_MARK: Mark = "X";
const AI_MARK: Mark = "O";

function emptyBoard(): Mark[] {
  return Array<Mark>(9).fill(null);
}

function checkWinner(board: Mark[]): { mark: Mark; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { mark: v, line };
    }
  }
  return null;
}

function isFull(board: Mark[]): boolean {
  return board.every((c) => c !== null);
}

function initialState(difficulty: Difficulty): GameState {
  return {
    board: emptyBoard(),
    difficulty,
    turn: "player",
    status: "playing",
    winLine: null,
  };
}

function emptyIndices(board: Mark[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (board[i] === null) out.push(i);
  return out;
}

function minimax(
  board: Mark[],
  isMaximizing: boolean,
  depth: number,
): number {
  const winner = checkWinner(board);
  if (winner) {
    return winner.mark === AI_MARK ? 10 - depth : depth - 10;
  }
  if (isFull(board)) return 0;

  const empties = emptyIndices(board);
  if (isMaximizing) {
    let best = -Infinity;
    for (const i of empties) {
      board[i] = AI_MARK;
      const score = minimax(board, false, depth + 1);
      board[i] = null;
      if (score > best) best = score;
    }
    return best;
  }
  let best = Infinity;
  for (const i of empties) {
    board[i] = PLAYER_MARK;
    const score = minimax(board, true, depth + 1);
    board[i] = null;
    if (score < best) best = score;
  }
  return best;
}

function bestMove(board: Mark[]): number {
  const empties = emptyIndices(board);
  if (empties.length === 0) return -1;

  let bestScore = -Infinity;
  const bestMoves: number[] = [];
  const working = board.slice();
  for (const i of empties) {
    working[i] = AI_MARK;
    const score = minimax(working, false, 0);
    working[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMoves.length = 0;
      bestMoves.push(i);
    } else if (score === bestScore) {
      bestMoves.push(i);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function randomMove(board: Mark[]): number {
  const empties = emptyIndices(board);
  if (empties.length === 0) return -1;
  return empties[Math.floor(Math.random() * empties.length)];
}

function pickAiMove(board: Mark[], difficulty: Difficulty): number {
  if (difficulty === "easy") return randomMove(board);
  return bestMove(board);
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "restart":
      return initialState(action.difficulty ?? state.difficulty);
    case "place": {
      if (state.status !== "playing") return state;
      const { index, mark } = action;
      if (state.board[index] !== null) return state;
      const expectedMark =
        state.turn === "player" ? PLAYER_MARK : AI_MARK;
      if (mark !== expectedMark) return state;

      const nextBoard = state.board.slice();
      nextBoard[index] = mark;
      const winner = checkWinner(nextBoard);
      if (winner) {
        const status: Status =
          winner.mark === PLAYER_MARK ? "won" : "lost";
        return {
          ...state,
          board: nextBoard,
          turn: "player",
          status,
          winLine: winner.line,
        };
      }
      if (isFull(nextBoard)) {
        return {
          ...state,
          board: nextBoard,
          turn: "player",
          status: "draw",
          winLine: null,
        };
      }
      return {
        ...state,
        board: nextBoard,
        turn: state.turn === "player" ? "ai" : "player",
      };
    }
    default:
      return state;
  }
}

function emptyStats(): Stats {
  return { wins: 0, draws: 0, losses: 0 };
}

function readStats(difficulty: Difficulty): Stats {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${difficulty}`);
    if (!raw) return emptyStats();
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "wins" in parsed &&
      "draws" in parsed &&
      "losses" in parsed
    ) {
      const w = Number((parsed as { wins: unknown }).wins);
      const d = Number((parsed as { draws: unknown }).draws);
      const l = Number((parsed as { losses: unknown }).losses);
      return {
        wins: Number.isFinite(w) && w >= 0 ? w : 0,
        draws: Number.isFinite(d) && d >= 0 ? d : 0,
        losses: Number.isFinite(l) && l >= 0 ? l : 0,
      };
    }
  } catch {
    /* ignore */
  }
  return emptyStats();
}

function writeStats(difficulty: Difficulty, stats: Stats): void {
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${difficulty}`,
      JSON.stringify(stats),
    );
  } catch {
    /* ignore */
  }
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

interface CellViewProps {
  mark: Mark;
  index: number;
  isFocused: boolean;
  isWinning: boolean;
  disabled: boolean;
  ariaEmpty: string;
  ariaPlayer: string;
  ariaAi: string;
  cellRef: (node: HTMLButtonElement | null) => void;
  onActivate: (index: number) => void;
}

function CellView({
  mark,
  index,
  isFocused,
  isWinning,
  disabled,
  ariaEmpty,
  ariaPlayer,
  ariaAi,
  cellRef,
  onActivate,
}: CellViewProps) {
  let stateClass: string;
  let content: string = "";
  let aria = ariaEmpty;

  if (mark === PLAYER_MARK) {
    stateClass = isWinning
      ? "bg-foreground text-background"
      : "bg-subtle text-foreground";
    content = "X";
    aria = ariaPlayer;
  } else if (mark === AI_MARK) {
    stateClass = isWinning
      ? "bg-accent text-background"
      : "bg-subtle text-accent";
    content = "O";
    aria = ariaAi;
  } else {
    stateClass =
      "bg-background hover:bg-subtle/70 transition-colors text-muted";
  }

  return (
    <button
      ref={cellRef}
      type="button"
      role="gridcell"
      tabIndex={isFocused ? 0 : -1}
      aria-label={aria}
      disabled={disabled && mark === null ? false : disabled}
      onClick={() => onActivate(index)}
      className={`flex aspect-square select-none items-center justify-center font-mono text-4xl font-semibold tabular-nums outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed sm:text-5xl ${stateClass}`}
    >
      {content}
    </button>
  );
}

export function Kolmik({ labels }: KolmikProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState("easy"),
  );
  const [statsEasy, setStatsEasy] = useState<Stats>(emptyStats);
  const [statsHard, setStatsHard] = useState<Stats>(emptyStats);
  const [focusedCell, setFocusedCell] = useState<number>(4);
  const focusedCellRef = useRef<HTMLButtonElement | null>(null);
  const focusGridOnUpdate = useRef(false);
  const recordedRef = useRef(false);
  const dialogTitleId = useId();
  const dialogButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage (external system)
    setStatsEasy(readStats("easy"));
    setStatsHard(readStats("hard"));
  }, []);

  useEffect(() => {
    if (state.status === "playing") {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const updater =
      state.difficulty === "easy" ? setStatsEasy : setStatsHard;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- recording terminal game result (external system: localStorage)
    updater((prev) => {
      const next: Stats = {
        wins: prev.wins + (state.status === "won" ? 1 : 0),
        draws: prev.draws + (state.status === "draw" ? 1 : 0),
        losses: prev.losses + (state.status === "lost" ? 1 : 0),
      };
      writeStats(state.difficulty, next);
      return next;
    });
  }, [state.status, state.difficulty]);

  useEffect(() => {
    if (state.status === "playing") return;
    dialogButtonRef.current?.focus({ preventScroll: true });
  }, [state.status]);

  useEffect(() => {
    if (state.turn !== "ai" || state.status !== "playing") return;
    const handle = window.setTimeout(() => {
      const index = pickAiMove(state.board, state.difficulty);
      if (index < 0) return;
      dispatch({ type: "place", index, mark: AI_MARK });
    }, AI_DELAY_MS);
    return () => window.clearTimeout(handle);
  }, [state.turn, state.status, state.board, state.difficulty]);

  useEffect(() => {
    if (focusGridOnUpdate.current) {
      focusGridOnUpdate.current = false;
      focusedCellRef.current?.focus({ preventScroll: true });
    }
  }, [focusedCell]);

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

  const handleRestart = useCallback((difficulty?: Difficulty) => {
    dispatch({ type: "restart", difficulty });
    setFocusedCell(4);
  }, []);

  const handleActivate = useCallback(
    (index: number) => {
      if (state.status !== "playing") return;
      if (state.turn !== "player") return;
      if (state.board[index] !== null) return;
      dispatch({ type: "place", index, mark: PLAYER_MARK });
      setFocusedCell(index);
    },
    [state.status, state.turn, state.board],
  );

  const handleGridKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      let next = focusedCell;
      let movement = false;
      const row = Math.floor(focusedCell / 3);
      const col = focusedCell % 3;

      switch (event.code) {
        case "ArrowUp":
          next = Math.max(0, row - 1) * 3 + col;
          movement = true;
          break;
        case "ArrowDown":
          next = Math.min(2, row + 1) * 3 + col;
          movement = true;
          break;
        case "ArrowLeft":
          next = row * 3 + Math.max(0, col - 1);
          movement = true;
          break;
        case "ArrowRight":
          next = row * 3 + Math.min(2, col + 1);
          movement = true;
          break;
        case "Home":
          next = row * 3;
          movement = true;
          break;
        case "End":
          next = row * 3 + 2;
          movement = true;
          break;
        case "Space":
        case "Enter":
          event.preventDefault();
          handleActivate(focusedCell);
          return;
        default:
          return;
      }

      if (movement) {
        event.preventDefault();
        if (next !== focusedCell) {
          focusGridOnUpdate.current = true;
          setFocusedCell(next);
        }
      }
    },
    [focusedCell, handleActivate],
  );

  const setCellRef =
    (index: number) => (node: HTMLButtonElement | null) => {
      if (focusedCell === index) {
        focusedCellRef.current = node;
      }
    };

  const statsForCurrent =
    state.difficulty === "easy" ? statsEasy : statsHard;
  const showOverlay = state.status !== "playing";
  const dialogText =
    state.status === "won"
      ? labels.youWon
      : state.status === "lost"
        ? labels.youLost
        : labels.draw;
  const turnText =
    state.status !== "playing"
      ? ""
      : state.turn === "player"
        ? labels.yourTurn
        : labels.aiThinking;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <StatCard
          label={labels.wins}
          value={String(statsForCurrent.wins).padStart(2, "0")}
        />
        <StatCard
          label={labels.draws}
          value={String(statsForCurrent.draws).padStart(2, "0")}
        />
        <StatCard
          label={labels.losses}
          value={String(statsForCurrent.losses).padStart(2, "0")}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["easy", "hard"] as const).map((d) => {
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

      <div className="relative isolate">
        <div
          role="grid"
          aria-label={labels.ariaLabel}
          onKeyDown={handleGridKeyDown}
          className="grid select-none grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border"
        >
          {state.board.map((mark, i) => {
            const isWinning = state.winLine?.includes(i) ?? false;
            const disabled =
              state.status !== "playing" ||
              state.turn !== "player" ||
              mark !== null;
            return (
              <CellView
                key={i}
                mark={mark}
                index={i}
                isFocused={focusedCell === i}
                isWinning={isWinning}
                disabled={disabled}
                ariaEmpty={labels.cellEmptyAria}
                ariaPlayer={labels.cellPlayerAria}
                ariaAi={labels.cellAiAria}
                cellRef={setCellRef(i)}
                onActivate={handleActivate}
              />
            );
          })}
        </div>

        {showOverlay ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
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
                {dialogText}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 font-mono text-xs text-foreground">
                <span>
                  {labels.wins} {statsForCurrent.wins}
                </span>
                <span className="text-muted">·</span>
                <span>
                  {labels.draws} {statsForCurrent.draws}
                </span>
                <span className="text-muted">·</span>
                <span>
                  {labels.losses} {statsForCurrent.losses}
                </span>
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

      <div className="flex flex-col gap-1 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {turnText ? (
          <span aria-live="polite" className="text-foreground">
            {turnText}
          </span>
        ) : null}
        <span>{labels.controlsHint}</span>
      </div>
    </div>
  );
}

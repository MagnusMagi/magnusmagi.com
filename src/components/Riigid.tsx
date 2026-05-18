"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface RiigidLabels {
  score: string;
  best: string;
  streak: string;
  newGame: string;
  easy: string;
  hard: string;
  controlsHint: string;
  ariaLabel: string;
  flagAria: string;
}

interface RiigidProps {
  labels: RiigidLabels;
  locale: string;
}

type Difficulty = "easy" | "hard";

const OPTION_COUNT = 4;
const STORAGE_PREFIX = "riigid.best.";
const FEEDBACK_DELAY_MS = 1100;

const EASY_COUNTRIES: readonly string[] = [
  "AR", "AT", "AU", "BE", "BR", "CA", "CH", "CL", "CN", "CO",
  "CZ", "DE", "DK", "EE", "EG", "ES", "FI", "FR", "GB", "GR",
  "HR", "HU", "ID", "IE", "IN", "IS", "IT", "JP", "KR", "MA",
  "MX", "MY", "NG", "NL", "NO", "NZ", "PL", "PT", "RO", "RS",
  "RU", "SA", "SE", "SG", "TH", "TR", "UA", "US", "VN", "ZA",
];

const HARD_COUNTRIES: readonly string[] = [
  "AD", "AE", "AF", "AG", "AL", "AM", "AO", "AR", "AT", "AU",
  "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ",
  "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD",
  "CF", "CG", "CH", "CI", "CL", "CM", "CN", "CO", "CR", "CU",
  "CV", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC",
  "EE", "EG", "ER", "ES", "ET", "FI", "FJ", "FM", "FR", "GA",
  "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW",
  "GY", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IN", "IQ",
  "IR", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI",
  "KM", "KN", "KP", "KR", "KW", "KZ", "LA", "LB", "LC", "LI",
  "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD",
  "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MR", "MT", "MU",
  "MV", "MW", "MX", "MY", "MZ", "NA", "NE", "NG", "NI", "NL",
  "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK",
  "PL", "PT", "PW", "PY", "QA", "RO", "RS", "RU", "RW", "SA",
  "SB", "SC", "SD", "SE", "SG", "SI", "SK", "SL", "SM", "SN",
  "SO", "SR", "SS", "ST", "SV", "SY", "SZ", "TD", "TG", "TH",
  "TJ", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VN", "VU",
  "WS", "YE", "ZA", "ZM", "ZW",
];

interface Round {
  correct: string;
  options: string[];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildRound(pool: readonly string[], seen: Set<string>): Round {
  let unseen = pool.filter((c) => !seen.has(c));
  if (unseen.length === 0) {
    seen.clear();
    unseen = pool.slice();
  }
  const correct = unseen[Math.floor(Math.random() * unseen.length)];
  seen.add(correct);

  const others: string[] = [];
  const distractors = pool.filter((c) => c !== correct);
  while (others.length < OPTION_COUNT - 1 && distractors.length > 0) {
    const idx = Math.floor(Math.random() * distractors.length);
    others.push(distractors[idx]);
    distractors.splice(idx, 1);
  }
  return { correct, options: shuffle([correct, ...others]) };
}

function poolFor(difficulty: Difficulty): readonly string[] {
  return difficulty === "easy" ? EASY_COUNTRIES : HARD_COUNTRIES;
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

export function Riigid({ labels, locale }: RiigidProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [current, setCurrent] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [bestEasy, setBestEasy] = useState(0);
  const [bestHard, setBestHard] = useState(0);
  const advanceTimer = useRef<number | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return new Intl.DisplayNames(["en"], { type: "region" });
    }
  }, [locale]);

  const nameOf = useCallback(
    (code: string): string => {
      try {
        return displayNames.of(code) ?? code;
      } catch {
        return code;
      }
    },
    [displayNames],
  );

  const startNew = useCallback((diff: Difficulty) => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setSelected(null);
    seenRef.current = new Set();
    setCurrent(buildRound(poolFor(diff), seenRef.current));
  }, []);

  useEffect(() => {
    seenRef.current = new Set();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial round on mount
    setCurrent(buildRound(poolFor("easy"), seenRef.current));
  }, []);

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
    const e = readKey(`${STORAGE_PREFIX}easy`);
    const h = readKey(`${STORAGE_PREFIX}hard`);
    if (e > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage (external system)
      setBestEasy(e);
    }
    if (h > 0) {
      setBestHard(h);
    }
  }, []);

  useEffect(() => {
    if (streak <= 0) return;
    const updater = difficulty === "easy" ? setBestEasy : setBestHard;
    const key = `${STORAGE_PREFIX}${difficulty}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- persist new best streak as it advances (external system: localStorage)
    updater((prev) => {
      if (streak <= prev) return prev;
      try {
        window.localStorage.setItem(key, String(streak));
      } catch {
        /* ignore */
      }
      return streak;
    });
  }, [streak, difficulty]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      if (selected !== null) return;
      if (!current) return;

      setSelected(code);
      const correct = code === current.correct;
      if (correct) {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }

      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        setSelected(null);
        setCurrent(buildRound(poolFor(difficulty), seenRef.current));
      }, FEEDBACK_DELAY_MS);
    },
    [selected, current, difficulty],
  );

  const best = difficulty === "easy" ? bestEasy : bestHard;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <StatCard
          label={labels.score}
          value={String(score).padStart(2, "0")}
        />
        <StatCard
          label={labels.streak}
          value={String(streak).padStart(2, "0")}
        />
        <StatCard
          label={labels.best}
          value={String(best).padStart(2, "0")}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["easy", "hard"] as const).map((d) => {
            const active = difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => startNew(d)}
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
          onClick={() => startNew(difficulty)}
          className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {labels.newGame}
        </button>
      </div>

      <div role="region" aria-label={labels.ariaLabel}>
        <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-md border border-border bg-subtle">
          {current ? (
            <img
              key={current.correct}
              src={`https://flagcdn.com/w640/${current.correct.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w320/${current.correct.toLowerCase()}.png 1x, https://flagcdn.com/w640/${current.correct.toLowerCase()}.png 2x`}
              alt={labels.flagAria}
              width={640}
              height={427}
              loading="eager"
              decoding="async"
              className="h-full w-full object-contain"
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {current?.options.map((code) => {
          const isCorrect = current.correct === code;
          const isSelected = selected === code;
          const showFeedback = selected !== null;
          let cls =
            "rounded-md border px-3 py-3 text-left font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
          if (!showFeedback) {
            cls += " border-border bg-background text-foreground hover:bg-subtle";
          } else if (isCorrect) {
            cls += " border-accent bg-accent text-background";
          } else if (isSelected) {
            cls += " border-border bg-subtle text-muted line-through";
          } else {
            cls += " border-border bg-background text-muted";
          }
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleSelect(code)}
              disabled={selected !== null}
              className={cls}
            >
              {nameOf(code)}
            </button>
          );
        })}
      </div>

      <div className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {labels.controlsHint}
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import type { TileState } from "../types";

// ── Symbol + colour pools ──────────────────────────────────────────────────
const SYMBOLS = [
  "🔥","💎","⚡","🌊","🍀","🦋","🎯","🚀",
  "🌙","⭐","🎸","🎲","🦄","🐉","🍄","🌺",
  "🦊","🐬","🎃","🌈","🏆","💫","🔮","🎪",
  "🦁","🐙","🎵","🌸","🍁","🎭","🔑","🌟",
  "🦅","🐠","🎨","🌍","🍉","🎠","💡","🧩",
];

const NEON_COLORS = [
  "#ff2d78","#ff6b2d","#ffd700","#39ff14","#00e5ff",
  "#bf5fff","#ff0090","#00ff9f","#ff4500","#00bfff",
  "#ff69b4","#7fff00","#ff1493","#1e90ff","#ff8c00",
  "#adff2f","#ff3864","#0ff","#f0f","#fa0",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildTiles(size: number): TileState[] {
  const count = (size * size) / 2;
  const symbols = shuffle(SYMBOLS).slice(0, count);
  const colors = shuffle(NEON_COLORS).slice(0, count);

  const pairs: TileState[] = [];
  symbols.forEach((sym, i) => {
    const color = colors[i] ?? "#fff";
    pairs.push({ id: i * 2,     symbol: sym, color, flipped: false, matched: false });
    pairs.push({ id: i * 2 + 1, symbol: sym, color, flipped: false, matched: false });
  });
  return shuffle(pairs).map((t, idx) => ({ ...t, id: idx }));
}

// ── Score helpers ──────────────────────────────────────────────────────────
// Best score = fewest moves (lower is better). We store separately per mode.
function lsKey(hard: boolean) {
  return hard ? "glowmatch_best_hard" : "glowmatch_best_easy";
}

function loadBest(hard: boolean): number {
  try { return Number(localStorage.getItem(lsKey(hard)) ?? 0); } catch { return 0; }
}

function saveBest(hard: boolean, moves: number) {
  try { localStorage.setItem(lsKey(hard), String(moves)); } catch { /**/ }
}

// ── Hook ──────────────────────────────────────────────────────────────────
export type Phase = "playing" | "checking" | "won";

export interface MemoryGameState {
  tiles: TileState[];
  moves: number;
  elapsed: number;      // seconds
  phase: Phase;
  hardMode: boolean;
  bestMoves: number;    // 0 = none recorded
}

export interface MemoryGameActions {
  flip: (id: number) => void;
  restart: () => void;
  toggleHard: () => void;
}

export function useMemoryGame(): [MemoryGameState, MemoryGameActions] {
  const [hardMode, setHardMode] = useState(false);
  const [tiles, setTiles] = useState<TileState[]>(() => buildTiles(4));
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [bestMoves, setBestMoves] = useState(() => loadBest(false));

  // refs for timer
  const startRef = useRef<number>(Date.now());
  const frameRef = useRef<number>(0);

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") {
      cancelAnimationFrame(frameRef.current);
      return;
    }
    startRef.current = Date.now() - elapsed * 1000;

    function tick() {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Flip logic ─────────────────────────────────────────────────────────
  const flip = useCallback((id: number) => {
    if (phase !== "playing") return;

    setTiles((prev) => {
      const tile = prev.find((t) => t.id === id);
      if (!tile || tile.flipped || tile.matched) return prev;

      const faceUp = prev.filter((t) => t.flipped && !t.matched);
      if (faceUp.length >= 2) return prev; // already two up

      const next = prev.map((t) => t.id === id ? { ...t, flipped: true } : t);

      const nowUp = next.filter((t) => t.flipped && !t.matched);

      if (nowUp.length === 2) {
        const [a, b] = nowUp as [TileState, TileState];

        setMoves((m) => m + 1);
        setPhase("checking");

        if (a.symbol === b.symbol) {
          // ── Match ──
          const matched = next.map((t) =>
            t.id === a.id || t.id === b.id ? { ...t, matched: true, flipped: false } : t
          );
          const allDone = matched.every((t) => t.matched);
          setTimeout(() => {
            setTiles(matched);
            setPhase(allDone ? "won" : "playing");
          }, 400);
        } else {
          // ── Mismatch ──
          setTimeout(() => {
            setTiles((cur) =>
              cur.map((t) =>
                t.id === a.id || t.id === b.id ? { ...t, flipped: false } : t
              )
            );
            setPhase("playing");
          }, 900);
        }
      }

      return next;
    });
  }, [phase]);

  // ── Record best score on win ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "won") return;
    const prev = loadBest(hardMode);
    if (prev === 0 || moves < prev) {
      saveBest(hardMode, moves);
      setBestMoves(moves);
    } else {
      setBestMoves(prev);
    }
  }, [phase, hardMode, moves]);

  // ── Restart ────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    const size = hardMode ? 6 : 4;
    setTiles(buildTiles(size));
    setMoves(0);
    setElapsed(0);
    setPhase("playing");
    setBestMoves(loadBest(hardMode));
    startRef.current = Date.now();
  }, [hardMode]);

  // ── Toggle hard mode ───────────────────────────────────────────────────
  const toggleHard = useCallback(() => {
    setHardMode((h) => {
      const next = !h;
      cancelAnimationFrame(frameRef.current);
      const size = next ? 6 : 4;
      setTiles(buildTiles(size));
      setMoves(0);
      setElapsed(0);
      setPhase("playing");
      setBestMoves(loadBest(next));
      startRef.current = Date.now();
      return next;
    });
  }, []);

  return [
    { tiles, moves, elapsed, phase, hardMode, bestMoves },
    { flip, restart, toggleHard },
  ];
}

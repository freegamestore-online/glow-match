import { GameShell, GameTopbar } from "@freegamestore/games";
import { GameGrid } from "./components/GameGrid";
import { MemoryTile } from "./components/MemoryTile";
import { useMemoryGame } from "./hooks/useMemoryGame";
import type { TileState } from "./types";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Build a 2-D grid from a flat tile array
function toGrid(tiles: TileState[], cols: number): TileState[][] {
  const rows: TileState[][] = [];
  for (let r = 0; r < tiles.length / cols; r++) {
    rows.push(tiles.slice(r * cols, r * cols + cols));
  }
  return rows;
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, actions] = useMemoryGame();
  const { tiles, moves, elapsed, phase, hardMode, bestMoves } = state;
  const { flip, restart, toggleHard } = actions;

  const cols = hardMode ? 6 : 4;
  const grid = toGrid(tiles, cols);

  // Tile size: shrink a bit on 6×6
  const tileSize = hardMode
    ? "clamp(2.4rem, 10vmin, 4rem)"
    : "clamp(3rem, 13vmin, 5.2rem)";

  const matchedCount = tiles.filter((t) => t.matched).length / 2;
  const totalPairs = tiles.length / 2;

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Glow Match"
          score={moves}
        />
      }
    >
      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-start h-full"
        style={{ paddingTop: "0.75rem", paddingBottom: "0.5rem", gap: "0.6rem", overflowY: "auto" }}
      >
        {/* ── Stats bar ─────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center flex-wrap"
          style={{ gap: "0.75rem" }}
        >
          <StatPill label="Moves" value={String(moves)} color="var(--accent)" />
          <StatPill label="Time" value={formatTime(elapsed)} color="#a855f7" />
          <StatPill label="Pairs" value={`${matchedCount}/${totalPairs}`} color="#10b981" />
          {bestMoves > 0 && (
            <StatPill label="Best" value={`${bestMoves} moves`} color="#f59e0b" />
          )}
        </div>

        {/* ── Mode toggle ───────────────────────────────────────────── */}
        <div className="flex items-center" style={{ gap: "0.5rem" }}>
          <button
            onClick={toggleHard}
            style={{
              padding: "0.3rem 0.9rem",
              borderRadius: "999px",
              border: `2px solid ${hardMode ? "#ff2d78" : "var(--line-strong)"}`,
              background: hardMode ? "#ff2d7822" : "transparent",
              color: hardMode ? "#ff2d78" : "var(--muted)",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 200ms",
            }}
          >
            {hardMode ? "⚡ HARD 6×6" : "☆ EASY 4×4"}
          </button>
          <button
            onClick={restart}
            style={{
              padding: "0.3rem 0.9rem",
              borderRadius: "999px",
              border: "2px solid var(--line-strong)",
              background: "transparent",
              color: "var(--muted)",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 200ms",
            }}
          >
            ↺ NEW GAME
          </button>
        </div>

        {/* ── Grid ──────────────────────────────────────────────────── */}
        <div style={{ flex: "0 0 auto" }}>
          <GameGrid<TileState>
            grid={grid}
            cellSize={tileSize}
            gap={hardMode ? "0.35rem" : "0.45rem"}
            renderCell={(tile) => (
              <MemoryTile
                key={tile.id}
                tile={tile}
                onClick={flip}
                size={tileSize}
              />
            )}
          />
        </div>
      </div>

      {/* ── Win overlay ───────────────────────────────────────────────── */}
      {phase === "won" && (
        <WinScreen
          moves={moves}
          elapsed={elapsed}
          bestMoves={bestMoves}
          hardMode={hardMode}
          onRestart={restart}
          onToggleHard={toggleHard}
        />
      )}
    </GameShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0.25rem 0.7rem",
        borderRadius: "0.5rem",
        border: `1.5px solid ${color}55`,
        background: `${color}11`,
        minWidth: "3.5rem",
      }}
    >
      <span style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: "1rem", fontWeight: 800, color, lineHeight: 1.2 }}>
        {value}
      </span>
    </div>
  );
}

interface WinProps {
  moves: number;
  elapsed: number;
  bestMoves: number;
  hardMode: boolean;
  onRestart: () => void;
  onToggleHard: () => void;
}

function WinScreen({ moves, elapsed, bestMoves, hardMode, onRestart, onToggleHard }: WinProps) {
  const isNewBest = bestMoves === moves;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(160deg, #0f0f1e 0%, #1a1a2e 100%)",
          border: "2px solid #39ff1488",
          borderRadius: "1.25rem",
          padding: "2rem 2.5rem",
          textAlign: "center",
          maxWidth: "22rem",
          width: "90vw",
          boxShadow: "0 0 40px 8px #39ff1422",
        }}
      >
        {/* Title */}
        <div style={{ fontSize: "3rem", marginBottom: "0.25rem" }}>🏆</div>
        <h2
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "2rem",
            fontWeight: 800,
            color: "#39ff14",
            margin: "0 0 0.25rem",
            textShadow: "0 0 18px #39ff14aa",
          }}
        >
          You Won!
        </h2>
        {isNewBest && (
          <p style={{ color: "#ffd700", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            ⭐ New Best Score!
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "1rem 0" }}>
          <div>
            <div style={{ fontSize: "0.65rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Moves</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#00e5ff" }}>{moves}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Time</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#bf5fff" }}>{formatTime(elapsed)}</div>
          </div>
          {bestMoves > 0 && (
            <div>
              <div style={{ fontSize: "0.65rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Best</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffd700" }}>{bestMoves}</div>
            </div>
          )}
        </div>

        {/* Mode badge */}
        <div style={{ marginBottom: "1.25rem" }}>
          <span style={{
            display: "inline-block",
            padding: "0.2rem 0.7rem",
            borderRadius: "999px",
            background: hardMode ? "#ff2d7822" : "#2563eb22",
            border: `1.5px solid ${hardMode ? "#ff2d78" : "#2563eb"}`,
            color: hardMode ? "#ff2d78" : "#60a5fa",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}>
            {hardMode ? "⚡ HARD MODE 6×6" : "EASY MODE 4×4"}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <button
            onClick={onRestart}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "linear-gradient(135deg, #39ff14, #00e5ff)",
              color: "#0f0f1e",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              letterSpacing: "0.04em",
              boxShadow: "0 0 16px #39ff1466",
            }}
          >
            ↺ Play Again
          </button>
          <button
            onClick={onToggleHard}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "0.75rem",
              border: `2px solid ${hardMode ? "#2563eb" : "#ff2d78"}`,
              background: "transparent",
              color: hardMode ? "#60a5fa" : "#ff2d78",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {hardMode ? "Try Easy Mode 4×4" : "Try Hard Mode 6×6 ⚡"}
          </button>
        </div>
      </div>
    </div>
  );
}

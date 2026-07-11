import type { TileState } from "../types";

interface Props {
  tile: TileState;
  onClick: (id: number) => void;
  size: string;
}

export function MemoryTile({ tile, onClick, size }: Props) {
  const { flipped, matched, symbol, color } = tile;
  const revealed = flipped || matched;

  // Glow only on matched tiles
  const glowStyle = matched
    ? {
        boxShadow: `0 0 10px 3px ${color}88, 0 0 22px 6px ${color}44`,
      }
    : {};

  return (
    <div
      aria-label={revealed ? symbol : "Hidden tile"}
      role="button"
      tabIndex={0}
      onClick={() => onClick(tile.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(tile.id); }}
      style={{
        width: size,
        height: size,
        perspective: "600px",
        cursor: matched ? "default" : "pointer",
        outline: "none",
      }}
    >
      {/* Card flip container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Back face ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: "0.6rem",
            background: "linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)",
            border: "2px solid #3a3a5e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "calc(min(3.5vmin, 1.6rem))",
            transition: "border-color 200ms",
          }}
        >
          <span style={{ opacity: 0.5, color: "#7b7baa" }}>✦</span>
        </div>

        {/* ── Front face ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "0.6rem",
            background: matched
              ? `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`
              : "linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)",
            border: `2px solid ${matched ? color : "#5a5a8e"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "calc(min(5vmin, 2.2rem))",
            ...glowStyle,
            transition: "box-shadow 400ms ease, border-color 400ms ease, background 400ms ease",
          }}
        >
          {symbol}
        </div>
      </div>
    </div>
  );
}

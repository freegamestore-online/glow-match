export interface TileState {
  id: number;        // unique index in the grid
  symbol: string;    // emoji / icon
  color: string;     // neon accent colour
  flipped: boolean;  // currently face-up
  matched: boolean;  // permanently matched
}

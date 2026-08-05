/** デザイン側の accentColor prop 相当。切り替える場合はここを変更する */
export const ACCENT = "#4fc1ff";

/** デザイン側の cardLayout prop 相当 */
export const CARD_LAYOUT: "grid" | "list" = "grid";

const GRID_COLS_BY_LAYOUT = {
  grid: "repeat(auto-fill, minmax(340px, 1fr))",
  list: "1fr",
};

export const GRID_COLS = GRID_COLS_BY_LAYOUT[CARD_LAYOUT];

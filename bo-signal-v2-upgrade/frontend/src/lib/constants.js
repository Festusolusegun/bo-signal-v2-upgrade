export const API = "/api";
export const DEFAULT_SYMBOL = "BTC/USDT";
export const DEFAULT_PROVIDER = "yfinance";
export const REFRESH_INTERVAL = 30000;

export const REGIME_COLOR = {
  TRENDING: "text-call",
  RANGING: "text-phosphor",
  VOLATILE: "text-orange-400",
  DEAD: "text-idle",
};

export const REC_COLOR = {
  CALL: "text-call",
  PUT: "text-put",
  "NO TRADE": "text-idle",
};

export const REGIME_WEIGHTS = {
  TRENDING: { ai: 0.35, structure: 0.3, momentum: 0.12, mtf: 0.15, liquidity: 0.08 },
  RANGING: { ai: 0.4, structure: 0.15, momentum: 0.2, mtf: 0.1, liquidity: 0.15 },
  VOLATILE: { ai: 0.5, structure: 0.15, momentum: 0.1, mtf: 0.15, liquidity: 0.1 },
  DEAD: { ai: 0.5, structure: 0.1, momentum: 0.15, mtf: 0.1, liquidity: 0.15 },
};

export const DEFAULT_WEIGHTS = { ai: 0.4, structure: 0.2, momentum: 0.15, mtf: 0.15, liquidity: 0.1 };

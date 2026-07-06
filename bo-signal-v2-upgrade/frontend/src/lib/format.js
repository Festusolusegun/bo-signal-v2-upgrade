export const fmt = (v, d = 2) => (v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(d));

export const pct = (v) => (v == null ? "—" : `${fmt(v * 100, 1)}%`);

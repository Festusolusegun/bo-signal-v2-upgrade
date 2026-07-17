# Signal Engine — Frontend v2.1

## What changed from your upload

**Fixed the config filenames** — this is very likely what caused your blank page. Your uploaded files were named `vite_config.js`, `tailwind_config.cjs`, `postcss_config.cjs`, `_env` (underscores). Vite and PostCSS only auto-discover these by their exact conventional names with dots: `vite.config.js`, `tailwind.config.cjs`, `postcss.config.cjs`, `.env`. This project has them named correctly.

**Redesigned the UI** around the actual concept of a "signal engine":

- A hand-built analog **signal gauge** (`src/components/SignalGauge.jsx`) — a semicircular meter with tick marks and a needle that sweeps to the blended probability, replacing the plain confidence progress bar. It pings once on every fresh signal, like a radar contact.
- A phosphor/amber instrument-panel palette (`void` / `panel` / `phosphor` / `call` / `put` / `idle`) instead of generic dark-mode-plus-neon-green, defined as real Tailwind color tokens in `tailwind.config.cjs`.
- Monospace (`IBM Plex Mono`) for all numeric readouts, `Space Grotesk` for labels — a data-terminal feel that separates "things you read" from "things you scan."
- Metric tiles, probability bars, and vote rows pulled into small reusable components (`src/components/Readouts.jsx`) instead of being copy-pasted inline in `App.jsx`.
- `MetricPill.jsx` / `SignalCard.jsx` from your upload weren't wired into `App.jsx` and used a different data shape than your real API response, so they were retired in favor of components that match your actual `/api/signal` payload.

The API contract is untouched — same `/api/signal` and `/api/backtest` fields, same Vite proxy to `localhost:8080`.

## Run it

```bash
npm install
npm run dev
```

Your backend should be running on port 8080 (per `vite.config.js`'s proxy target) for live data to load.

import { useState, useEffect, useCallback, useRef } from "react";
import SignalGauge from "./components/SignalGauge";
import { Readout, ChannelBar, VoteLine } from "./components/Readouts";
import { fmt } from "./lib/format";
import AlertSystem from "./components/AlertSystem";
import {
  API,
  DEFAULT_SYMBOL,
  DEFAULT_PROVIDER,
  REFRESH_INTERVAL,
  REGIME_COLOR,
  REC_COLOR,
  REGIME_WEIGHTS,
  DEFAULT_WEIGHTS,
} from "./lib/constants";

export default function App() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [signal, setSignal] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [btLoading, setBtLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [ticking, setTicking] = useState(false);
  const tickTimeout = useRef(null);

  const fetchSignal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/signal?symbol=${encodeURIComponent(symbol)}&provider=${provider}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Signal fetch failed");
      }
      const data = await res.json();
      setSignal(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setTicking(true);
      clearTimeout(tickTimeout.current);
      tickTimeout.current = setTimeout(() => setTicking(false), 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, provider]);

  const fetchBacktest = useCallback(async () => {
    setBtLoading(true);
    try {
      const res = await fetch(
        `${API}/backtest?symbol=${encodeURIComponent(symbol)}&provider=${provider}&interval=5m&lookback=1000`
      );
      if (!res.ok) return;
      const data = await res.json();
      setBacktest(data);
    } catch (_) {
      // backtest is opportunistic — signal panel stays authoritative on failure
    } finally {
      setBtLoading(false);
    }
  }, [symbol, provider]);

  useEffect(() => {
    fetchSignal();
    const id = setInterval(fetchSignal, REFRESH_INTERVAL);
    return () => {
      clearInterval(id);
      clearTimeout(tickTimeout.current);
    };
  }, [fetchSignal]);

  const rec = signal?.recommendation;
  const exp = signal?.explanation;
  const regime = signal?.regime_detail;
  const compProbs = signal?.component_probs;
  const weights = REGIME_WEIGHTS[signal?.regime] || DEFAULT_WEIGHTS;

  const gaugeValue =
    signal?.blended_prob != null
      ? signal.blended_prob * 100
      : rec === "CALL"
      ? 50 + (signal?.confidence ?? 0) / 2
      : rec === "PUT"
      ? 50 - (signal?.confidence ?? 0) / 2
      : 50;

  return (
    <div className="min-h-screen bg-void px-4 py-6 font-display text-primary sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full bg-phosphor ${loading ? "pulse-dot" : ""}`} />
            <div>
              <h1 className="font-data text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Signal Engine <span className="text-idle">v3.0</span>
              </h1>
              <p className="text-xs text-muted">Probabilistic ensemble · Smart money · Multi-timeframe</p>
            </div>
          </div>
          {lastUpdate && (
            <span className="font-data text-[11px] text-idle">Updated {lastUpdate}</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <input
            className="w-40 rounded-lg border border-hairline bg-panel px-3 py-2 font-data text-sm text-primary focus:border-phosphor focus:outline-none"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Symbol"
          />
          <select
            className="rounded-lg border border-hairline bg-panel px-3 py-2 font-data text-sm text-primary focus:border-phosphor focus:outline-none"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="yfinance">yfinance</option>
            <option value="bybit">Bybit</option>
          </select>
          <button
            onClick={fetchSignal}
            disabled={loading}
            className="rounded-lg bg-phosphor px-4 py-2 font-data text-sm font-semibold text-void transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh signal"}
          </button>
          <button
            onClick={fetchBacktest}
            disabled={btLoading}
            className="rounded-lg border border-hairline bg-panel px-4 py-2 font-data text-sm text-primary transition hover:border-phosphor/50 disabled:opacity-50"
          >
            {btLoading ? "Running…" : "Run backtest"}
          </button>
        </div>

        <AlertSystem signal={signal} enabled={true} />

        {error && (
          <div className="rounded-lg border border-put/30 bg-put/10 px-3 py-2 font-data text-sm text-put">
            {error}
          </div>
        )}

        {signal && (
          <>
            {/* Hero: gauge + recommendation */}
            <div className="scanlines rounded-2xl border border-hairline bg-panel p-6 sm:p-8">
              <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_1fr] md:items-center">
                <SignalGauge value={gaugeValue} recommendation={rec} ticking={ticking} />

                <div className="space-y-3">
                  <div className="font-data text-[11px] uppercase tracking-[0.3em] text-muted">
                    {signal.asset} · Expiry {signal.expiry}
                  </div>
                  <div className={`text-5xl font-bold tracking-tight sm:text-6xl ${REC_COLOR[rec] || "text-primary"}`}>
                    {rec}
                  </div>

                  <div className="flex flex-wrap items-end gap-6">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-muted">Confidence</div>
                      <div className="font-data text-2xl font-semibold text-primary">{fmt(signal.confidence, 1)}%</div>
                    </div>
                    {signal.blended_prob != null && (
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-muted">P(bull)</div>
                        <div className="font-data text-2xl font-semibold text-primary">
                          {fmt(signal.blended_prob * 100, 1)}%
                        </div>
                      </div>
                    )}
                    {rec !== "NO TRADE" && signal.stars && (
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-muted">Stars</div>
                        <div className="text-lg text-phosphor">{signal.stars}</div>
                      </div>
                    )}
                  </div>

                  {signal.reason && (
                    <div className="rounded-lg border border-put/30 bg-put/10 px-3 py-2 font-data text-xs text-put">
                      {signal.reason}
                    </div>
                  )}
                  {exp?.summary && (
                    <div className="border-t border-hairline pt-3 text-sm text-muted">{exp.summary}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Instrument grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Readout label="Regime" value={signal.regime} tone={REGIME_COLOR[signal.regime]} />
              <Readout
                label="Trend"
                value={signal.trend}
                tone={signal.trend === "bullish" ? "text-call" : signal.trend === "bearish" ? "text-put" : "text-idle"}
              />
              <Readout
                label="BOS"
                value={signal.bos}
                tone={signal.bos === "bullish" ? "text-call" : signal.bos === "bearish" ? "text-put" : "text-idle"}
              />
              <Readout
                label="MTF bias"
                value={signal.mtf_bias}
                tone={
                  signal.mtf_bias === "bullish" ? "text-call" : signal.mtf_bias === "bearish" ? "text-put" : "text-idle"
                }
              />
              <Readout label="RSI divergence" value={signal.rsi_divergence?.replace("_", " ")} />
              <Readout label="Liquidity sweep" value={signal.liquidity_sweep} />
              <Readout
                label="FVG"
                value={signal.fvg_present ? "Present" : "None"}
                tone={signal.fvg_present ? "text-call" : "text-idle"}
              />
              <Readout
                label="Trend matrix"
                value={`${signal.trend_matrix?.total ?? "—"}/100`}
                tone={
                  signal.trend_matrix?.total > 60
                    ? "text-call"
                    : signal.trend_matrix?.total < 40
                    ? "text-put"
                    : "text-phosphor"
                }
              />
            </div>

            {/* Component probability mixer */}
            {compProbs && (
              <div className="rounded-xl border border-hairline bg-panel p-4">
                <h2 className="mb-3 font-data text-sm font-semibold uppercase tracking-widest text-muted">
                  Component channels
                  <span className="ml-2 text-[11px] font-normal normal-case text-idle">
                    P(bullish) · bar = distance from neutral · right column = regime weight
                  </span>
                </h2>
                <div className="space-y-2">
                  <ChannelBar label="AI ensemble" value={compProbs.ai} weight={weights.ai} />
                  <ChannelBar label="Structure" value={compProbs.structure} weight={weights.structure} />
                  <ChannelBar label="Momentum" value={compProbs.momentum} weight={weights.momentum} />
                  <ChannelBar label="MTF" value={compProbs.mtf} weight={weights.mtf} />
                  <ChannelBar label="Liquidity" value={compProbs.liquidity} weight={weights.liquidity} />
                </div>
                {signal.blended_prob != null && (
                  <div className="mt-3 flex justify-between border-t border-hairline pt-3 font-data text-xs text-muted">
                    <span>Blended P(bull)</span>
                    <span className={`font-bold ${signal.blended_prob > 0.5 ? "text-call" : "text-put"}`}>
                      {fmt(signal.blended_prob * 100, 1)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Regime detail */}
            {regime && (
              <div className="rounded-xl border border-hairline bg-panel p-4">
                <h2 className="mb-2 font-data text-sm font-semibold uppercase tracking-widest text-muted">
                  Market regime
                </h2>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-xs text-idle">Regime </span>
                    <span className={`font-bold ${REGIME_COLOR[regime.regime]}`}>{regime.regime}</span>
                  </div>
                  <div>
                    <span className="text-xs text-idle">ADX </span>
                    <span className="font-data text-primary">{fmt(regime.adx)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-idle">ATR pct </span>
                    <span className="font-data text-primary">{fmt(regime.atr_pct)}th</span>
                  </div>
                  <div>
                    <span className="text-xs text-idle">Trade OK </span>
                    <span className={regime.trade_ok ? "text-call" : "text-put"}>{regime.trade_ok ? "Yes" : "No"}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">{regime.description}</p>
              </div>
            )}

            {/* Confidence breakdown */}
            {exp?.confidence_breakdown && (
              <div className="rounded-xl border border-hairline bg-panel p-4">
                <h2 className="mb-3 font-data text-sm font-semibold uppercase tracking-widest text-muted">
                  Confidence breakdown
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {Object.entries(exp.confidence_breakdown).map(([k, v]) => (
                    <Readout key={k} label={k.replace("_", " ")} value={`${fmt(v, 1)}%`} />
                  ))}
                </div>
              </div>
            )}

            {/* Votes */}
            {exp?.votes?.length > 0 && (
              <div className="rounded-xl border border-hairline bg-panel p-4">
                <h2 className="mb-3 font-data text-sm font-semibold uppercase tracking-widest text-muted">
                  Signal votes
                </h2>
                <div>
                  {exp.votes.map((v, i) => (
                    <VoteLine key={i} vote={v} />
                  ))}
                </div>
                {exp.reasons_for?.length > 0 && (
                  <div className="mt-3 border-t border-hairline pt-3">
                    <div className="mb-1 text-xs text-idle">Supporting</div>
                    <div className="space-y-0.5">
                      {exp.reasons_for.map((r, i) => (
                        <div key={i} className="text-xs text-call">
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {exp.reasons_against?.length > 0 && (
                  <div className="mt-2">
                    <div className="mb-1 text-xs text-idle">Caveats</div>
                    <div className="space-y-0.5">
                      {exp.reasons_against.map((r, i) => (
                        <div key={i} className="text-xs text-orange-400">
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI probability + trend matrix */}
            <div className="flex items-center justify-between rounded-xl border border-hairline bg-panel p-4">
              <div>
                <div className="mb-1 text-xs text-idle">AI probability (raw)</div>
                <div className="font-data text-2xl font-bold text-primary">{fmt(signal.ai_probability, 1)}%</div>
                {signal.ai_probability > 72 && (
                  <div className="mt-1 text-xs text-phosphor">⚠ Heuristic mode — capped at 72% (no trained model)</div>
                )}
              </div>
              <div className="text-right">
                <div className="mb-1 text-xs text-idle">Trend matrix</div>
                <div
                  className="font-data text-2xl font-bold"
                  style={{
                    color:
                      signal.trend_matrix?.total > 60 ? "#37d67a" : signal.trend_matrix?.total < 40 ? "#ff5d5d" : "#ffb238",
                  }}
                >
                  {signal.trend_matrix?.total}/100
                </div>
                <div className="text-xs text-idle">{signal.trend_matrix?.direction}</div>
              </div>
            </div>
          </>
        )}

        {/* Backtest */}
        <div className="rounded-xl border border-hairline bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-data text-sm font-semibold uppercase tracking-widest text-muted">
              Backtest results <span className="font-normal normal-case text-idle">(5m · 1000 bars)</span>
            </h2>
            {btLoading && <span className="pulse-dot font-data text-xs text-phosphor">Running…</span>}
          </div>

          {backtest ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Readout label="Trades" value={backtest.metrics?.total_trades ?? "—"} />
                <Readout
                  label="Win rate"
                  value={backtest.metrics?.win_rate != null ? `${(backtest.metrics.win_rate * 100).toFixed(1)}%` : "—"}
                  tone={backtest.metrics?.win_rate > 0.55 ? "text-call" : "text-put"}
                />
                <Readout
                  label="Total PnL"
                  value={backtest.metrics?.total_pnl != null ? fmt(backtest.metrics.total_pnl) : "—"}
                  tone={backtest.metrics?.total_pnl > 0 ? "text-call" : "text-put"}
                />
                <Readout
                  label="Profit factor"
                  value={backtest.metrics?.profit_factor === Infinity ? "∞" : fmt(backtest.metrics?.profit_factor)}
                />
                <Readout label="Sharpe" value={fmt(backtest.metrics?.sharpe)} />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Readout label="Max drawdown" value={fmt(backtest.metrics?.max_drawdown)} tone="text-put" />
                <Readout
                  label="Expectancy"
                  value={fmt(backtest.metrics?.expectancy)}
                  tone={backtest.metrics?.expectancy > 0 ? "text-call" : "text-put"}
                />
                <Readout label="Max losing streak" value={backtest.metrics?.max_losing_streak ?? "—"} tone="text-orange-400" />
                <Readout label="Calmar" value={fmt(backtest.metrics?.calmar)} />
              </div>

              {backtest.session_metrics && Object.keys(backtest.session_metrics).length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-xs text-idle">Per-session win rate</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(backtest.session_metrics).map(([sess, m]) => (
                      <div key={sess} className="rounded-lg border border-hairline bg-panel-raised p-2 text-center">
                        <div className="text-xs text-idle">{sess}</div>
                        <div className={`font-data text-sm font-bold ${m.win_rate > 0.55 ? "text-call" : "text-put"}`}>
                          {m.win_rate != null ? `${(m.win_rate * 100).toFixed(0)}%` : "—"}
                        </div>
                        <div className="text-xs text-idle">{m.total_trades} trades</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {backtest.trades_preview?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full font-data text-xs text-muted">
                    <thead>
                      <tr className="border-b border-hairline text-idle">
                        <th className="py-1 pr-3 text-left">Time</th>
                        <th className="py-1 pr-3 text-left">Signal</th>
                        <th className="py-1 pr-3 text-right">Entry</th>
                        <th className="py-1 pr-3 text-right">Exit</th>
                        <th className="py-1 pr-3 text-right">Conf</th>
                        <th className="py-1 text-right">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtest.trades_preview.map((t, i) => (
                        <tr key={i} className="border-b border-hairline/50">
                          <td className="py-1 pr-3 text-idle">{String(t.timestamp).slice(0, 16)}</td>
                          <td className={`py-1 pr-3 font-semibold ${t.signal === "CALL" ? "text-call" : "text-put"}`}>
                            {t.signal}
                          </td>
                          <td className="py-1 pr-3 text-right">{fmt(t.entry, 0)}</td>
                          <td className="py-1 pr-3 text-right">{fmt(t.exit, 0)}</td>
                          <td className="py-1 pr-3 text-right">{fmt(t.confidence, 0)}%</td>
                          <td className={`py-1 text-right font-bold ${t.pnl > 0 ? "text-call" : "text-put"}`}>
                            {t.pnl > 0 ? "+" : ""}
                            {fmt(t.pnl)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-idle">
              {btLoading ? "Running backtest on 1000 bars… this takes 2–3 minutes" : 'Click "Run backtest" to evaluate historical performance'}
            </div>
          )}
        </div>

        <div className="pb-4 text-center font-data text-[11px] text-idle">
          Research platform only · Not financial advice · Validate before live trading
        </div>
      </div>
    </div>
  );
}
export function Readout({ label, value, tone = "text-primary" }) {
  return (
    <div className="scanlines rounded-lg border border-hairline bg-panel px-3 py-2.5">
      <div className="font-data text-[10px] uppercase tracking-widest text-idle">{label}</div>
      <div className={`mt-1 truncate font-data text-sm font-semibold ${tone}`}>{value ?? "—"}</div>
    </div>
  );
}

export function ChannelBar({ label, value, weight }) {
  const pctVal = value != null ? Math.round(value * 100) : null;
  const bullish = pctVal != null && pctVal > 52;
  const bearish = pctVal != null && pctVal < 48;
  const color = bullish ? "bg-call" : bearish ? "bg-put" : "bg-phosphor";
  const barWidth = pctVal != null ? Math.abs(pctVal - 50) * 2 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 font-data text-[11px] uppercase tracking-wide text-idle">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-panel-raised">
        <div className="absolute left-1/2 top-0 h-2 w-px bg-hairline" />
        <div
          className={`absolute top-0 h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${barWidth}%`, left: bullish ? "50%" : `${50 - barWidth}%` }}
        />
      </div>
      <span
        className={`w-11 shrink-0 text-right font-data text-xs ${
          bullish ? "text-call" : bearish ? "text-put" : "text-phosphor"
        }`}
      >
        {pctVal != null ? `${pctVal}%` : "—"}
      </span>
      <span className="w-9 shrink-0 text-right font-data text-[10px] text-idle">
        {weight != null ? `${Math.round(weight * 100)}%` : ""}
      </span>
    </div>
  );
}

export function VoteLine({ vote }) {
  const stars = "●".repeat(vote.stars) + "○".repeat(5 - vote.stars);
  return (
    <div className="flex items-center gap-3 border-b border-hairline py-1.5 last:border-0">
      <span className={`h-2 w-2 shrink-0 rounded-full ${vote.aligned ? "bg-call" : "bg-put"}`} />
      <span className="w-32 shrink-0 truncate text-xs text-muted">{vote.component}</span>
      <span className="flex-1 truncate font-data text-xs text-idle">{vote.signal}</span>
      <span className="font-data text-xs tracking-tighter text-phosphor">{stars}</span>
    </div>
  );
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const TONE = {
  CALL: "#37d67a",
  PUT: "#ff5d5d",
};
const IDLE_TONE = "#ffb238";

/**
 * Analog VU-meter style gauge. `value` is 0-100 on a PUT(0) — NEUTRAL(50) — CALL(100)
 * scale. The needle sweeps to position on update; `ticking` triggers a one-shot
 * radar-ping ring, used right after a fresh signal lands.
 */
export default function SignalGauge({ value, recommendation, ticking }) {
  const v = clamp(value ?? 50, 0, 100);
  const angle = (v - 50) * 1.8; // -90deg .. 90deg
  const color = TONE[recommendation] || IDLE_TONE;

  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[300px]" role="img" aria-label={`Signal gauge at ${Math.round(v)} percent`}>
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5d5d" />
            <stop offset="50%" stopColor="#3a4250" />
            <stop offset="100%" stopColor="#37d67a" />
          </linearGradient>
        </defs>

        <path
          d="M20,100 A80,80 0 0 1 180,100"
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.55"
        />

        {ticks.map((t) => {
          const major = t % 25 === 0;
          const a = ((t - 50) * 1.8 - 90) * (Math.PI / 180);
          const r1 = major ? 68 : 73;
          const r2 = 80;
          return (
            <line
              key={t}
              x1={100 + r1 * Math.cos(a)}
              y1={100 + r1 * Math.sin(a)}
              x2={100 + r2 * Math.cos(a)}
              y2={100 + r2 * Math.sin(a)}
              stroke={major ? "rgba(245,243,238,0.55)" : "rgba(245,243,238,0.2)"}
              strokeWidth={major ? 1.6 : 1}
            />
          );
        })}

        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 900ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <line x1="100" y1="100" x2="100" y2="32" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill={color} />
        </g>
        <circle cx="100" cy="100" r="2.5" fill="#05070a" />

        {ticking && (
          <circle cx="100" cy="100" r="10" fill="none" stroke={color} strokeWidth="1.5" className="ping-ring" />
        )}
      </svg>

      <div className="-mt-2 flex w-full max-w-[300px] justify-between px-1 font-data text-[10px] uppercase tracking-widest text-idle">
        <span>Put</span>
        <span>Neutral</span>
        <span>Call</span>
      </div>
    </div>
  );
}

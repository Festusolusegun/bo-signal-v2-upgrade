import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_MIN_CONFIDENCE = 62;
const MAX_HISTORY = 10;

function playChime(type = "CALL") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === "CALL" ? [523, 659, 784] : [784, 659, 523];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.32);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.35);
    });
  } catch (_) {}
}

function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") Notification.requestPermission();
}

function sendBrowserNotification(signal) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const icon = signal.recommendation === "CALL" ? "📈" : "📉";
  new Notification(`${icon} ${signal.recommendation} — ${signal.asset}`, {
    body: `Confidence: ${signal.confidence?.toFixed(1)}% · Expiry: ${signal.expiry} · Regime: ${signal.regime}`,
    tag: "bo-signal",
    renotify: true,
  });
}

export default function AlertSystem({ signal, enabled = true }) {
  const [minConfidence, setMinConfidence] = useState(DEFAULT_MIN_CONFIDENCE);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const lastSignalKey = useRef(null);
  const bannerTimeout = useRef(null);

  const isActionable = useCallback(
    (sig) =>
      sig &&
      sig.recommendation !== "NO TRADE" &&
      sig.recommendation !== undefined &&
      sig.confidence >= minConfidence,
    [minConfidence]
  );

  const signalKey = signal
    ? `${signal.recommendation}-${signal.confidence}-${signal.asset}`
    : null;

  useEffect(() => {
    if (!enabled || !signal || !isActionable(signal)) return;
    if (signalKey === lastSignalKey.current) return;
    lastSignalKey.current = signalKey;

    // Sound
    if (soundEnabled) playChime(signal.recommendation);

    // Browser notification
    if (notifEnabled) sendBrowserNotification(signal);

    // Banner
    const entry = {
      ...signal,
      alertedAt: new Date().toLocaleTimeString(),
      id: Date.now(),
    };
    setActiveBanner(entry);
    clearTimeout(bannerTimeout.current);
    bannerTimeout.current = setTimeout(() => setActiveBanner(null), 12000);

    // History
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }, [signalKey, signal, enabled, soundEnabled, notifEnabled, isActionable]);

  useEffect(() => () => clearTimeout(bannerTimeout.current), []);

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const isCall = (rec) => rec === "CALL";
  const recColor = (rec) => (isCall(rec) ? "#37d67a" : "#ff5d5d");
  const recBg = (rec) => (isCall(rec) ? "rgba(55,214,122,0.08)" : "rgba(255,93,93,0.08)");
  const recBorder = (rec) => (isCall(rec) ? "rgba(55,214,122,0.35)" : "rgba(255,93,93,0.35)");

  return (
    <>
      {/* ── Alert banner ── */}
      {activeBanner && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            minWidth: 280,
            maxWidth: 340,
            background: recBg(activeBanner.recommendation),
            border: `1.5px solid ${recBorder(activeBanner.recommendation)}`,
            borderRadius: 14,
            padding: "14px 18px",
            boxShadow: `0 4px 32px ${recBorder(activeBanner.recommendation)}`,
            backdropFilter: "blur(12px)",
            animation: "slideIn 0.25s ease",
          }}
        >
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(40px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#888", marginBottom: 4, textTransform: "uppercase" }}>
                Signal Alert · {activeBanner.alertedAt}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: recColor(activeBanner.recommendation), lineHeight: 1 }}>
                {activeBanner.recommendation === "CALL" ? "📈" : "📉"} {activeBanner.recommendation}
              </div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                <span style={{ color: "#ddd" }}>{activeBanner.asset}</span>
                {" · "}Confidence{" "}
                <span style={{ color: recColor(activeBanner.recommendation), fontWeight: 700 }}>
                  {activeBanner.confidence?.toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                Expiry {activeBanner.expiry} · Regime {activeBanner.regime}
              </div>
              {activeBanner.stars && (
                <div style={{ fontSize: 13, color: "#ffb238", marginTop: 4 }}>{activeBanner.stars}</div>
              )}
            </div>
            <button
              onClick={() => setActiveBanner(null)}
              style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18, padding: 0, marginLeft: 8 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Alert controls bar ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "10px 16px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Status pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: enabled ? "#37d67a" : "#555",
              boxShadow: enabled ? "0 0 6px #37d67a" : "none",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888" }}>
            Alerts {enabled ? "active" : "off"} · min {minConfidence}%
          </span>
        </div>

        {/* History button */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: showHistory ? "rgba(255,255,255,0.08)" : "transparent",
              color: "#aaa", cursor: "pointer",
            }}
          >
            History ({history.length})
          </button>
        )}

        {/* Test button */}
        <button
          onClick={() => soundEnabled && playChime("CALL")}
          style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "#aaa", cursor: "pointer",
          }}
          title="Test chime"
        >
          🔔 Test
        </button>

        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings((v) => !v)}
          style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            background: showSettings ? "rgba(255,255,255,0.08)" : "transparent",
            color: "#aaa", cursor: "pointer",
          }}
        >
          ⚙ Settings
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {/* Confidence threshold */}
          <div>
            <label style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 8 }}>
              Min confidence: <span style={{ color: "#ddd" }}>{minConfidence}%</span>
            </label>
            <input
              type="range" min={55} max={85} step={1}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#37d67a" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginTop: 2 }}>
              <span>55% (more alerts)</span><span>85% (fewer)</span>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle label="🔊 Sound alerts" value={soundEnabled} onChange={setSoundEnabled} />
            <Toggle label="🔔 Browser notifications" value={notifEnabled} onChange={setNotifEnabled} />
            {notifEnabled && notifPermission !== "granted" && (
              <button
                onClick={handleRequestPermission}
                style={{
                  fontSize: 11, padding: "6px 12px", borderRadius: 6,
                  border: "1px solid rgba(255,178,56,0.4)",
                  background: "rgba(255,178,56,0.08)", color: "#ffb238", cursor: "pointer",
                }}
              >
                {notifPermission === "denied"
                  ? "⚠ Notifications blocked in browser"
                  : "Enable browser notifications →"}
              </button>
            )}
            {notifPermission === "granted" && (
              <span style={{ fontSize: 11, color: "#37d67a" }}>✓ Browser notifications enabled</span>
            )}
          </div>
        </div>
      )}

      {/* ── Alert history ── */}
      {showHistory && history.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
            Alert history
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "7px 10px", borderRadius: 8,
                  background: recBg(h.recommendation),
                  border: `1px solid ${recBorder(h.recommendation)}`,
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 800, color: recColor(h.recommendation), minWidth: 50 }}>
                  {h.recommendation}
                </span>
                <span style={{ color: "#aaa" }}>{h.asset}</span>
                <span style={{ color: recColor(h.recommendation), fontWeight: 600 }}>
                  {h.confidence?.toFixed(1)}%
                </span>
                <span style={{ color: "#555", fontSize: 11, marginLeft: "auto" }}>{h.alertedAt}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setHistory([]); setShowHistory(false); }}
            style={{
              marginTop: 10, fontSize: 11, padding: "4px 10px",
              borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: "#666", cursor: "pointer",
            }}
          >
            Clear history
          </button>
        </div>
      )}
    </>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#aaa" }}>{label}</span>
      <button
        onClick={() => onChange((v) => !v)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: value ? "#37d67a" : "#333",
          border: "none", cursor: "pointer", position: "relative",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute", top: 3,
            left: value ? 21 : 3,
            width: 16, height: 16, borderRadius: "50%",
            background: "#fff", transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";

// The full price curve the chart will draw through (YES price, 0-1)
// Story: flat at 0.50 → agent enters at 0.51 → small dip → price-to-beat appears →
// BTC crosses target → YES surges to 0.72 → agent exits → slight drift after
const CURVE: number[] = [
  // Ticks 0-14: market open, flat near 0.50
  0.50, 0.50, 0.50, 0.505, 0.50, 0.495, 0.50, 0.50, 0.505, 0.50,
  0.50, 0.495, 0.50, 0.505, 0.50,
  // Ticks 15-24: agent enters at ~0.51, slight noise
  0.51, 0.51, 0.515, 0.51, 0.505, 0.51, 0.515, 0.52, 0.515, 0.52,
  // Ticks 25-34: price-to-beat appears, BTC starts moving, odds climb
  0.53, 0.54, 0.55, 0.57, 0.58, 0.60, 0.62, 0.64, 0.66, 0.68,
  // Ticks 35-44: surge completes, agent exits at 0.72, drift after
  0.70, 0.71, 0.72, 0.72, 0.73, 0.72, 0.71, 0.72, 0.73, 0.72,
];

const ENTRY_TICK = 15;
const PRICE_TICK = 25;
const EXIT_TICK = 37;
const TICK_MS = 120;

interface LogEntry {
  text: string;
  type: "info" | "action" | "profit";
}

// Events keyed by tick number
const EVENTS: Record<number, LogEntry> = {
  0: { text: "Connecting to Polymarket...", type: "info" },
  3: { text: "BTC daily market found. Odds: 50/50", type: "info" },
  8: { text: "Price to beat: NOT SET. Scanning...", type: "info" },
  [ENTRY_TICK]: { text: "Buying YES @ $0.51", type: "action" },
  [ENTRY_TICK + 2]: { text: "Position open. 100 shares YES.", type: "info" },
  [PRICE_TICK]: { text: "Price to beat set: $104,500", type: "action" },
  [PRICE_TICK + 2]: { text: "BTC @ $104,350 — below target. Holding.", type: "info" },
  [PRICE_TICK + 5]: { text: "BTC rising... $104,480", type: "info" },
  [PRICE_TICK + 7]: { text: "BTC breaks $104,500! Odds surging.", type: "action" },
  34: { text: "YES @ $0.68. Unrealized: +$0.17", type: "profit" },
  [EXIT_TICK - 1]: { text: "Target reached. Closing position.", type: "action" },
  [EXIT_TICK]: { text: "Sold YES @ $0.72. Profit: +$0.21/share", type: "profit" },
  [EXIT_TICK + 2]: { text: "Trade complete. Funds secured.", type: "profit" },
};

export default function StrategyDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const animRef = useRef<number>(0);
  const tickRef = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(-1);
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: "Awaiting authorization...", type: "info" },
  ]);
  const [finished, setFinished] = useState(false);

  const currentPrice = tick >= 0 && tick < CURVE.length ? CURVE[tick] : 0.5;
  const entered = tick >= ENTRY_TICK;
  const exited = tick >= EXIT_TICK;
  const priceSet = tick >= PRICE_TICK;


  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas || !container || !ctx) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: rect.width, h: rect.height };
    }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    function render() {
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const currentTick = tickRef.current;
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // 50% baseline
      const pad = 16;
      const drawH = h - pad * 2;
      const minP = 0.40;
      const maxP = 0.80;
      const range = maxP - minP;

      const baseY = pad + drawH * (1 - (0.5 - minP) / range);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(w, baseY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("$0.50", 4, baseY - 4);

      if (currentTick < 0) {
        // Not started yet — draw flat line at 0.50
        const y = pad + drawH * (1 - (0.50 - minP) / range);
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = "rgba(0, 255, 148, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.setLineDash([]);
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const visibleTicks = Math.min(currentTick + 1, CURVE.length);
      const stepX = w / (CURVE.length - 1);

      // Fill area under curve
      const grad = ctx.createLinearGradient(0, pad, 0, h);
      grad.addColorStop(0, "rgba(0, 255, 148, 0.15)");
      grad.addColorStop(1, "rgba(0, 255, 148, 0)");

      ctx.beginPath();
      for (let i = 0; i < visibleTicks; i++) {
        const x = i * stepX;
        const y = pad + drawH * (1 - (CURVE[i] - minP) / range);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Save path end for line stroke, then close for fill
      const lastX = (visibleTicks - 1) * stepX;
      const lastY = pad + drawH * (1 - (CURVE[visibleTicks - 1] - minP) / range);
      ctx.lineTo(lastX, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = grad;
      ctx.fill();

      // Redraw curve line on top
      ctx.beginPath();
      for (let i = 0; i < visibleTicks; i++) {
        const x = i * stepX;
        const y = pad + drawH * (1 - (CURVE[i] - minP) / range);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#00FF94";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Head dot
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 148, 0.2)";
      ctx.fill();

      // Price label at head
      const priceLbl = "$" + CURVE[Math.min(currentTick, CURVE.length - 1)].toFixed(2);
      ctx.fillStyle = "#00FF94";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.fillText(priceLbl, lastX + 14, lastY + 4);

      // Entry marker
      if (currentTick >= ENTRY_TICK) {
        const ex = ENTRY_TICK * stepX;
        const ey = pad + drawH * (1 - (CURVE[ENTRY_TICK] - minP) / range);
        // Vertical dashed line
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ex, 0);
        ctx.lineTo(ex, h);
        ctx.stroke();
        ctx.setLineDash([]);
        // Triangle up
        ctx.fillStyle = "#3B82F6";
        ctx.beginPath();
        ctx.moveTo(ex, ey - 12);
        ctx.lineTo(ex - 6, ey - 4);
        ctx.lineTo(ex + 6, ey - 4);
        ctx.closePath();
        ctx.fill();
        // Label
        ctx.fillStyle = "#3B82F6";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText("BUY $0.51", ex + 8, ey - 8);
      }

      // Exit marker
      if (currentTick >= EXIT_TICK) {
        const ex2 = EXIT_TICK * stepX;
        const ey2 = pad + drawH * (1 - (CURVE[EXIT_TICK] - minP) / range);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(0, 255, 148, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ex2, 0);
        ctx.lineTo(ex2, h);
        ctx.stroke();
        ctx.setLineDash([]);
        // Triangle down
        ctx.fillStyle = "#00FF94";
        ctx.beginPath();
        ctx.moveTo(ex2, ey2 + 12);
        ctx.lineTo(ex2 - 6, ey2 + 4);
        ctx.lineTo(ex2 + 6, ey2 + 4);
        ctx.closePath();
        ctx.fill();
        // Label
        ctx.fillStyle = "#00FF94";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText("SELL $0.72", ex2 + 8, ey2 + 16);
      }

      // Profit band between entry and exit
      if (currentTick >= EXIT_TICK) {
        const x1 = ENTRY_TICK * stepX;
        const x2 = EXIT_TICK * stepX;
        ctx.fillStyle = "rgba(0, 255, 148, 0.04)";
        ctx.fillRect(x1, 0, x2 - x1, h);
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  function start() {
    if (running) return;
    if (finished) {
      // Reset
      setFinished(false);
      setTick(-1);
      tickRef.current = -1;
      setLogs([{ text: "Awaiting authorization...", type: "info" }]);
      return;
    }

    setRunning(true);
    setTick(0);
    tickRef.current = 0;
    setLogs([{ text: "Agent authorized. Starting scan...", type: "action" }]);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= CURVE.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setFinished(true);
        return;
      }
      tickRef.current = step;
      setTick(step);

      const event = EVENTS[step];
      if (event) {
        // Use functional update since addLog is stable
        setLogs((prev) => [event, ...prev].slice(0, 10));
      }
    }, TICK_MS);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const unrealized = entered && !exited
    ? ((currentPrice - 0.51) * 100).toFixed(0)
    : null;

  return (
    <div
      style={{
        background: "#080808",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "#0A0A0A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className="mono"
            style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em" }}
          >
            POLYMARKET
          </span>
          <span style={{
            width: 1, height: 14, background: "rgba(255,255,255,0.1)",
          }} />
          <span className="mono" style={{ fontSize: 11, color: "#888" }}>
            BTC_DAILY_CLOSE
          </span>
          {running && (
            <span className="mono" style={{
              fontSize: 9, color: "#00FF94", fontWeight: 700,
              border: "1px solid rgba(0,255,148,0.3)", padding: "1px 6px",
              borderRadius: 3,
            }}>
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={start}
          style={{
            padding: "8px 22px",
            fontSize: 12,
            fontWeight: 400,
            fontFamily: "var(--font-display)",
            border: finished
              ? "1px solid rgba(255,255,255,0.1)"
              : running
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,255,148,0.15)",
            borderRadius: 10,
            cursor: running ? "not-allowed" : "pointer",
            background: finished
              ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
              : running
              ? "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)"
              : "linear-gradient(135deg, rgba(0,255,148,0.1) 0%, rgba(0,255,148,0.03) 100%)",
            color: finished ? "#888" : running ? "#444" : "#00FF94",
            transition: "all 0.25s ease",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: running
              ? "none"
              : "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.3)",
          }}
          disabled={running}
        >
          {finished ? "Replay" : running ? "Running..." : "Run Strategy"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px" }}>
        {/* Left: Chart + market info */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Market question */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              Will BTC close above{" "}
              <span className="mono" style={{ color: priceSet ? "#fff" : "#333" }}>
                {priceSet ? "$104,500" : "???"}
              </span>
              {" "}today?
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="mono" style={{
                  fontSize: 12, fontWeight: 700, color: "#00FF94",
                  background: "rgba(0,255,148,0.08)", padding: "2px 8px",
                  borderRadius: 3,
                }}>
                  YES ${currentPrice.toFixed(2)}
                </span>
                <span className="mono" style={{
                  fontSize: 12, fontWeight: 700, color: "#FF3333",
                  background: "rgba(255,51,51,0.08)", padding: "2px 8px",
                  borderRadius: 3,
                }}>
                  NO ${(1 - currentPrice).toFixed(2)}
                </span>
              </div>
              {entered && !exited && unrealized !== null && (
                <span className="mono" style={{
                  fontSize: 11, color: Number(unrealized) >= 0 ? "#00FF94" : "#FF3333",
                }}>
                  P&L: {Number(unrealized) >= 0 ? "+" : ""}{unrealized}%
                </span>
              )}
              {exited && (
                <span className="mono" style={{ fontSize: 11, color: "#00FF94", fontWeight: 700 }}>
                  CLOSED +$0.21
                </span>
              )}
            </div>
          </div>

          {/* Chart */}
          <div
            ref={containerRef}
            style={{ height: 260, position: "relative", overflow: "hidden" }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>

          {/* Odds bar */}
          <div style={{ padding: "0 20px 16px" }}>
            <div
              style={{
                display: "flex",
                height: 4,
                borderRadius: 2,
                overflow: "hidden",
                background: "#111",
              }}
            >
              <div
                style={{
                  width: `${currentPrice * 100}%`,
                  background: "#00FF94",
                  transition: "width 0.15s ease",
                  borderRadius: "2px 0 0 2px",
                }}
              />
              <div
                style={{
                  width: `${(1 - currentPrice) * 100}%`,
                  background: "#FF3333",
                  transition: "width 0.15s ease",
                  borderRadius: "0 2px 2px 0",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Agent console */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "#050505", minHeight: 340,
        }}>
          {/* Agent metrics */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 1, background: "rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {[
              { label: "SIDE", value: entered ? "YES" : "—", color: entered ? "#00FF94" : "#333" },
              { label: "ENTRY", value: entered ? "$0.51" : "—", color: entered ? "#fff" : "#333" },
              { label: "EXIT", value: exited ? "$0.72" : "—", color: exited ? "#fff" : "#333" },
              { label: "PROFIT", value: exited ? "+$0.21" : "—", color: exited ? "#00FF94" : "#333" },
            ].map((m) => (
              <div key={m.label} style={{
                background: "#050505", padding: "12px 14px", textAlign: "center",
              }}>
                <div className="mono" style={{
                  fontSize: 9, color: "#555", letterSpacing: "0.08em", marginBottom: 3,
                }}>
                  {m.label}
                </div>
                <div className="mono" style={{
                  fontSize: 15, fontWeight: 600, color: m.color,
                  transition: "color 0.3s ease",
                }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Log entries */}
          <div style={{
            flex: 1, padding: "12px 14px", overflow: "hidden",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div className="mono" style={{
              fontSize: 9, color: "#444", letterSpacing: "0.1em", marginBottom: 4,
            }}>
              AGENT LOG
            </div>
            {logs.map((log, i) => (
              <div
                key={i}
                className="mono"
                style={{
                  fontSize: 10,
                  color: log.type === "profit" ? "#00FF94"
                    : log.type === "action" ? "#3B82F6"
                    : "#666",
                  paddingLeft: 10,
                  borderLeft: `2px solid ${
                    log.type === "profit" ? "rgba(0,255,148,0.3)"
                    : log.type === "action" ? "rgba(59,130,246,0.3)"
                    : "rgba(255,255,255,0.06)"
                  }`,
                  lineHeight: 1.4,
                  opacity: i === 0 ? 1 : 0.7 - i * 0.06,
                }}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

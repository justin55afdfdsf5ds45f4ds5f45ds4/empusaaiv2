"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export default function LiveDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<number[]>(new Array(100).fill(0.5));
  const tickRef = useRef(0);
  const phaseRef = useRef<"IDLE" | "SCAN" | "PUMP">("IDLE");
  const animFrameRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [running, setRunning] = useState(false);
  const [balance, setBalance] = useState("$1.00");
  const [pnl, setPnl] = useState("+0.00%");
  const [logs, setLogs] = useState<string[]>([
    "Awaiting User Authorization...",
    "System Initialized.",
  ]);
  const [btnText, setBtnText] = useState("AUTHORIZE $1.00 AGENT");
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [finished, setFinished] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 8));
  }, []);

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
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    }

    resize();

    // Use ResizeObserver for reliable sizing
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    function render() {
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      tickRef.current++;
      const tick = tickRef.current;
      const points = pointsRef.current;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += 50) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Data simulation
      points.shift();
      const last = points[points.length - 1];
      let next = last;

      if (phase === "IDLE") {
        next =
          0.5 +
          Math.sin(tick * 0.05) * 0.08 +
          (Math.random() - 0.5) * 0.02;
      } else if (phase === "SCAN") {
        next = last + (Math.random() - 0.5) * 0.08;
      } else if (phase === "PUMP") {
        next = last + Math.random() * 0.025;
        if (next > 0.85) next = 0.85;
      }

      if (next < 0.15) next = 0.15;
      if (next > 0.9) next = 0.9;
      points.push(next);

      // Map data [0..1] into vertical drawing range with padding
      const padTop = 20;
      const padBot = 20;
      const drawH = h - padTop - padBot;

      // Chart line
      ctx.beginPath();
      const stepX = w / (points.length - 1);

      const grad = ctx.createLinearGradient(0, padTop, 0, h);
      grad.addColorStop(0, "rgba(0, 255, 148, 0.25)");
      grad.addColorStop(1, "rgba(0, 255, 148, 0)");

      for (let i = 0; i < points.length; i++) {
        const x = i * stepX;
        const y = padTop + drawH * (1 - points[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00FF94";
      ctx.stroke();

      // Fill under line
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = grad;
      ctx.fill();

      // Head dot
      const headX = (points.length - 1) * stepX;
      const headY = padTop + drawH * (1 - points[points.length - 1]);

      ctx.beginPath();
      ctx.arc(headX, headY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      // Glow ring
      ctx.beginPath();
      ctx.arc(headX, headY, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 148, 0.25)";
      ctx.fill();

      // Horizontal price line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(0, 255, 148, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headY);
      ctx.lineTo(w, headY);
      ctx.stroke();
      ctx.setLineDash([]);

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  function handleStart() {
    if (running) return;

    if (finished) {
      alert("Withdrawal simulated.");
      return;
    }

    setRunning(true);
    setBtnDisabled(true);
    setBtnText("AGENT RUNNING...");

    phaseRef.current = "SCAN";
    addLog("Connecting to Polygon RPC...");

    setTimeout(() => addLog("Scanning BTC_DAILY_VOL orderbook..."), 800);
    setTimeout(() => addLog("Liquidity Gap Found. Entering..."), 2000);

    setTimeout(() => {
      phaseRef.current = "PUMP";
      addLog("Position Open. Tracking volatility...");

      let bal = 1.0;
      const profitInterval = setInterval(() => {
        bal += 0.03;
        const p = ((bal - 1.0) * 100).toFixed(2);
        setBalance("$" + bal.toFixed(2));
        setPnl("+" + p + "%");

        if (bal >= 1.56) {
          clearInterval(profitInterval);
          phaseRef.current = "IDLE";

          addLog("Target Hit. Closing Position.");
          setTimeout(() => {
            addLog("Profit Secured in Vault.");
            setBtnText("WITHDRAW $1.64");
            setBtnDisabled(false);
            setFinished(true);
          }, 1000);
        }
      }, 200);
    }, 3500);
  }

  return (
    <div className="dashboard-wrapper" id="demo">
      <div className="dashboard">
        <div className="dash-header">
          <div className="dash-title mono">
            <span style={{ color: "#fff" }}>EMPUSA_TERMINAL</span>
            {" // LIVE_NET"}
          </div>
          <div className="dash-live mono">CONNECTED</div>
        </div>

        <div className="dash-grid">
          {/* Chart */}
          <div className="dash-main">
            <div className="metrics-row">
              <div className="metric">
                <h4 className="mono">VAULT BALANCE</h4>
                <div className="val mono">{balance}</div>
              </div>
              <div className="metric">
                <h4 className="mono">UNREALIZED PNL</h4>
                <div className="val green mono">{pnl}</div>
              </div>
              <div className="metric">
                <h4 className="mono">TARGET</h4>
                <div
                  className="val mono"
                  style={{
                    fontSize: "20px",
                    marginTop: "8px",
                    color: "var(--text-gray)",
                  }}
                >
                  BTC_VOL_24H
                </div>
              </div>
            </div>

            <div className="chart-container" ref={containerRef}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="dash-sidebar">
            <div className="log-panel">
              {logs.map((log, i) => (
                <div key={i} className="log-entry">
                  <span>&gt;</span> {log}
                </div>
              ))}
            </div>
            <div className="control-panel">
              <button
                className="action-btn"
                onClick={handleStart}
                disabled={btnDisabled}
                style={
                  finished
                    ? { background: "#fff", color: "#000", boxShadow: "none" }
                    : btnDisabled
                    ? { background: "#222", color: "#fff", boxShadow: "none" }
                    : undefined
                }
              >
                {btnText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

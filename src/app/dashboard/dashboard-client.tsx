"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, AgentAction, Deposit, Withdrawal } from "@/lib/types";
import DepositModal from "./deposit-modal";
import WithdrawModal from "./withdraw-modal";

interface DashboardClientProps {
  user: User;
  profile: Profile | null;
  agentActions: AgentAction[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
}

/* ─── Bot idle messages ─── */
const SCAN_MESSAGES = [
  "Scanning 47 active prediction markets...",
  "Analyzing BTC daily volatility spread",
  "Monitoring order book depth on Polymarket",
  "Evaluating YES/NO price divergence",
  "Checking liquidity pool conditions",
  "No edge detected — holding position",
  "Recalculating optimal entry size",
  "Watching for price movement signals",
  "Comparing historical spread patterns",
  "Running volatility capture model v2.4",
  "BTC prediction market: spread within normal range",
  "Polling real-time price feeds...",
];

export default function DashboardClient({
  user,
  profile,
  agentActions,
  deposits,
  withdrawals,
}: DashboardClientProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [botLogs, setBotLogs] = useState<
    Array<{ time: string; msg: string; type: "scan" | "info" | "trade" | "warn" }>
  >([]);
  const [showAccount, setShowAccount] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const balance = profile?.balance ?? 0;
  const activeAction = agentActions.find((a) => a.status === "active");
  const closedActions = agentActions.filter((a) => a.status === "closed");
  const totalPL = closedActions.reduce(
    (sum, a) => sum + Number(a.profit_loss ?? 0),
    0
  );
  const todayPL = closedActions
    .filter((a) => a.closed_at?.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((sum, a) => sum + Number(a.profit_loss ?? 0), 0);
  const wins = closedActions.filter((a) => Number(a.profit_loss ?? 0) > 0).length;
  const winRate = closedActions.length > 0 ? (wins / closedActions.length) * 100 : 0;

  /* ─── Theme ─── */
  useEffect(() => {
    const saved = localStorage.getItem("empusa-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("empusa-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }, [theme]);

  /* ─── Bot log simulation ─── */
  useEffect(() => {
    const now = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

    if (balance <= 0) {
      setBotLogs([
        { time: now(), msg: "Agent inactive — deposit to activate", type: "warn" },
      ]);
      return;
    }

    // Initial batch
    const initial = Array.from({ length: 5 }, (_, i) => ({
      time: now(),
      msg: SCAN_MESSAGES[i % SCAN_MESSAGES.length],
      type: "scan" as const,
    }));
    setBotLogs(initial);

    const interval = setInterval(() => {
      const msg = SCAN_MESSAGES[Math.floor(Math.random() * SCAN_MESSAGES.length)];
      setBotLogs((prev) =>
        [{ time: now(), msg, type: "scan" as const }, ...prev].slice(0, 30)
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [balance]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-void)" }}>
      {/* Aurora (dark mode only) */}
      {theme === "dark" && (
        <div className="aurora-bg">
          <div className="glow-spot glow-1" />
          <div className="glow-spot glow-2" />
        </div>
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <header className="db-header">
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64 }}
        >
          {/* Brand */}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text-white)",
              letterSpacing: "-0.02em",
            }}
          >
            EmpusaAI
          </span>

          {/* Center — Status */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className="animate-subtle-pulse"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: balance > 0 ? "var(--profit)" : "var(--text-gray)",
                boxShadow: balance > 0 ? "0 0 8px var(--profit)" : "none",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-code)",
                fontSize: 11,
                color: balance > 0 ? "var(--profit)" : "var(--text-gray)",
                letterSpacing: "0.05em",
              }}
            >
              {balance > 0 ? "AGENT ONLINE" : "AGENT IDLE"}
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="db-theme-btn" title="Toggle theme">
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Account */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowAccount(!showAccount)}
                className="flex items-center gap-2"
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text-gray)",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:inline" style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Account dropdown */}
              {showAccount && (
                <div
                  className="db-account-dropdown"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 260,
                    zIndex: 100,
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-white)", marginBottom: 4 }}>
                      {user.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-gray)", fontFamily: "var(--font-code)" }}>
                      Member since {memberSince}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 0",
                      borderTop: "1px solid var(--border)",
                      borderBottom: "1px solid var(--border)",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: "var(--text-gray)" }}>Tier</span>
                      <span className="db-badge db-badge-green">Standard</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: "var(--text-gray)" }}>Total Trades</span>
                      <span style={{ fontFamily: "var(--font-code)", color: "var(--text-white)" }}>
                        {closedActions.length}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-gray)" }}>User ID</span>
                      <span
                        style={{
                          fontFamily: "var(--font-code)",
                          fontSize: 10,
                          color: "var(--text-gray)",
                          maxWidth: 100,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      background: "transparent",
                      border: "none",
                      color: "var(--danger)",
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "var(--font-main)",
                      textAlign: "left",
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close account dropdown */}
      {showAccount && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
          onClick={() => setShowAccount(false)}
        />
      )}

      {/* ═══════════ MAIN ═══════════ */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* ─── Stats Row ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div className="db-stat-card db-card-balance">
            <div
              style={{
                fontSize: 11,
                color: "var(--text-gray)",
                fontFamily: "var(--font-code)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 8,
              }}
            >
              Vault Balance
            </div>
            <div
              className={balance > 0 ? "db-glow-green" : ""}
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "var(--font-code)",
                letterSpacing: "-1px",
                color: "var(--text-white)",
              }}
            >
              ${Number(balance).toFixed(2)}
            </div>
          </div>

          <div className="db-stat-card">
            <div
              style={{
                fontSize: 11,
                color: "var(--text-gray)",
                fontFamily: "var(--font-code)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 8,
              }}
            >
              Today P/L
            </div>
            <div
              className={todayPL >= 0 ? "db-glow-green" : "db-glow-red"}
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "var(--font-code)",
                letterSpacing: "-1px",
                color: todayPL >= 0 ? "var(--profit)" : "var(--danger)",
              }}
            >
              {todayPL >= 0 ? "+" : ""}${todayPL.toFixed(2)}
            </div>
          </div>

          <div className="db-stat-card">
            <div
              style={{
                fontSize: 11,
                color: "var(--text-gray)",
                fontFamily: "var(--font-code)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 8,
              }}
            >
              All-time Return
            </div>
            <div
              className={totalPL >= 0 ? "db-glow-green" : "db-glow-red"}
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "var(--font-code)",
                letterSpacing: "-1px",
                color: totalPL >= 0 ? "var(--profit)" : "var(--danger)",
              }}
            >
              {totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)}
            </div>
          </div>

          <div className="db-stat-card">
            <div
              style={{
                fontSize: 11,
                color: "var(--text-gray)",
                fontFamily: "var(--font-code)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 8,
              }}
            >
              Win Rate
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "var(--font-code)",
                letterSpacing: "-1px",
                color: "var(--text-white)",
              }}
            >
              {winRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setShowDeposit(true)} className="db-btn-primary">
            Deposit
          </button>
          <button onClick={() => setShowWithdraw(true)} className="db-btn-outline">
            Withdraw
          </button>
        </div>

        {/* ─── Two Column: Terminal + Active Position ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Agent Terminal */}
          <div className="db-panel db-panel-terminal">
            <div className="db-panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-code)",
                    color: "var(--text-gray)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Agent Terminal
                </span>
              </div>
              <span className={`db-badge ${balance > 0 ? "db-badge-green" : "db-badge-gray"}`}>
                {balance > 0 ? "LIVE" : "OFFLINE"}
              </span>
            </div>
            <div className="db-terminal">
              {botLogs.map((log, i) => (
                <div key={i} className="db-log-entry" style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--text-gray)", opacity: 0.5, flexShrink: 0 }}>
                    {log.time}
                  </span>
                  <span
                    style={{
                      color:
                        log.type === "warn"
                          ? "#FFC107"
                          : log.type === "trade"
                          ? "var(--profit)"
                          : "var(--text-gray)",
                    }}
                  >
                    {log.type === "warn" ? "! " : log.type === "trade" ? "> " : "  "}
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Position */}
          <div className={`db-panel ${activeAction ? "db-panel-active" : ""}`}>
            <div className="db-panel-header">
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-code)",
                  color: "var(--text-gray)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Active Position
              </span>
              {activeAction && (
                <span className="db-badge db-badge-blue">OPEN</span>
              )}
            </div>
            <div style={{ padding: 20 }}>
              {activeAction ? (
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--text-white)",
                      marginBottom: 16,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {activeAction.market_name}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-gray)",
                          fontFamily: "var(--font-code)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 4,
                        }}
                      >
                        Side
                      </div>
                      <span
                        className={`db-badge ${
                          activeAction.side === "YES" ? "db-badge-green" : "db-badge-red"
                        }`}
                      >
                        {activeAction.side}
                      </span>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-gray)",
                          fontFamily: "var(--font-code)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 4,
                        }}
                      >
                        Amount
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontFamily: "var(--font-code)",
                          color: "var(--text-white)",
                        }}
                      >
                        ${Number(activeAction.amount).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-gray)",
                          fontFamily: "var(--font-code)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 4,
                        }}
                      >
                        Entry
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontFamily: "var(--font-code)",
                          color: "var(--text-white)",
                        }}
                      >
                        ${Number(activeAction.entry_price).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-gray)",
                          fontFamily: "var(--font-code)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 4,
                        }}
                      >
                        Current
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontFamily: "var(--font-code)",
                          color: "var(--text-white)",
                        }}
                      >
                        {activeAction.current_price
                          ? `$${Number(activeAction.current_price).toFixed(2)}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                  {activeAction.current_price && (
                    <div
                      style={{
                        marginTop: 20,
                        padding: "12px 16px",
                        borderRadius: 8,
                        background: "var(--glass)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-gray)",
                          fontFamily: "var(--font-code)",
                          textTransform: "uppercase",
                        }}
                      >
                        Unrealized P/L
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          fontFamily: "var(--font-code)",
                          color:
                            Number(activeAction.current_price) >=
                            Number(activeAction.entry_price)
                              ? "var(--profit)"
                              : "var(--danger)",
                        }}
                      >
                        {Number(activeAction.current_price) >=
                        Number(activeAction.entry_price)
                          ? "+"
                          : ""}
                        $
                        {(
                          (Number(activeAction.current_price) -
                            Number(activeAction.entry_price)) *
                          Number(activeAction.amount)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 240,
                    textAlign: "center",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--border)", marginBottom: 16 }}
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                  <div style={{ fontSize: 14, color: "var(--text-gray)", marginBottom: 4 }}>
                    No active position
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-gray)", opacity: 0.6 }}>
                    {balance > 0
                      ? "Agent is scanning for the next opportunity"
                      : "Deposit to activate your agent"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Trade History ─── */}
        <div className="db-panel" style={{ marginBottom: 24 }}>
          <div className="db-panel-header">
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-code)",
                color: "var(--text-gray)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Trade History
            </span>
            <span style={{ fontSize: 12, color: "var(--text-gray)" }}>
              {closedActions.length} trades
            </span>
          </div>
          {closedActions.length > 0 ? (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Amount</th>
                  <th>P/L</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {closedActions.slice(0, 20).map((action) => (
                  <tr key={action.id}>
                    <td style={{ fontWeight: 500, color: "var(--text-white)" }}>
                      {action.market_name}
                    </td>
                    <td>
                      <span
                        className={`db-badge ${
                          action.side === "YES" ? "db-badge-green" : "db-badge-red"
                        }`}
                      >
                        {action.side}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-code)" }}>
                      ${Number(action.entry_price).toFixed(2)}
                    </td>
                    <td style={{ fontFamily: "var(--font-code)" }}>
                      ${Number(action.exit_price ?? 0).toFixed(2)}
                    </td>
                    <td style={{ fontFamily: "var(--font-code)" }}>
                      ${Number(action.amount).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-code)",
                        fontWeight: 500,
                        color:
                          Number(action.profit_loss ?? 0) >= 0
                            ? "var(--profit)"
                            : "var(--danger)",
                      }}
                    >
                      {Number(action.profit_loss ?? 0) >= 0 ? "+" : ""}$
                      {Number(action.profit_loss ?? 0).toFixed(2)}
                    </td>
                    <td style={{ color: "var(--text-gray)", fontSize: 12 }}>
                      {fmtDate(action.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "var(--text-gray)",
                fontSize: 13,
              }}
            >
              No completed trades yet. Your agent will enter when conditions are right.
            </div>
          )}
        </div>

        {/* ─── Transactions (Deposits + Withdrawals) ─── */}
        <div className="db-panel" style={{ marginBottom: 24 }}>
          <div className="db-panel-header">
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-code)",
                color: "var(--text-gray)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Transactions
            </span>
          </div>
          {deposits.length + withdrawals.length > 0 ? (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...deposits.map((d) => ({
                    type: "Deposit" as const,
                    amount: d.amount,
                    status: d.status,
                    date: d.created_at,
                    id: d.id,
                  })),
                  ...withdrawals.map((w) => ({
                    type: "Withdrawal" as const,
                    amount: w.amount,
                    status: w.status,
                    date: w.created_at,
                    id: w.id,
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 15)
                  .map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span
                          className={`db-badge ${
                            tx.type === "Deposit" ? "db-badge-green" : "db-badge-blue"
                          }`}
                        >
                          {tx.type === "Deposit" ? "+" : "-"} {tx.type}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-code)", fontWeight: 500 }}>
                        ${Number(tx.amount).toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={`db-badge ${
                            tx.status === "confirmed" || tx.status === "completed"
                              ? "db-badge-green"
                              : tx.status === "pending" || tx.status === "processing"
                              ? "db-badge-yellow"
                              : "db-badge-red"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-gray)", fontSize: 12 }}>
                        {fmtDate(tx.date)} {fmtTime(tx.date)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "var(--text-gray)",
                fontSize: 13,
              }}
            >
              No transactions yet. Deposit USDC to get started.
            </div>
          )}
        </div>

        {/* ─── Trust Bar ─── */}
        <div className="db-trust-bar" style={{ marginBottom: 32 }}>
          <div className="db-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--profit)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: "var(--font-code)", color: "var(--text-gray)", letterSpacing: "0.5px" }}>
              256-BIT ENCRYPTED
            </span>
          </div>
          <div className="db-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--active)" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: "var(--font-code)", color: "var(--text-gray)", letterSpacing: "0.5px" }}>
              SECURE RPC
            </span>
          </div>
          <div className="db-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--profit)" }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: "var(--font-code)", color: "var(--text-gray)", letterSpacing: "0.5px" }}>
              99.9% UPTIME
            </span>
          </div>
          <div className="db-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--active)" }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: "var(--font-code)", color: "var(--text-gray)", letterSpacing: "0.5px" }}>
              POLYGON USDC
            </span>
          </div>
        </div>
      </main>

      {/* ═══════════ MODALS ═══════════ */}
      {showDeposit && (
        <DepositModal
          userId={user.id}
          onClose={() => {
            setShowDeposit(false);
            router.refresh();
          }}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          userId={user.id}
          balance={balance}
          onClose={() => {
            setShowWithdraw(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

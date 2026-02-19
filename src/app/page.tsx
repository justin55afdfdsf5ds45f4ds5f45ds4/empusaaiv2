import Link from "next/link";
import LiveDemo from "./live-demo";
import StrategyDemo from "./strategy-demo";
import ScrollReveal from "./scroll-reveal";
import AnimatedCounter from "./animated-counter";

function TickerContent() {
  const items = [
    { pair: "BTC_DAILY_104500", pnl: "+$0.42" },
    { pair: "BTC_DAILY_105000", pnl: "+$0.31" },
    { pair: "BTC_DAILY_103800", pnl: "+$0.67" },
    { pair: "BTC_DAILY_106200", pnl: "+$0.19" },
    { pair: "BTC_DAILY_104100", pnl: "+$0.55" },
    { pair: "BTC_DAILY_105500", pnl: "+$0.38" },
    { pair: "BTC_DAILY_103200", pnl: "+$0.72" },
    { pair: "BTC_DAILY_107000", pnl: "+$0.44" },
  ];

  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="ticker-item">
          {item.pair} <span className="ticker-green">{item.pnl}</span>
        </div>
      ))}
    </>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="glow-spot glow-1" />
        <div className="glow-spot glow-2" />
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-content">
          <Link href="/" className="brand">
            EmpusaAI
          </Link>
          <div className="nav-right">
            <a href="#strategy" className="nav-link-desktop">
              Strategy
            </a>
            <a href="#how" className="nav-link-desktop">
              Methodology
            </a>
            <a href="#safety" className="nav-link-desktop">
              Safety
            </a>
            <Link href="/signup" className="nav-cta">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* ============ HERO ============ */}
        <section className="hero">
          <div className="status-badge">
            <div className="status-dot" />
            <span className="status-text mono">SYSTEM ONLINE // V2.4</span>
          </div>
          <h1>
            Stop betting.
            <br />
            Start scalping.
          </h1>
          <p>
            We don&apos;t predict the price. We predict the volatility. Our
            agent scalps the liquidity gap on prediction markets 24/7. $1
            minimum.
          </p>

          <LiveDemo />
        </section>
      </div>

      {/* ============ LIVE TICKER ============ */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          <TickerContent />
          <TickerContent />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* ============ STATS ============ */}
        <ScrollReveal>
          <div className="stats-grid">
            <div className="stat-cell">
              <div className="stat-val">
                <AnimatedCounter end={12847} />
              </div>
              <div className="stat-label">Trades Executed</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">
                <AnimatedCounter end={94.2} suffix="%" decimals={1} />
              </div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">
                <AnimatedCounter end={0.41} prefix="$" decimals={2} />
              </div>
              <div className="stat-label">Avg Profit / Trade</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">
                <AnimatedCounter end={99.9} suffix="%" decimals={1} />
              </div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </ScrollReveal>

        {/* ============ THE STRATEGY (Polymarket Demo) ============ */}
        <section className="content-block" id="strategy">
          <ScrollReveal>
            <div className="block-head">
              <span className="eyebrow">THE STRATEGY</span>
              <h2 className="headline">See the exact play. Step by step.</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <StrategyDemo />
          </ScrollReveal>
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                overflow: "hidden",
                marginTop: 24,
              }}
            >
              <div style={{ background: "#0A0A0A", padding: "24px 20px" }}>
                <div className="mono" style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 6 }}>
                  WHY IT WORKS
                </div>
                <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.5 }}>
                  Every day, Polymarket opens a new BTC price market. Before the
                  price to beat is set, odds sit near 50/50. Once the target
                  appears, the market always picks a direction.
                </div>
              </div>
              <div style={{ background: "#0A0A0A", padding: "24px 20px" }}>
                <div className="mono" style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 6 }}>
                  THE EDGE
                </div>
                <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.5 }}>
                  We enter before the move. When BTC moves even 0.5%, the
                  prediction market odds swing 15-30%. We sell the position
                  into that swing. We never wait for resolution.
                </div>
              </div>
              <div style={{ background: "#0A0A0A", padding: "24px 20px" }}>
                <div className="mono" style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 6 }}>
                  THE RISK
                </div>
                <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.5 }}>
                  If the market stays flat (no swing), the agent exits at
                  minimal loss. Stop-loss is 5%. In practice, flat days are
                  rare — BTC moves every single day.
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ============ THREE STEPS ============ */}
        <ScrollReveal>
          <section className="content-block">
            <div className="block-head">
              <span className="eyebrow">THE PROCESS</span>
              <h2 className="headline">Three steps. Zero effort.</h2>
            </div>
            <div className="steps-grid">
              <div className="step">
                <div className="step-num">01</div>
                <h3>Fund Your Vault</h3>
                <p>
                  Send as little as $1 USDC to your EmpusaAI vault. No minimum
                  lock-up. No subscription. You keep full custody via smart
                  contract allowance.
                </p>
              </div>
              <div className="step">
                <div className="step-num">02</div>
                <h3>Agent Deploys</h3>
                <p>
                  Our agent scans every Bitcoin prediction market on Polymarket.
                  It waits for near-50/50 odds, then enters a position designed
                  to profit from any directional move.
                </p>
              </div>
              <div className="step">
                <div className="step-num">03</div>
                <h3>Profit Captured</h3>
                <p>
                  When the spread shifts in our favor, the agent exits
                  automatically. Profit goes straight to your vault. Average
                  cycle: 2-6 hours. No overnight exposure.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ============ TRUST ROW ============ */}
        <div className="trust-row">
          <div className="logos">
            <span>POLYMARKET</span>
            <span>USDC</span>
            <span>ETHEREUM</span>
            <span>MONAD</span>
          </div>
        </div>

        {/* ============ THE MECHANICS ============ */}
        <section className="content-block" id="how">
          <ScrollReveal>
            <div className="block-head">
              <span className="eyebrow">THE MECHANICS</span>
              <h2 className="headline">
                Why trading manually is a loser&apos;s game.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid-3">
              <div className="card">
                <h3>Liquidity Weight</h3>
                <p>
                  You trade with $100. We trade with a pooled whale wallet. We
                  get better spreads, lower fees, and priority execution.
                </p>
                <div className="card-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
              <div className="card">
                <h3>Volatility Capture</h3>
                <p>
                  We don&apos;t bet on &ldquo;Up&rdquo; or &ldquo;Down&rdquo;.
                  We enter when the market is inefficient (50/50) and exit when
                  it picks a direction.
                </p>
                <div className="card-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
              </div>
              <div className="card">
                <h3>Zero Emotion</h3>
                <p>
                  Humans panic sell. The agent follows code. It executes trades
                  in milliseconds based on math, not feelings.
                </p>
                <div className="card-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ============ HUMAN VS MACHINE ============ */}
        <section className="content-block" id="compare">
          <ScrollReveal>
            <div className="block-head">
              <span className="eyebrow">PERFORMANCE</span>
              <h2 className="headline">Human vs. Machine</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="compare-grid">
              <div className="compare-col human">
                <h3 className="mono" style={{ color: "var(--danger)", marginBottom: 24 }}>
                  YOU
                </h3>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Sleeps 8 hours a day (misses volatility)
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Panic sells during 2% dips
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Pays full gas fees on every trade
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Takes 30 seconds to execute a trade
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Watches charts all day, still loses
                </div>
              </div>
              <div className="compare-col agent">
                <h3 className="mono" style={{ color: "var(--profit)", marginBottom: 24 }}>
                  EMPUSA AGENT
                </h3>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Monitors order book 24/7/365
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Executes instantly on spread variance
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Batches transactions (near-zero fees)
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Sub-200ms execution latency
                </div>
                <div className="list-item">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Never revenge trades, never tilts
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ============ PROTOCOL SAFETY ============ */}
        <section className="content-block" id="safety">
          <ScrollReveal>
            <div className="block-head">
              <span className="eyebrow">PROTOCOL</span>
              <h2 className="headline">Safety</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="faq-row">
              <div className="faq-q">Do you hold my private keys?</div>
              <div className="faq-a">
                Never. You simply approve a USDC allowance to our smart contract.
                You can revoke this permission at any time directly from your
                wallet.
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="faq-row">
              <div className="faq-q">Can I withdraw instantly?</div>
              <div className="faq-a">
                Yes. Because we trade high-volume liquidity pools on Polymarket,
                there is no lock-up period. Withdrawals execute in the next block.
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="faq-row">
              <div className="faq-q">What happens if the market crashes?</div>
              <div className="faq-a">
                Our strategy loves crashes. We trade volatility. Big moves (up or
                down) create the spread gaps where we make profit. We lose money
                on flat days, not crash days.
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="faq-row">
              <div className="faq-q">What are the fees?</div>
              <div className="faq-a">
                We take a 10% performance fee on profits only. If the agent
                doesn&apos;t make money, you don&apos;t pay. No management fees.
                No subscription. No hidden costs.
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="faq-row">
              <div className="faq-q">Is there a maximum deposit?</div>
              <div className="faq-a">
                During the beta period, vault capacity is capped at $10,000 per
                user. This ensures the agent can maintain optimal execution speed
                across all positions.
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="faq-row">
              <div className="faq-q">What if the agent makes a bad trade?</div>
              <div className="faq-a">
                Every position has an automatic stop-loss at 5% drawdown. The
                agent will never let a single trade wipe out more than a small
                fraction of your vault. Over hundreds of trades, the math wins.
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ============ CTA ============ */}
        <ScrollReveal>
          <section className="cta-box">
            <h2 style={{ fontSize: 64, marginBottom: 32, fontWeight: 700 }}>
              Show, don&apos;t tell.
            </h2>
            <p style={{ color: "var(--text-gray)", fontSize: 20, marginBottom: 40 }}>
              Put $1 in. See what happens. Withdraw it.
            </p>
            <Link href="/signup" className="cta-btn">
              Start With $1
            </Link>
          </section>
        </ScrollReveal>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div
          className="footer-flex"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}
        >
          <div>
            <div className="brand">EmpusaAI</div>
            <div style={{ marginTop: 16 }}>&copy; 2026 EMPUSA LABS</div>
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            <div>
              <div style={{ color: "#fff", marginBottom: 16, fontWeight: 600 }}>Product</div>
              <div style={{ marginBottom: 8 }}>
                <a href="#strategy" style={{ color: "var(--text-gray)", textDecoration: "none" }}>
                  Strategy
                </a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <a href="#how" style={{ color: "var(--text-gray)", textDecoration: "none" }}>
                  Methodology
                </a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <a href="#safety" style={{ color: "var(--text-gray)", textDecoration: "none" }}>
                  Safety
                </a>
              </div>
            </div>
            <div>
              <div style={{ color: "#fff", marginBottom: 16, fontWeight: 600 }}>Socials</div>
              <div style={{ marginBottom: 8 }}>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--text-gray)", textDecoration: "none" }}
                >
                  Twitter / X
                </a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <a href="#" style={{ color: "var(--text-gray)", textDecoration: "none" }}>
                  Discord
                </a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <a href="#" style={{ color: "var(--text-gray)", textDecoration: "none" }}>
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

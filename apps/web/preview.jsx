import { useState, useEffect, useRef } from "react";

// ─── Mock Data ────────────────────────────────────────────

const MOCK_RECEIPT = {
  receipt_id: "rcpt_wyuc8de1qj93",
  agent_id: "sentinel-007",
  owner: "github:marcovega",
  timestamp: "2026-02-21T14:32:18.944Z",
  server_received_at: "2026-02-21T14:32:19.102Z",
  action: { type: "tool_call", name: "slither_analysis", duration_ms: 4200 },
  model: { provider: "anthropic", name: "claude-sonnet-4-5", tokens_in: 2840, tokens_out: 5120 },
  cost: { amount_usd: 0.047, was_routed: false },
  hashes: {
    input: "fc5ff8db5d468f1062cb07e93e296a5c70bb45e6a03b6f0b0decaa842c404924",
    output: "27c8c0797f49035393fbcfab215d9dc74cd24202f81aa440b0de437a29052dc1",
  },
  signature: {
    algorithm: "ed25519",
    public_key: "VzqZUrs/ZPyw+lN7kR5M4rKQD+NeAczT8dEyws6QnxI=",
    valid: true,
  },
  context: { session: "sess_wcei4dpb", sequence: 3 },
};

const MOCK_TASK = {
  slug: "a3f8c2b1",
  name: "Smart Contract Audit — TokenVault.sol",
  agent: "sentinel-007",
  owner: "github:marcovega",
  status: "completed",
  started_at: "2026-02-21T14:28:00Z",
  completed_at: "2026-02-21T14:45:22Z",
  total_receipts: 8,
  total_duration_ms: 1042000,
  total_cost_usd: 0.284,
  total_tokens: 42680,
  receipts: [
    { seq: 0, type: "web_search", name: "etherscan_source_fetch", duration: 1800, model: "claude-sonnet-4-5", cost: 0.012, tokens: 2100, time: "14:28:04" },
    { seq: 1, type: "file_read", name: "TokenVault.sol", duration: 200, model: "claude-sonnet-4-5", cost: 0.003, tokens: 1800, time: "14:28:12" },
    { seq: 2, type: "tool_call", name: "slither_analysis", duration: 8400, model: "claude-sonnet-4-5", cost: 0.058, tokens: 8200, time: "14:29:01" },
    { seq: 3, type: "tool_call", name: "mythril_scan", duration: 12000, model: "claude-sonnet-4-5", cost: 0.072, tokens: 9400, time: "14:31:15" },
    { seq: 4, type: "model_call", name: "vulnerability_reasoning", duration: 6200, model: "claude-sonnet-4-5", cost: 0.045, tokens: 7800, time: "14:35:02" },
    { seq: 5, type: "web_search", name: "similar_exploit_search", duration: 2400, model: "claude-sonnet-4-5", cost: 0.018, tokens: 3200, time: "14:38:44" },
    { seq: 6, type: "model_call", name: "report_generation", duration: 5800, model: "claude-sonnet-4-5", cost: 0.052, tokens: 7100, time: "14:40:10" },
    { seq: 7, type: "file_write", name: "audit_report.md", duration: 400, model: "claude-sonnet-4-5", cost: 0.024, tokens: 3080, time: "14:44:58" },
  ],
};

// ─── Utility Components ───────────────────────────────────

const Hash = ({ value, short }) => {
  const display = short ? value.slice(0, 8) + "…" + value.slice(-6) : value;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "0.8em",
        color: "#8b949e",
        background: "rgba(255,255,255,0.04)",
        padding: "2px 6px",
        borderRadius: 4,
        wordBreak: "break-all",
        letterSpacing: "0.02em",
      }}
    >
      {display}
    </span>
  );
};

const Badge = ({ children, color = "#30d158", bg }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: color,
      background: bg || `${color}18`,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </span>
);

const ActionIcon = ({ type }) => {
  const icons = {
    tool_call: "⚙️",
    web_search: "🔍",
    file_write: "📝",
    file_read: "📄",
    model_call: "🧠",
    api_request: "🔗",
    skill_exec: "⚡",
    code_exec: "💻",
  };
  return <span style={{ fontSize: "1.1em" }}>{icons[type] || "📋"}</span>;
};

// ─── Page: Landing ────────────────────────────────────────

function LandingPage({ onNavigate }) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((v) => (v < 12 ? v + 1 : v));
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const terminalLines = [
    { text: "$ openclawscan init --agent sentinel-007", color: "#e6edf3" },
    { text: "✓ Ed25519 keypair generated", color: "#30d158" },
    { text: "✓ Agent registered: sentinel-007", color: "#30d158" },
    { text: "", color: "transparent" },
    { text: "$ agent start --task 'Audit TokenVault.sol'", color: "#e6edf3" },
    { text: "  ↳ rcpt_001 web_search     etherscan_source    1.8s  $0.012", color: "#8b949e" },
    { text: "  ↳ rcpt_002 file_read      TokenVault.sol      0.2s  $0.003", color: "#8b949e" },
    { text: "  ↳ rcpt_003 tool_call      slither_analysis    8.4s  $0.058", color: "#8b949e" },
    { text: "  ↳ rcpt_004 tool_call      mythril_scan       12.0s  $0.072", color: "#8b949e" },
    { text: "  ↳ rcpt_005 model_call     vuln_reasoning      6.2s  $0.045", color: "#30d158" },
    { text: "", color: "transparent" },
    { text: "✓ Task complete → openclawscan.xyz/task/a3f8c2b1", color: "#58a6ff" },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: "100px 0 60px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 20,
            background: "rgba(48, 209, 88, 0.1)",
            border: "1px solid rgba(48, 209, 88, 0.25)",
            fontSize: "0.82rem",
            color: "#30d158",
            fontWeight: 600,
            marginBottom: 28,
            letterSpacing: "0.04em",
          }}
        >
          OPEN SOURCE · MIT LICENSE
        </div>
        <h1
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: 1.08,
            color: "#e6edf3",
            margin: "0 0 20px",
            letterSpacing: "-0.03em",
          }}
        >
          Every agent action
          <br />
          <span style={{ color: "#30d158" }}>deserves a receipt.</span>
        </h1>
        <p
          style={{
            fontSize: "1.15rem",
            color: "#8b949e",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Cryptographically signed, tamper-proof receipts for every action your
          AI agent performs. Like Etherscan, but for agents.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onNavigate("task")}
            style={{
              padding: "14px 32px",
              borderRadius: 10,
              background: "#30d158",
              color: "#0d1117",
              fontSize: "1rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 8px 30px rgba(48,209,88,0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            See Live Demo →
          </button>
          <button
            style={{
              padding: "14px 32px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              color: "#e6edf3",
              fontSize: "1rem",
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
            }}
          >
            View on GitHub
          </button>
        </div>
      </section>

      {/* Terminal Demo */}
      <section style={{ maxWidth: 680, margin: "0 auto 80px", padding: "0 20px" }}>
        <div
          style={{
            background: "#161b22",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ marginLeft: 12, fontSize: "0.78rem", color: "#484f58" }}>terminal</span>
          </div>
          <div style={{ padding: "20px 20px 24px", minHeight: 280 }}>
            {terminalLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: "0.82rem",
                  lineHeight: 1.7,
                  color: line.color,
                  opacity: i < visibleLines ? 1 : 0,
                  transform: `translateY(${i < visibleLines ? 0 : 8}px)`,
                  transition: "opacity 0.3s, transform 0.3s",
                  whiteSpace: "pre",
                }}
              >
                {line.text || "\u00A0"}
              </div>
            ))}
            {visibleLines >= 12 && (
              <div
                style={{
                  width: 8,
                  height: 18,
                  background: "#30d158",
                  display: "inline-block",
                  animation: "blink 1s step-end infinite",
                  marginTop: 4,
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ maxWidth: 900, margin: "0 auto 100px", padding: "0 20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#e6edf3", textAlign: "center", marginBottom: 60, letterSpacing: "-0.02em" }}>
          How it works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[
            {
              num: "01",
              title: "Install SDK",
              desc: "npm install @openclawscan/sdk — 5 minutes. Your agent starts generating signed receipts for every action.",
              icon: "📦",
            },
            {
              num: "02",
              title: "Agent works",
              desc: "Every tool call, API request, file write is captured. Input/output hashed for privacy. Ed25519 signed.",
              icon: "⚡",
            },
            {
              num: "03",
              title: "Share the link",
              desc: "Task complete? Share openclawscan.xyz/task/xxx — your client sees exactly what happened. Verified.",
              icon: "🔗",
            },
          ].map((step) => (
            <div
              key={step.num}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "32px 28px",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "rgba(48,209,88,0.3)";
                e.currentTarget.style.background = "rgba(48,209,88,0.03)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>{step.icon}</div>
              <div style={{ fontSize: "0.75rem", color: "#30d158", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>
                STEP {step.num}
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#e6edf3", marginBottom: 10 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#8b949e", lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What's in a Receipt */}
      <section style={{ maxWidth: 700, margin: "0 auto 100px", padding: "0 20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#e6edf3", textAlign: "center", marginBottom: 16, letterSpacing: "-0.02em" }}>
          What's in a receipt
        </h2>
        <p style={{ textAlign: "center", color: "#8b949e", marginBottom: 40, fontSize: "1rem" }}>
          Everything you need to verify. Nothing you don't.
        </p>
        <div
          style={{
            background: "#161b22",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "28px",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "0.78rem",
            lineHeight: 1.8,
            color: "#8b949e",
          }}
        >
          <span style={{ color: "#484f58" }}>{"{"}</span><br />
          {"  "}<span style={{ color: "#ff7b72" }}>"action"</span>: <span style={{ color: "#a5d6ff" }}>"tool_call:slither_analysis"</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"model"</span>: <span style={{ color: "#a5d6ff" }}>"anthropic/claude-sonnet-4-5"</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"tokens"</span>: {"{ "}<span style={{ color: "#79c0ff" }}>in: 2840</span>, <span style={{ color: "#79c0ff" }}>out: 5120</span>{" }"},<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"cost"</span>: <span style={{ color: "#30d158" }}>$0.047</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"duration"</span>: <span style={{ color: "#79c0ff" }}>4.2s</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"input_hash"</span>: <span style={{ color: "#484f58" }}>"fc5ff8db…c404924"</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"output_hash"</span>: <span style={{ color: "#484f58" }}>"27c8c079…052dc1"</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"signature"</span>: <span style={{ color: "#30d158" }}>✓ Ed25519 verified</span>,<br />
          {"  "}<span style={{ color: "#ff7b72" }}>"sequence"</span>: <span style={{ color: "#79c0ff" }}>3</span> <span style={{ color: "#484f58" }}>// gap detection</span><br />
          <span style={{ color: "#484f58" }}>{"}"}</span>
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {["No raw data stored", "SHA-256 hashed", "Ed25519 signed", "Tamper-proof"].map((t) => (
            <span
              key={t}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color: "#8b949e",
                fontSize: "0.8rem",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 900, margin: "0 auto 100px", padding: "0 20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#e6edf3", textAlign: "center", marginBottom: 50, letterSpacing: "-0.02em" }}>
          Pricing
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { name: "Free", price: "€0", features: ["1 agent", "1,000 receipts/mo", "Public explorer", "Local backup"], cta: "Get Started" },
            { name: "Pro", price: "€4.99", features: ["Unlimited agents", "Unlimited receipts", "Task sharing", "Priority support"], cta: "Upgrade", highlight: true },
            { name: "API", price: "€19.99", features: ["Everything in Pro", "Marketplace integrations", "Webhook events", "SLA guarantee"], cta: "Contact Us" },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? "rgba(48,209,88,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.highlight ? "rgba(48,209,88,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 14,
                padding: "32px 28px",
                position: "relative",
              }}
            >
              {plan.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e6edf3", marginBottom: 8 }}>
                {plan.name}
              </h3>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#e6edf3", marginBottom: 4 }}>
                {plan.price}
                <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#484f58" }}>/mo</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0", paddingTop: 20 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "0.88rem", color: "#8b949e" }}>
                    <span style={{ color: "#30d158", fontSize: "0.9rem" }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  background: plan.highlight ? "#30d158" : "rgba(255,255,255,0.06)",
                  color: plan.highlight ? "#0d1117" : "#e6edf3",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "40px 20px 60px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ color: "#484f58", fontSize: "0.85rem" }}>
          OpenClawScan — Open source, MIT License.
          <br />
          Built for the OpenClaw ecosystem.
        </p>
      </footer>
    </div>
  );
}

// ─── Page: Receipt Explorer ───────────────────────────────

function ReceiptPage({ onNavigate }) {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const r = MOCK_RECEIPT;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <button
        onClick={() => onNavigate("landing")}
        style={{
          background: "none",
          border: "none",
          color: "#58a6ff",
          fontSize: "0.85rem",
          cursor: "pointer",
          marginBottom: 24,
          padding: 0,
        }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e6edf3", margin: 0, letterSpacing: "-0.02em" }}>
          Receipt
        </h1>
        <Hash value={r.receipt_id} />
        {verifying ? (
          <Badge color="#e3b341" bg="rgba(227,179,65,0.12)">
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "0.7rem" }}>◌</span>
            {" "}Verifying…
          </Badge>
        ) : verified ? (
          <Badge>✓ Signature Valid</Badge>
        ) : (
          <Badge color="#f85149">✗ Invalid</Badge>
        )}
      </div>
      <p style={{ color: "#484f58", fontSize: "0.85rem", margin: "0 0 32px" }}>
        Agent <span style={{ color: "#8b949e" }}>{r.agent_id}</span> · {new Date(r.timestamp).toLocaleString()}
      </p>

      {/* Verification Panel */}
      <div
        style={{
          background: verified ? "rgba(48,209,88,0.04)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${verified ? "rgba(48,209,88,0.2)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
          transition: "all 0.5s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: "1.3rem" }}>{verified ? "🔒" : "⏳"}</span>
          <span style={{ fontWeight: 700, color: "#e6edf3", fontSize: "1rem" }}>
            {verified ? "Cryptographic Verification Passed" : "Verifying signature…"}
          </span>
        </div>
        {verified && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontSize: "0.82rem" }}>
            <div>
              <span style={{ color: "#484f58" }}>Algorithm:</span>{" "}
              <span style={{ color: "#8b949e" }}>Ed25519</span>
            </div>
            <div>
              <span style={{ color: "#484f58" }}>Key registered:</span>{" "}
              <span style={{ color: "#30d158" }}>Yes</span>
            </div>
            <div>
              <span style={{ color: "#484f58" }}>Time drift:</span>{" "}
              <span style={{ color: "#8b949e" }}>158ms</span>
            </div>
            <div>
              <span style={{ color: "#484f58" }}>Tampering:</span>{" "}
              <span style={{ color: "#30d158" }}>None detected</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Action", value: `${r.action.type}`, sub: r.action.name, icon: "⚙️" },
          { label: "Duration", value: `${(r.action.duration_ms / 1000).toFixed(1)}s`, sub: `${r.action.duration_ms}ms`, icon: "⏱" },
          { label: "Model", value: r.model.name, sub: r.model.provider, icon: "🧠" },
          { label: "Cost", value: `$${r.cost.amount_usd.toFixed(3)}`, sub: r.cost.was_routed ? "Routed" : "Direct", icon: "💰" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#484f58", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {item.icon} {item.label}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e6edf3" }}>{item.value}</div>
            <div style={{ fontSize: "0.8rem", color: "#8b949e", marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Tokens */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "#484f58", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Tokens
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          <div>
            <span style={{ color: "#8b949e", fontSize: "0.85rem" }}>Input: </span>
            <span style={{ color: "#e6edf3", fontWeight: 600 }}>{r.model.tokens_in.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: "#8b949e", fontSize: "0.85rem" }}>Output: </span>
            <span style={{ color: "#e6edf3", fontWeight: 600 }}>{r.model.tokens_out.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: "#8b949e", fontSize: "0.85rem" }}>Total: </span>
            <span style={{ color: "#e6edf3", fontWeight: 600 }}>{(r.model.tokens_in + r.model.tokens_out).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Hashes */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "#484f58", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          🔐 Content Hashes (SHA-256)
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: "0.78rem", color: "#484f58", marginBottom: 4 }}>Input:</div>
          <Hash value={r.hashes.input} />
        </div>
        <div>
          <div style={{ fontSize: "0.78rem", color: "#484f58", marginBottom: 4 }}>Output:</div>
          <Hash value={r.hashes.output} />
        </div>
      </div>

      {/* Signature */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "16px 18px",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "#484f58", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          ✍️ Digital Signature
        </div>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: "0.78rem", color: "#484f58" }}>Public Key: </span>
          <Hash value={r.signature.public_key} />
        </div>
        <div>
          <span style={{ fontSize: "0.78rem", color: "#484f58" }}>Algorithm: </span>
          <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#8b949e" }}>
            {r.signature.algorithm}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Task Timeline ──────────────────────────────────

function TaskPage({ onNavigate }) {
  const t = MOCK_TASK;
  const totalMin = Math.round(
    (new Date(t.completed_at) - new Date(t.started_at)) / 60000
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <button
        onClick={() => onNavigate("landing")}
        style={{
          background: "none",
          border: "none",
          color: "#58a6ff",
          fontSize: "0.85rem",
          cursor: "pointer",
          marginBottom: 24,
          padding: 0,
        }}
      >
        ← Back
      </button>

      {/* Task Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e6edf3", margin: 0, letterSpacing: "-0.02em" }}>
            {t.name}
          </h1>
          <Badge>✓ Completed</Badge>
        </div>
        <p style={{ color: "#484f58", fontSize: "0.85rem", margin: 0 }}>
          Agent <span style={{ color: "#8b949e" }}>{t.agent}</span> · by <span style={{ color: "#8b949e" }}>{t.owner}</span>
        </p>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {[
          { label: "Receipts", value: t.total_receipts, icon: "📄" },
          { label: "Duration", value: `${totalMin}min`, icon: "⏱" },
          { label: "Total Cost", value: `$${t.total_cost_usd.toFixed(2)}`, icon: "💰" },
          { label: "Tokens", value: t.total_tokens.toLocaleString(), icon: "🔤" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#484f58", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#e6edf3" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#e6edf3", marginBottom: 20 }}>
        Action Timeline
      </h2>
      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 8,
            bottom: 8,
            width: 2,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 1,
          }}
        />

        {t.receipts.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 18,
              marginBottom: 4,
              padding: "12px 0",
              cursor: "pointer",
              transition: "background 0.15s",
              borderRadius: 10,
              paddingLeft: 4,
              paddingRight: 12,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={() => onNavigate("receipt")}
          >
            {/* Dot */}
            <div
              style={{
                width: 24,
                minWidth: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#30d158",
                  boxShadow: "0 0 8px rgba(48,209,88,0.3)",
                }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <ActionIcon type={r.type} />
                <span style={{ fontWeight: 600, color: "#e6edf3", fontSize: "0.9rem" }}>{r.name}</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.72rem",
                    color: "#484f58",
                    background: "rgba(255,255,255,0.04)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {r.type}
                </span>
                <Badge>✓</Badge>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: "#8b949e", flexWrap: "wrap" }}>
                <span>⏱ {(r.duration / 1000).toFixed(1)}s</span>
                <span>🧠 {r.model}</span>
                <span>🔤 {r.tokens.toLocaleString()} tok</span>
                <span>💰 ${r.cost.toFixed(3)}</span>
                <span style={{ color: "#484f58" }}>#{r.seq}</span>
              </div>
            </div>

            {/* Time */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.78rem",
                color: "#484f58",
                whiteSpace: "nowrap",
                paddingTop: 2,
              }}
            >
              {r.time}
            </div>
          </div>
        ))}
      </div>

      {/* Sequence check */}
      <div
        style={{
          marginTop: 32,
          padding: "16px 20px",
          background: "rgba(48,209,88,0.04)",
          border: "1px solid rgba(48,209,88,0.15)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: "0.85rem",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>🔒</span>
        <div>
          <div style={{ fontWeight: 600, color: "#30d158" }}>All receipts verified</div>
          <div style={{ color: "#8b949e", fontSize: "0.8rem", marginTop: 2 }}>
            Sequence #0 → #7 complete, no gaps. All {t.total_receipts} signatures valid. No tampering detected.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("landing");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e6edf3",
        fontFamily:
          "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::selection { background: rgba(48, 209, 88, 0.3); }
      `}</style>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          background: "rgba(13,17,23,0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 100,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => setPage("landing")}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "linear-gradient(135deg, #30d158, #0a7a2e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            ◈
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em" }}>
            Open<span style={{ color: "#30d158" }}>Claw</span>Scan
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[
            { label: "Explorer", page: "task" },
            { label: "Receipt", page: "receipt" },
          ].map((nav) => (
            <button
              key={nav.page}
              onClick={() => setPage(nav.page)}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                background: page === nav.page ? "rgba(255,255,255,0.08)" : "transparent",
                color: page === nav.page ? "#e6edf3" : "#8b949e",
                fontSize: "0.84rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              {nav.label}
            </button>
          ))}
          <button
            style={{
              marginLeft: 8,
              padding: "7px 16px",
              borderRadius: 7,
              background: "#30d158",
              color: "#0d1117",
              fontSize: "0.84rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Pages */}
      {page === "landing" && <LandingPage onNavigate={setPage} />}
      {page === "receipt" && <ReceiptPage onNavigate={setPage} />}
      {page === "task" && <TaskPage onNavigate={setPage} />}
    </div>
  );
}

import { TBox, Stat, PixelBar } from '@/components/ui';
import { TerminalDemo } from '@/components/terminal-demo';
import Link from 'next/link';

const LOGO_ART = ` ██████╗  ██████╗███████╗
██╔═══██╗██╔════╝██╔════╝
██║   ██║██║     ███████╗
██║   ██║██║     ╚════██║
╚██████╔╝╚██████╗███████║
 ╚═════╝  ╚═════╝╚══════╝`;

export default function Home() {
  return (
    <div>
      {/* ── Hero ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="pt-16 pb-10">
          <pre className="text-[clamp(5px,1.2vw,9px)] leading-tight text-accent tracking-wide">{LOGO_ART}</pre>
          <div className="flex items-center gap-2 mt-2.5 mb-8">
            <span className="text-[10px] text-dim">OpenClawScan</span>
            <span className="text-[9px] text-ghost">v1.0.0</span>
            <span className="text-[9px] text-accent border border-accent/20 px-1.5 bg-accent/[.04]">MIT</span>
          </div>

          <h1 className="text-[clamp(24px,3.5vw,42px)] font-bold leading-tight text-bright tracking-tighter mb-4">
            Tamper-proof receipts<br />for AI agents<span className="text-accent cursor-inline">_</span>
          </h1>

          <p className="text-[clamp(12px,1.1vw,14px)] leading-relaxed text-dim max-w-[500px] mb-6">
            Every action your AI agent takes — cryptographically signed and
            verifiable. Like <span className="text-tx">git log</span>, but
            with <span className="text-tx">Ed25519 signatures</span>.
            Share one link, prove everything.
          </p>

          <div className="flex items-center gap-2 p-2.5 px-3.5 bg-card border border-faint mb-2.5 text-[12px]">
            <span className="text-accent">$</span>
            <span className="text-tx">npm install @openclawscan/sdk</span>
            <span className="ml-auto text-[9px] text-ghost cursor-pointer hover:text-dim">COPY</span>
          </div>

          <div className="flex gap-1.5 mb-8">
            <Link href="/dashboard" className="px-5 py-2.5 bg-accent text-black text-[12px] font-bold border-none">
              DASHBOARD →
            </Link>
            <a href="https://github.com" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint hover:border-ghost transition-colors">
              GITHUB
            </a>
            <Link href="/docs" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint hover:border-ghost transition-colors">
              DOCS
            </Link>
          </div>

          <div className="flex gap-6 text-[10px] text-ghost">
            <span><span className="text-tx font-bold text-sm">2.4k</span> agents</span>
            <span><span className="text-tx font-bold text-sm">180k</span> receipts</span>
            <span><span className="text-tx font-bold text-sm">99.9%</span> uptime</span>
          </div>
        </div>

        <div className="pt-16">
          <TerminalDemo />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint mb-6">
        <Stat label="SIGNATURE" value="Ed25519" sub="Asymmetric" />
        <Stat label="HASH" value="SHA-256" sub="One-way" />
        <Stat label="RAW DATA" value="Zero" color="#22c55e" sub="Hashes only" />
        <Stat label="SETUP" value="5 min" sub="One package" />
      </div>

      {/* ── Features ── */}
      <TBox title="FEATURES" color="#a78bfa" noPad>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-faint">
          {[
            ['█▀▀', '#22c55e', 'Signed receipts', 'Ed25519 digital signature on every action. Tamper one byte and the signature is invalid. Same crypto as SSH and Signal.'],
            ['▒▒▒', '#60a5fa', 'Privacy first', 'Inputs and outputs are SHA-256 hashed before storage. The hash is irreversible — raw data never leaves your machine.'],
            ['░█░', '#eab308', 'Gap detection', 'Receipts are numbered sequentially per task. If #2 is missing between #1 and #3 — that gap is immediately visible.'],
            ['███', '#a78bfa', 'One-link proof', 'Share a single URL. Your client can independently verify every action, timestamp, cost, and signature in the browser.'],
            ['▓▓▓', '#22d3ee', 'Local backup', 'Receipts saved to ~/.openclawscan/ before transmission. Your local copy is the canonical record. Always.'],
            ['█░█', '#ef4444', 'Time verified', 'Server adds an independent timestamp. Agent-server drift > 5 minutes is flagged. Can\'t backdate actions.'],
          ].map(([px, col, title, desc]) => (
            <div key={title} className="p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-widest" style={{ color: col }}>{px}</span>
                <span className="text-[12px] font-bold text-bright">{title}</span>
              </div>
              <p className="text-[10.5px] text-dim leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </TBox>

      {/* ── How it works + Supported actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="WORKFLOW" color="#22c55e">
          {[
            { n: '01', t: 'Install', cmd: 'npm install @openclawscan/sdk', desc: 'One package. Generates Ed25519 keypair and registers your agent automatically.' },
            { n: '02', t: 'Capture', cmd: 'await scanner.capture({ action, model, input, output })', desc: 'Every action is hashed (SHA-256) and signed (Ed25519) in real-time.' },
            { n: '03', t: 'Verify', cmd: '→ openclawscan.xyz/task/a3f8c2b1', desc: 'One link. Signatures verified in the browser. Your client sees everything.' },
          ].map((s, i) => (
            <div key={s.n} className={`py-3 ${i < 2 ? 'border-b border-faint' : ''}`}>
              <div className="flex gap-2.5 items-center mb-1">
                <span className="text-[10px] text-accent font-bold">{s.n}</span>
                <span className="text-[13px] font-bold text-bright">{s.t}</span>
              </div>
              <p className="text-[10.5px] text-dim leading-relaxed mb-1.5">{s.desc}</p>
              <code className="text-[10px] text-ghost bg-bg px-2.5 py-1 inline-block border border-faint overflow-auto max-w-full">{s.cmd}</code>
            </div>
          ))}
        </TBox>

        <div>
          <TBox title="SUPPORTED ACTIONS" color="#60a5fa">
            <div className="space-y-1.5">
              {['tool_call', 'model_call', 'file_write', 'file_read', 'web_search', 'api_call', 'message', 'custom'].map(a => (
                <PixelBar key={a} label={a} value={20} max={20} color={a.includes('tool') || a.includes('model') ? '#22c55e' : a.includes('file') || a.includes('web') ? '#60a5fa' : '#eab308'} />
              ))}
            </div>
          </TBox>

          <TBox title="COMPATIBLE WITH" color="#666">
            {['OpenClaw', 'LangChain', 'AutoGen', 'Custom agents'].map((name, i) => (
              <div key={name} className={`py-2 flex justify-between ${i < 3 ? 'border-b border-faint' : ''}`}>
                <span className="text-[11px] font-semibold text-bright">{name}</span>
                <span className="text-[10px] text-dim">{i === 0 ? 'Native' : i === 3 ? 'Node.js SDK' : 'Adapter'}</span>
              </div>
            ))}
          </TBox>
        </div>
      </div>

      {/* ── Receipt anatomy + Security ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="RECEIPT FORMAT" color="#eab308">
          <pre className="text-[clamp(9px,0.9vw,11px)] leading-[1.9] text-dim overflow-auto">{
`┌──────────── HEADER ──────────────────┐
│ receipt_id   rcpt_wyuc8de1qj93       │
│ agent_id     sentinel-007            │
│ task_id      a3f8c2b1                │
│ sequence     #3                      │
│ timestamp    2026-02-21T14:31:15Z    │
├──────────── ACTION ──────────────────┤
│ type         tool_call               │
│ name         mythril_scan            │
│ duration     12.0s                   │
├──────────── MODEL ───────────────────┤
│ provider     anthropic               │
│ model        claude-sonnet-4-5       │
│ tokens_in    3,840                   │
│ tokens_out   5,560                   │
│ cost         `}<span className="text-accent">$0.072</span>{`                   │
├──────────── INTEGRITY ───────────────┤
│ input_hash   fc5ff8db…c404924        │
│ output_hash  27c8c079…9052dc1        │
│ algorithm    `}<span className="text-accent">ed25519</span>{`                │
│ signature    `}<span className="text-accent">✓ valid</span>{`                 │
└──────────────────────────────────────┘`}
          </pre>
        </TBox>

        <TBox title="SECURITY MODEL" color="#ef4444">
          {[
            ['#22c55e', 'Authenticity', 'Ed25519 signature — same standard as SSH. One byte changed = invalid.'],
            ['#60a5fa', 'Privacy', 'SHA-256 hashed — raw data never leaves your machine.'],
            ['#eab308', 'Independence', 'Local backup before transmission. You always own your data.'],
            ['#a78bfa', 'Completeness', 'Sequential numbering — gaps are immediately visible.'],
            ['#ef4444', 'Timestamping', 'Server-verified — drift > 5min flagged. Can\'t backdate.'],
          ].map(([color, title, desc], i) => (
            <div key={title} className={`py-2.5 ${i < 4 ? 'border-b border-faint' : ''}`}>
              <div className="flex gap-2 items-center mb-1">
                <span className="text-[8px]" style={{ color }}>██</span>
                <span className="text-[12px] font-semibold text-bright">{title}</span>
              </div>
              <p className="text-[10.5px] text-dim leading-relaxed pl-5">{desc}</p>
            </div>
          ))}
        </TBox>
      </div>

      {/* ── Part of ClawControl ── */}
      <TBox title="PART OF CLAWCONTROL" color="#a78bfa">
        <p className="text-[12px] text-tx mb-3 leading-relaxed">
          OpenClawScan is the verification layer of <span className="text-purple font-bold">ClawControl</span> — the unified platform for OpenClaw agent owners.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-faint -mx-4 -mb-3.5">
          {[
            ['#60a5fa', 'BUILD', 'Agent setup, skill manager, smart recommendations'],
            ['#eab308', 'COSTS', 'Budget caps, smart routing, savings reports'],
            ['#ef4444', 'SECURITY', '55 audit checks, one-click fix, kill switch'],
            ['#22d3ee', 'WORK', 'Curated marketplace, bounty hunting, skill matching'],
            ['#666', 'COMMUNITY', 'Aggregated feeds, trending skills, weekly summaries'],
            ['#22c55e', 'VERIFY', 'On-chain proof, reputation scores ← you are here'],
          ].map(([col, name, desc]) => (
            <div key={name} className="p-3.5 px-4 bg-card">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[8px]" style={{ color: col }}>██</span>
                <span className={`text-[11px] font-bold ${name === 'VERIFY' ? 'text-accent' : 'text-bright'}`}>{name}</span>
                {name === 'VERIFY' && <span className="text-[8px] text-accent border border-accent/20 px-1">◈</span>}
              </div>
              <p className="text-[10px] text-dim leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </TBox>

      {/* ── Free forever ── */}
      <div id="pricing">
        <TBox title="PRICING" color="#22c55e">
          <div className="text-center py-6">
            <p className="text-[28px] font-bold text-bright mb-1">Free. Forever.</p>
            <p className="text-[12px] text-dim mb-6 max-w-[500px] mx-auto leading-relaxed">
              Unlimited agents. Unlimited receipts. Full API access. PDF export.
              No tiers, no paywalls, no limits. Standards should be free.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint max-w-[600px] mx-auto mb-6">
              <Stat label="AGENTS" value="∞" color="#22c55e" />
              <Stat label="RECEIPTS" value="∞" color="#22c55e" />
              <Stat label="API" value="Full" color="#22c55e" />
              <Stat label="COST" value="$0" color="#22c55e" />
            </div>
            <div className="border border-faint p-4 max-w-[480px] mx-auto text-left bg-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[8px] text-purple">██</span>
                <span className="text-[11px] font-bold text-bright">Support the project</span>
              </div>
              <p className="text-[10.5px] text-dim leading-relaxed">
                OpenClawScan is funded by the community. A support token lives on
                Base L2 — no utility, no promises. Just a way to back the protocol
                if you believe in verifiable AI.
              </p>
            </div>
          </div>
        </TBox>
      </div>

      {/* ── FAQ + Tech ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="FAQ" color="#666">
          {[
            ['Is my data safe?', 'Only SHA-256 hashes and metadata stored remotely. Raw data stays on your machine.'],
            ['What if the server goes down?', 'Receipts saved locally before transmission. Your local copy is canonical.'],
            ['Can I self-host?', 'Yes. MIT licensed. Run your own server and explorer.'],
            ['Different from logging?', 'Logs can be edited. Receipts are signed (Ed25519) + sequenced (gaps visible).'],
            ['What agents work?', 'OpenClaw natively. Any Node.js app via SDK. LangChain + AutoGen adapters planned.'],
          ].map(([q, a], i) => (
            <div key={q} className={`py-2.5 ${i < 4 ? 'border-b border-faint' : ''}`}>
              <p className="text-[11px] font-bold text-bright mb-0.5"><span className="text-ghost">?</span> {q}</p>
              <p className="text-[10px] text-dim leading-relaxed pl-3">{a}</p>
            </div>
          ))}
        </TBox>

        <div>
          <TBox title="TECH STACK" color="#333">
            {[
              ['Crypto', 'Ed25519 + SHA-256'], ['Runtime', 'Node.js ≥ 18'],
              ['Storage', 'SQLite local + Supabase'], ['Frontend', 'Next.js 14 + React 18'],
              ['Chain', 'Base L2 (optional)'], ['License', 'MIT'],
            ].map(([k, v], i) => (
              <div key={k} className={`flex justify-between py-2 ${i < 5 ? 'border-b border-faint' : ''}`}>
                <span className="text-[10px] text-ghost">{k}</span>
                <span className="text-[11px] text-tx">{v}</span>
              </div>
            ))}
          </TBox>

          <TBox title="ROADMAP" color="#22d3ee">
            {[
              ['#22c55e', 'v1.0', 'NOW', 'SDK, receipts, explorer, sharing'],
              ['#60a5fa', 'v1.1', 'MAR', 'PDF export, alerts, LangChain adapter'],
              ['#a78bfa', 'v1.2', 'APR', 'On-chain verification via Base L2'],
              ['#eab308', 'v1.3', 'MAY', 'Marketplace API, reputation scores'],
            ].map(([col, ver, when, desc], i) => (
              <div key={ver} className={`flex gap-2.5 py-2 items-center ${i < 3 ? 'border-b border-faint' : ''}`}>
                <span className="text-[8px]" style={{ color: col }}>██</span>
                <span className="text-[11px] font-bold text-bright min-w-[32px]">{ver}</span>
                <span className="text-[9px] min-w-[28px]" style={{ color: col }}>{when}</span>
                <span className="text-[10px] text-dim">{desc}</span>
              </div>
            ))}
          </TBox>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border border-accent/20 bg-accent/[.03] p-8 text-center mb-4">
        <p className="text-[15px] font-bold text-bright mb-2">Make your agent verifiable.</p>
        <p className="text-[12px] text-dim mb-4">5 minutes to set up. Free forever for basic use.</p>
        <div className="flex gap-1.5 justify-center flex-wrap">
          <Link href="/signup" className="px-5 py-2.5 bg-accent text-black text-[12px] font-bold">GET STARTED</Link>
          <Link href="/docs" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint">DOCS</Link>
        </div>
      </div>

      <div className="text-[9px] text-ghost text-center py-3 pb-8">
        ◈ openclawscan · MIT · v1.0.0 · part of ClawControl
      </div>
    </div>
  );
}

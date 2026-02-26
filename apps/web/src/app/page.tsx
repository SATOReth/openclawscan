import { TBox, Stat } from '@/components/ui';
import { TerminalDemo } from '@/components/terminal-demo';
import { CopyInstall } from '@/components/copy-install';
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
            <span className="text-[9px] text-ghost">v1.2.0</span>
            <span className="text-[9px] text-accent border border-accent/20 px-1.5 bg-accent/[.04]">MIT</span>
            <span className="text-[9px] text-c-blue border border-c-blue/20 px-1.5 bg-c-blue/[.04]">⛓ Base L2</span>
          </div>

          <h1 className="text-[clamp(24px,3.5vw,42px)] font-bold leading-tight text-bright tracking-tighter mb-4">
            Proof of Task<br />for AI agents<span className="text-accent cursor-inline">_</span>
          </h1>

          <p className="text-[clamp(12px,1.1vw,14px)] leading-relaxed text-dim max-w-[500px] mb-6">
            Cryptographic proof that your AI agent executed a task —
            signed with <span className="text-tx">Ed25519</span>,
            encrypted with <span className="text-tx">AES-256-GCM</span>,
            anchored on <span className="text-tx">Base L2</span>.
            Three levels of verification. One link to prove everything.
          </p>

          <CopyInstall command="npm install @openclawscan/sdk" />

          <div className="flex gap-1.5 mb-8">
            <Link href="/dashboard" className="px-5 py-2.5 bg-accent text-black text-[12px] font-bold border-none">
              DASHBOARD →
            </Link>
            <a href="https://github.com/SATOReth/openclawscan" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint hover:border-ghost transition-colors">
              GITHUB
            </a>
            <Link href="/docs" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint hover:border-ghost transition-colors">
              DOCS
            </Link>
          </div>

          <div className="flex gap-6 text-[10px] text-ghost">
            <span><span className="text-tx font-bold text-sm">Ed25519</span> signed</span>
            <span><span className="text-tx font-bold text-sm">AES-256</span> encrypted</span>
            <span><span className="text-tx font-bold text-sm">Base L2</span> anchored</span>
          </div>
        </div>

        <div className="pt-16">
          <TerminalDemo />
        </div>
      </div>

      {/* ── Proof of Task ── */}
      <div className="border border-accent/20 bg-accent/[.03] p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-accent tracking-widest">◈◈◈</span>
          <span className="text-[11px] text-accent tracking-widest font-bold">PROOF OF TASK (PoT)</span>
        </div>
        <p className="text-[clamp(14px,1.4vw,18px)] font-bold text-bright leading-snug mb-3 max-w-[700px]">
          Cryptographic attestation that an AI agent executed a specific task — 
          verified at three independent levels, anchored immutably on-chain.
        </p>
        <p className="text-[12px] text-dim leading-relaxed max-w-[600px]">
          Not a consensus mechanism. Not observability. Proof of Task is a new 
          verification primitive for the AI agent economy — client-facing proof
          that work was done, how it was done, and that nobody can alter the record.
        </p>
      </div>

      {/* ── 3-Level Verification Stack ── */}
      <TBox title="3-LEVEL VERIFICATION STACK" color="#22c55e" noPad>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-faint">
          <div className="p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[20px] text-accent">①</span>
              <span className="text-[9px] text-accent tracking-widest font-bold">SIGNATURE</span>
            </div>
            <p className="text-[15px] font-bold text-bright mb-2">Ed25519</p>
            <p className="text-[12px] text-dim leading-relaxed mb-3">
              Every receipt is digitally signed by the agent's private key.
              Same cryptography as SSH and Signal. Tamper one byte — signature invalid.
            </p>
            <div className="text-[10px] text-ghost border border-faint px-2.5 py-1.5 bg-bg inline-block">
              proves: <span className="text-accent">agent signed it</span>
            </div>
          </div>

          <div className="p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[20px] text-c-blue">②</span>
              <span className="text-[9px] text-c-blue tracking-widest font-bold">ENCRYPTION</span>
            </div>
            <p className="text-[15px] font-bold text-bright mb-2">AES-256-GCM</p>
            <p className="text-[12px] text-dim leading-relaxed mb-3">
              Input/output hashed then encrypted end-to-end. Server stores only blobs.
              Viewing key in URL fragment — zero plaintext on server. Ever.
            </p>
            <div className="text-[10px] text-ghost border border-faint px-2.5 py-1.5 bg-bg inline-block">
              proves: <span className="text-c-blue">data is authentic</span>
            </div>
          </div>

          <div className="p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[20px] text-purple">③</span>
              <span className="text-[9px] text-purple tracking-widest font-bold">BLOCKCHAIN</span>
            </div>
            <p className="text-[15px] font-bold text-bright mb-2">Merkle on Base L2</p>
            <p className="text-[12px] text-dim leading-relaxed mb-3">
              Receipt hashes form a Merkle tree. Root anchored on Base L2 via ClawVerify.sol.
              Immutable — even OpenClawScan cannot alter certified records.
            </p>
            <div className="text-[10px] text-ghost border border-faint px-2.5 py-1.5 bg-bg inline-block">
              proves: <span className="text-purple">record is permanent</span>
            </div>
          </div>
        </div>
      </TBox>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint mb-6">
        <Stat label="SIGNATURE" value="Ed25519" sub="Per receipt" />
        <Stat label="ENCRYPTION" value="AES-256" sub="End-to-end" />
        <Stat label="ANCHORING" value="Base L2" sub="Merkle proofs" />
        <Stat label="SERVER DATA" value="Zero" color="#22c55e" sub="Hashes + blobs" />
      </div>

      {/* ── Features ── */}
      <TBox title="FEATURES" color="#a78bfa" noPad>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-faint">
          {[
            ['█▀▀', '#22c55e', 'Signed receipts', 'Ed25519 digital signature on every action. Tamper one byte and the signature is invalid. Same crypto as SSH and Signal.'],
            ['▒▒▒', '#60a5fa', 'E2E encrypted', 'AES-256-GCM encryption. Input/output hashed then encrypted. Viewing key stays in URL fragment. Server sees only blobs.'],
            ['░█░', '#a78bfa', 'On-chain anchoring', 'Merkle tree root certified on Base L2. ClawVerify.sol stores immutable proof. Gas cost: ~$0.001 per batch.'],
            ['███', '#eab308', 'One-link proof', 'Share a single URL. Your client verifies signatures, decrypts data, and checks Merkle proofs — all in the browser.'],
            ['▓▓▓', '#22d3ee', 'Gap detection', 'Receipts numbered sequentially per task. If #2 is missing between #1 and #3 — that gap is immediately visible.'],
            ['█░█', '#ef4444', 'EU AI Act ready', 'Audit trails become mandatory Aug 2026. OpenClawScan provides compliant, tamper-proof records out of the box.'],
          ].map(([px, col, title, desc]) => (
            <div key={title} className="p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-widest" style={{ color: col as string }}>{px}</span>
                <span className="text-[13px] font-bold text-bright">{title}</span>
              </div>
              <p className="text-[12px] text-dim leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </TBox>

      {/* ── How it works + On-Chain ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="WORKFLOW" color="#22c55e">
          {[
            { n: '01', t: 'Install', cmd: 'npm install @openclawscan/sdk', desc: 'One package. Generates Ed25519 keypair and registers your agent automatically.' },
            { n: '02', t: 'Capture', cmd: 'await scanner.capture({ action, model, input, output })', desc: 'Every action is hashed, encrypted (AES-256-GCM), and signed (Ed25519) in real-time.' },
            { n: '03', t: 'Certify', cmd: 'POST /api/tasks/certify', desc: 'Merkle tree built from receipt hashes. Root anchored on Base L2 via ClawVerify.sol.' },
            { n: '04', t: 'Verify', cmd: '→ openclawscan.xyz/task/a3f8c2b1', desc: 'One link. 3-level verification in the browser. Your client sees everything.' },
          ].map((s, i) => (
            <div key={s.n} className={`py-4 ${i < 3 ? 'border-b border-faint' : ''}`}>
              <div className="flex gap-2.5 items-center mb-1.5">
                <span className="text-[11px] text-accent font-bold">{s.n}</span>
                <span className="text-[15px] font-bold text-bright">{s.t}</span>
              </div>
              <p className="text-[13px] text-dim leading-relaxed mb-2">{s.desc}</p>
              <code className="text-[11px] text-ghost bg-bg px-2.5 py-1.5 inline-block border border-faint overflow-auto max-w-full">{s.cmd}</code>
            </div>
          ))}
        </TBox>

        <TBox title="ON-CHAIN" color="#a78bfa">
          <div className="mb-4">
            <p className="text-[13px] text-dim leading-relaxed mb-3">
              ClawVerify.sol is deployed on Base L2 mainnet. Each certification stores 
              a Merkle root that covers all receipts in a task. Individual receipts can 
              be independently verified against the on-chain root.
            </p>
            <div className="border border-faint bg-bg p-3 mb-4">
              <pre className="text-[10px] leading-[1.8] text-dim overflow-auto">{
`┌──────────── ClawVerify.sol ─────────────┐
│                                          │
│  certifyBatch(root, agent, slug, count)  │
│  verifyReceipt(batchId, leaf, proof)     │
│  getBatch(batchId) → BatchData           │
│                                          │
│  Contract:  0x0955...18D3               │
│  Chain:     Base L2 (8453)               │
│  Gas/batch: ~167K (~$0.001)              │
└──────────────────────────────────────────┘`}
              </pre>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              ['Contract', '0x0955...18D3', 'https://basescan.org/address/0x095525d68481a84ffDD4740aaB07f425b84718D3'],
              ['Chain', 'Base L2 (8453)', 'https://base.org'],
              ['Proof', 'Merkle tree (keccak256)', null],
              ['Cost', '~$0.001 per batch', null],
            ].map(([k, v, url], i) => (
              <div key={k as string} className={`flex justify-between py-2 ${i < 3 ? 'border-b border-faint' : ''}`}>
                <span className="text-[12px] text-ghost">{k}</span>
                {url ? (
                  <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-[12px] text-c-blue hover:text-bright transition-colors">
                    {v} ↗
                  </a>
                ) : (
                  <span className="text-[12px] text-tx">{v}</span>
                )}
              </div>
            ))}
          </div>
        </TBox>
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
│ name         slither_scan            │
│ duration     8,400ms                 │
├──────────── MODEL ───────────────────┤
│ provider     anthropic               │
│ model        claude-sonnet-4-5       │
│ tokens_in    3,840                   │
│ tokens_out   5,560                   │
│ cost         $0.072                  │
├──────────── HASHES ──────────────────┤
│ input_hash   a1b2c3d4e5f6...        │
│ output_hash  f6e5d4c3b2a1...        │
├──────────── SIGNATURE ───────────────┤
│ algorithm    ed25519                 │
│ public_key   VzqZUrs/ZPyw+...       │
│ signature    `}<span className="text-accent">✓ valid</span>{`                 │
├──────────── ENCRYPTION ──────────────┤
│ cipher       AES-256-GCM            │
│ viewing_key  `}<span className="text-c-blue">#key=...in URL</span>{`          │
├──────────── BLOCKCHAIN ──────────────┤
│ chain        Base L2 (8453)          │
│ merkle_proof `}<span className="text-purple">✓ on-chain</span>{`             │
│ tx_hash      0x9112dc...576fc7d59   │
└──────────────────────────────────────┘`}
          </pre>
        </TBox>

        <TBox title="SECURITY MODEL" color="#ef4444">
          {[
            ['#22c55e', 'Authenticity', 'Ed25519 signature — same standard as SSH. One byte changed = invalid.'],
            ['#60a5fa', 'Privacy', 'AES-256-GCM end-to-end encryption. Zero plaintext on server.'],
            ['#a78bfa', 'Immutability', 'Merkle root on Base L2 — even OpenClawScan cannot alter certified data.'],
            ['#eab308', 'Completeness', 'Sequential numbering — gaps are immediately visible.'],
            ['#ef4444', 'Timestamping', 'Server-verified — drift > 5min flagged. Can\'t backdate.'],
            ['#22d3ee', 'Independence', 'Local backup before transmission. You always own your data.'],
          ].map(([color, title, desc], i) => (
            <div key={title} className={`py-3 ${i < 5 ? 'border-b border-faint' : ''}`}>
              <div className="flex gap-2 items-center mb-1">
                <span className="text-[8px]" style={{ color: color as string }}>██</span>
                <span className="text-[13px] font-semibold text-bright">{title}</span>
              </div>
              <p className="text-[12px] text-dim leading-relaxed pl-5">{desc}</p>
            </div>
          ))}
        </TBox>
      </div>

      {/* ── Compatible + Use Cases ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="COMPATIBLE WITH" color="#666">
          {['OpenClaw', 'LangChain', 'AutoGen', 'Custom agents'].map((name, i) => (
            <div key={name} className={`py-3 flex justify-between ${i < 3 ? 'border-b border-faint' : ''}`}>
              <span className="text-[13px] font-semibold text-bright">{name}</span>
              <span className="text-[12px] text-dim">{i === 0 ? 'Native' : i === 3 ? 'Node.js SDK' : 'Coming soon'}</span>
            </div>
          ))}
        </TBox>

        <TBox title="USE CASES" color="#22d3ee">
          {[
            ['Client transparency', 'Prove to clients exactly what your agent did, every step, verifiable.'],
            ['Regulatory compliance', 'EU AI Act (Aug 2026) mandates audit trails. PoT is ready today.'],
            ['Agent collaborations', 'When agents work together, PoT certifies who did what.'],
            ['Dispute resolution', 'Immutable on-chain record settles disagreements.'],
          ].map(([title, desc], i) => (
            <div key={title} className={`py-3 ${i < 3 ? 'border-b border-faint' : ''}`}>
              <p className="text-[13px] font-semibold text-bright mb-1">{title}</p>
              <p className="text-[12px] text-dim leading-relaxed">{desc}</p>
            </div>
          ))}
        </TBox>
      </div>

      {/* ── Free forever ── */}
      <div id="pricing">
        <TBox title="PRICING" color="#22c55e">
          <div className="text-center py-6">
            <p className="text-[28px] font-bold text-bright mb-1">Free. Forever.</p>
            <p className="text-[13px] text-dim mb-6 max-w-[500px] mx-auto leading-relaxed">
              Unlimited agents. Unlimited receipts. Full API access. E2E encryption.
              On-chain certification. No tiers, no paywalls. Standards should be free.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint max-w-[600px] mx-auto mb-6">
              <Stat label="AGENTS" value="∞" color="#22c55e" />
              <Stat label="RECEIPTS" value="∞" color="#22c55e" />
              <Stat label="ENCRYPTION" value="E2E" color="#22c55e" />
              <Stat label="COST" value="$0" color="#22c55e" />
            </div>
            <div className="border border-faint p-4 max-w-[480px] mx-auto text-left bg-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[8px] text-purple">██</span>
                <span className="text-[12px] font-bold text-bright">Support the project</span>
              </div>
              <p className="text-[12px] text-dim leading-relaxed mb-3">
                OpenClawScan is funded by the community. A support token lives on
                Base L2 — no utility, no promises. Just a way to back the protocol
                if you believe in verifiable AI.
              </p>
              <a
                href="https://basescan.org/token/OCS_TOKEN_ADDRESS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[13px] font-bold text-accent border border-accent/30 px-3 py-1.5 bg-accent/[.05] hover:bg-accent/[.1] transition-colors"
              >
                $OCS on Base →
              </a>
            </div>
          </div>
        </TBox>
      </div>

      {/* ── FAQ + Tech + Roadmap ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="FAQ" color="#666">
          {[
            ['What is Proof of Task?', 'A 3-level cryptographic attestation that an AI agent executed a task — Ed25519 signed, E2E encrypted, Merkle-anchored on Base L2.'],
            ['Is my data safe?', 'E2E encrypted with AES-256-GCM. Server stores only encrypted blobs and hashes. Viewing key never leaves the URL fragment.'],
            ['What if the server goes down?', 'Receipts saved locally before transmission. On-chain Merkle roots are permanent — they exist independently of OpenClawScan.'],
            ['How much does on-chain cost?', '~$0.001 per batch on Base L2. That covers an entire task with all its receipts.'],
            ['Can I self-host?', 'Yes. MIT licensed. Run your own server and explorer. On-chain verification is public.'],
            ['What agents work?', 'OpenClaw natively. Any Node.js app via SDK. LangChain + AutoGen adapters planned.'],
          ].map(([q, a], i) => (
            <div key={q} className={`py-3 ${i < 5 ? 'border-b border-faint' : ''}`}>
              <p className="text-[13px] font-bold text-bright mb-1"><span className="text-ghost">?</span> {q}</p>
              <p className="text-[12px] text-dim leading-relaxed pl-4">{a}</p>
            </div>
          ))}
        </TBox>

        <div>
          <TBox title="TECH STACK" color="#333">
            {[
              ['Signatures', 'Ed25519 (TweetNaCl)'], ['Encryption', 'AES-256-GCM (Web Crypto)'],
              ['Blockchain', 'Base L2 + ethers.js'], ['Proofs', 'merkletreejs (keccak256)'],
              ['Runtime', 'Node.js ≥ 18'], ['Storage', 'Supabase (PostgreSQL)'],
              ['Frontend', 'Next.js 14 + React 18'], ['License', 'MIT'],
            ].map(([k, v], i) => (
              <div key={k} className={`flex justify-between py-2.5 ${i < 7 ? 'border-b border-faint' : ''}`}>
                <span className="text-[12px] text-ghost">{k}</span>
                <span className="text-[12px] text-tx">{v}</span>
              </div>
            ))}
          </TBox>

          <TBox title="ROADMAP" color="#22d3ee">
            {[
              ['#22c55e', 'v1.0', '✓', 'SDK, receipts, explorer, sharing'],
              ['#22c55e', 'v1.1', '✓', 'E2E encryption (AES-256-GCM)'],
              ['#22c55e', 'v1.2', '✓ LIVE', 'On-chain anchoring via Base L2'],
              ['#eab308', 'v1.3', 'NEXT', 'Marketplace API, reputation scores'],
            ].map(([col, ver, when, desc], i) => (
              <div key={ver} className={`flex gap-2.5 py-2.5 items-center ${i < 3 ? 'border-b border-faint' : ''}`}>
                <span className="text-[8px]" style={{ color: col as string }}>██</span>
                <span className="text-[12px] font-bold text-bright min-w-[32px]">{ver}</span>
                <span className="text-[10px] min-w-[52px]" style={{ color: col as string }}>{when}</span>
                <span className="text-[12px] text-dim">{desc}</span>
              </div>
            ))}
          </TBox>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border border-accent/20 bg-accent/[.03] p-8 text-center mb-4">
        <p className="text-[15px] font-bold text-bright mb-2">Make your agent verifiable.</p>
        <p className="text-[13px] text-dim mb-1">Proof of Task — 3-level verification for AI agents.</p>
        <p className="text-[13px] text-dim mb-4">5 minutes to set up. Free forever. On-chain.</p>
        <div className="flex gap-1.5 justify-center flex-wrap">
          <Link href="/signup" className="px-5 py-2.5 bg-accent text-black text-[12px] font-bold">GET STARTED</Link>
          <Link href="/docs" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint">DOCS</Link>
          <a href="https://basescan.org/address/0x095525d68481a84ffDD4740aaB07f425b84718D3" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-transparent text-dim text-[12px] border border-faint">
            BASESCAN ↗
          </a>
        </div>
      </div>

      <div className="text-[10px] text-ghost text-center py-3 pb-8">
        ◈ openclawscan · Proof of Task · MIT · v1.2.0
      </div>
    </div>
  );
}

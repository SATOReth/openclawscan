# ◈ OpenClawScan

**Tamper-proof receipts for AI agents.**

Every action your AI agent takes — cryptographically signed and verifiable. Like `git log`, but with Ed25519 signatures. Share one link, prove everything.

```
npm install @openclawscan/sdk
```

## What it does

When your AI agent calls a tool, writes a file, makes an API request, or runs a model — OpenClawScan creates a **signed receipt**. Each receipt includes:

- **Ed25519 digital signature** — tamper one byte and it's invalid
- **SHA-256 hashes** of input/output — raw data never leaves your machine
- **Sequential numbering** — deleted receipts create visible gaps
- **Server-verified timestamps** — can't backdate actions

Share a single URL. Your client can independently verify every action, timestamp, cost, and signature in the browser.

## Quick start

```typescript
import { OpenClawScan } from '@openclawscan/sdk'

const scanner = new OpenClawScan({
  agentId: 'my-audit-agent',
  ownerId: 'github:myuser',
  secretKey: process.env.OCS_SECRET_KEY,
  apiKey: process.env.OCS_API_KEY,
})

// Capture an action — auto-hashed and signed
await scanner.capture({
  action: { type: 'tool_call', name: 'slither_scan', duration_ms: 8400 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 3840, tokens_out: 5560 },
  cost: { amount_usd: 0.072 },
  input: contractSource,   // → SHA-256 hashed
  output: scanResults,     // → SHA-256 hashed
})

// → https://openclawscan.xyz/task/a3f8c2b1
```

## Features

- **Signed receipts** — Ed25519 on every action (same crypto as SSH)
- **Privacy first** — SHA-256 hashed I/O, raw data stays local
- **Gap detection** — sequential numbering, missing receipts are visible
- **One-link proof** — share a URL, verify everything in the browser
- **Local backup** — receipts saved to `~/.openclawscan/` before transmission
- **Time verified** — server timestamp, drift >5min flagged
- **PDF export** — full audit report with hashes and signatures
- **Task grouping** — group receipts by task, share as one link
- **Completely free** — no limits, no tiers, no paywalls

## Architecture

```
Agent Action
     ↓
SDK: SHA-256 hash input/output
     ↓
SDK: Sign payload with Ed25519
     ↓
Save to ~/.openclawscan/ (local backup)
     ↓
POST /api/receipts (server verifies signature + timestamp)
     ↓
PostgreSQL (hashes only, no raw data)
     ↓
Public verification: /receipt/[id] or /task/[slug]
```

## Project structure

```
openclawscan/
├── packages/
│   ├── sdk/          # @openclawscan/sdk — crypto, receipts, API client
│   └── verify/       # @openclawscan/verify — standalone verification
├── apps/
│   └── web/          # Next.js 14 app — dashboard, API, explorer
├── contracts/        # Solidity (future: on-chain anchoring)
└── supabase/         # Database migrations
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Crypto | Ed25519 (tweetnacl) + SHA-256 |
| Frontend | Next.js 14, React 18, TailwindCSS |
| Backend | Next.js API Routes (serverless) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email + GitHub + Google) |
| Hosting | Vercel |

## Part of ClawControl

OpenClawScan is the verification layer of **ClawControl** — the unified platform for OpenClaw agent owners. ClawControl provides Build, Costs, Security, Work, Community, and Verify (powered by OCS).

## License

MIT

---

*Standards should be free.*

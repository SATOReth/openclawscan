# ◈ OpenClawScan

**Proof of Task for AI agents.**

Cryptographic attestation that your AI agent executed a task — signed with Ed25519, encrypted with AES-256-GCM, anchored on Base L2. Three levels of verification. One link to prove everything.

```
npm install @openclawscan/sdk
```

## What is Proof of Task?

Proof of Task (PoT) is a new verification primitive for the AI agent economy. Not a consensus mechanism. Not observability. It's client-facing proof that work was done, how it was done, and that nobody can alter the record.

Every receipt is verified at three independent levels:

| Level | Technology | What it proves |
|-------|-----------|---------------|
| ① Signature | Ed25519 | The agent signed it |
| ② Encryption | AES-256-GCM | The data is authentic |
| ③ Blockchain | Merkle proofs on Base L2 | The record is permanent |

## Quick start

```typescript
import { OpenClawScan } from '@openclawscan/sdk'

const scanner = new OpenClawScan({
  agentId: 'my-audit-agent',
  ownerId: 'github:myuser',
  secretKey: process.env.OCS_SECRET_KEY,
  apiKey: process.env.OCS_API_KEY,
})

// Capture an action — hashed, encrypted, and signed
await scanner.capture({
  action: { type: 'tool_call', name: 'slither_scan', duration_ms: 8400 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 3840, tokens_out: 5560 },
  cost: { amount_usd: 0.072 },
  input: contractSource,   // → SHA-256 hashed → AES-256-GCM encrypted
  output: scanResults,     // → SHA-256 hashed → AES-256-GCM encrypted
})

// Certify on-chain
// POST /api/tasks/certify → Merkle root anchored on Base L2

// → https://openclawscan.xyz/task/a3f8c2b1
```

## Features

- **Ed25519 signatures** — every receipt digitally signed (same crypto as SSH and Signal)
- **E2E encryption** — AES-256-GCM, zero plaintext on server, viewing key in URL fragment
- **On-chain anchoring** — Merkle tree root certified on Base L2 via ClawVerify.sol
- **One-link proof** — share a URL, 3-level verification in the browser
- **Gap detection** — sequential numbering, missing receipts are visible
- **EU AI Act ready** — audit trails become mandatory Aug 2026
- **Local backup** — receipts saved to `~/.openclawscan/` before transmission
- **Time verified** — server timestamp, drift >5min flagged

## Architecture

```
Agent Action
     ↓
SDK: SHA-256 hash input/output
     ↓
SDK: AES-256-GCM encrypt (viewing key → URL fragment)
     ↓
SDK: Sign payload with Ed25519
     ↓
Save to ~/.openclawscan/ (local backup)
     ↓
POST /api/receipts (server stores encrypted blobs + hashes only)
     ↓
POST /api/tasks/certify → Merkle tree → Base L2 (ClawVerify.sol)
     ↓
Public verification: /task/[slug] — 3-level verify in browser
```

## On-chain

ClawVerify.sol is deployed on Base L2 mainnet:

| | |
|---|---|
| Contract | [`0x0955...18D3`](https://basescan.org/address/0x095525d68481a84ffDD4740aaB07f425b84718D3) |
| Chain | Base L2 (8453) |
| Functions | `certifyBatch()`, `verifyReceipt()`, `getBatch()` |
| Gas/batch | ~167K (~$0.001) |

Each certification stores a Merkle root covering all receipts in a task. Individual receipts can be independently verified against the on-chain root — even if OpenClawScan goes offline.

## Project structure

```
openclawscan/
├── packages/
│   └── sdk/          # @openclawscan/sdk — crypto, encryption, receipts, API client
├── apps/
│   └── web/          # Next.js 14 app — dashboard, API, explorer, verification
├── contracts/
│   └── ClawVerify.sol # On-chain Merkle root storage (Base L2 mainnet)
└── supabase/
    └── migrations/   # 001-005: schema, auth, signed payload, e2e, blockchain
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Signatures | Ed25519 (TweetNaCl) |
| Encryption | AES-256-GCM (Web Crypto API) |
| Blockchain | Base L2 + ethers.js |
| Merkle proofs | merkletreejs (keccak256) |
| Frontend | Next.js 14, React 18, TailwindCSS |
| Backend | Next.js API Routes (serverless) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (GitHub OAuth) |
| Hosting | Vercel |

## Part of ClawCove

OpenClawScan is the verification layer of **ClawCove** — the unified platform for OpenClaw agent owners. ClawCove provides Build, Costs, Security, Work, Community, and Verify (powered by OpenClawScan's Proof of Task).

## License

MIT — OpenClawScan is an open standard. Proof of Task works when everyone can adopt it.

# @openclawscan/sdk

Tamper-proof receipts for AI agents. Ed25519 signed, SHA-256 hashed, verifiable by anyone.

## Install

```bash
npm install @openclawscan/sdk
```

## Quick Start

```typescript
import { OpenClawScan, generateKeyPair, serializeKeyPair } from '@openclawscan/sdk'

// Generate keys (once, save securely)
const keys = generateKeyPair()
const serialized = serializeKeyPair(keys)

// Initialize
const scanner = new OpenClawScan({
  agentId: 'my-agent',
  ownerId: 'github:myuser',
  secretKey: serialized.secretKey,
  apiKey: 'ocs_your_api_key',
})

// Capture an action
await scanner.capture({
  action: { type: 'tool_call', name: 'slither_scan', duration_ms: 8400 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 3840, tokens_out: 5560 },
  cost: { amount_usd: 0.072 },
  input: contractSource,   // SHA-256 hashed, never stored
  output: scanResults,     // SHA-256 hashed, never stored
})
```

## Verify (no server needed)

```typescript
const result = OpenClawScan.verify(receipt, originalOutput)
// { signatureValid: true, hashMatch: true }
```

## Features

- **Ed25519 signatures** on every action (same crypto as SSH)
- **SHA-256 hashed** I/O — raw data never leaves your machine
- **Gap detection** — sequential numbering, missing receipts visible
- **Local backup** — saved to ~/.openclawscan/ before transmission
- **Task grouping** — group receipts, share as one link
- **Completely free** — no limits, no tiers

## Links

- [Dashboard](https://openclawscan.xyz/dashboard)
- [Docs](https://openclawscan.xyz/docs)
- [GitHub](https://github.com/SATOReth/openclawscan)
- [Verify](https://openclawscan.xyz/scan)

## License

MIT

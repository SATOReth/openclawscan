# @openclawscan/sdk

Proof of Task for AI agents. 3-level verification: Ed25519 signatures, AES-256-GCM encryption, Merkle proofs on Base L2.

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

// 1. Start a task
const task = await scanner.startTask({
  agent_id: 'my-agent',
  name: 'Smart Contract Audit — TokenVault.sol',
})

// 2. Capture actions — hashed, signed, encrypted
await scanner.capture({
  action: { type: 'tool_call', name: 'slither_scan', duration_ms: 8400 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 3840, tokens_out: 5560 },
  cost: { amount_usd: 0.072 },
  input: contractSource,   // SHA-256 hashed, AES-256-GCM encrypted
  output: scanResults,     // SHA-256 hashed, AES-256-GCM encrypted
})

// 3. Complete the task
await scanner.completeTask()

// 4. Certify on Base L2
const cert = await scanner.certify(task.slug)
console.log('TX:', cert.tx_hash)
console.log('BaseScan:', cert.basescan_url)
// → https://openclawscan.xyz/task/{slug}
```

## Verify (no server needed)

```typescript
const result = OpenClawScan.verify(receipt, originalOutput)
// { signatureValid: true, hashMatch: true }
```

## Features

- **Ed25519 signatures** — every receipt digitally signed (same crypto as SSH and Signal)
- **AES-256-GCM encryption** — end-to-end, zero plaintext on server, viewing key in URL fragment
- **Merkle proofs on Base L2** — on-chain anchoring via ClawVerify.sol, immutable
- **One-link proof** — share a URL, 3-level verification in the browser
- **Gap detection** — sequential numbering, missing receipts visible
- **Local backup** — saved to ~/.openclawscan/ before transmission
- **Task grouping** — group receipts, certify and share as one link
- **EU AI Act ready** — audit trails become mandatory Aug 2026

## On-Chain

ClawVerify.sol on Base L2 mainnet: [`0x0955...18D3`](https://basescan.org/address/0x095525d68481a84ffDD4740aaB07f425b84718D3)

| | |
|---|---|
| Chain | Base L2 (8453) |
| Gas/batch | ~167K (~$0.001) |
| Verification | Free (view function) |

## Links

- [Dashboard](https://openclawscan.xyz/dashboard)
- [Docs](https://openclawscan.xyz/docs)
- [GitHub](https://github.com/SATOReth/openclawscan)
- [BaseScan](https://basescan.org/address/0x095525d68481a84ffDD4740aaB07f425b84718D3)

## License

MIT — OpenClawScan is an open standard.

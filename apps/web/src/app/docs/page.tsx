'use client';

import { useState } from 'react';
import { TBox } from '@/components/ui';
import { CopyInstall } from '@/components/copy-install';

type Section = 'overview' | 'quickstart' | 'api' | 'verification' | 'onchain' | 'encryption';

const NAV: { id: Section; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'api', label: 'API Reference' },
  { id: 'verification', label: 'Verification' },
  { id: 'encryption', label: 'E2E Encryption' },
  { id: 'onchain', label: 'On-Chain' },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="text-[12px] leading-[1.8] text-dim bg-bg border border-faint p-4 overflow-auto mb-4">
      {children}
    </pre>
  );
}

function H2({ children }: { children: string }) {
  return <h2 className="text-[18px] font-bold text-bright mt-6 mb-3">{children}</h2>;
}

function H3({ children }: { children: string }) {
  return <h3 className="text-[15px] font-bold text-bright mt-4 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-dim leading-relaxed mb-3">{children}</p>;
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const color = method === 'GET' ? '#22c55e' : method === 'POST' ? '#60a5fa' : '#eab308';
  return (
    <div className="border border-faint p-3 mb-3 bg-bg">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-bold px-1.5 py-0.5 border" style={{ color, borderColor: color + '44' }}>{method}</span>
        <code className="text-[13px] text-bright">{path}</code>
      </div>
      <p className="text-[12px] text-dim pl-1">{desc}</p>
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState<Section>('overview');

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-accent text-[13px]">◈</span>
        <h1 className="text-[24px] font-bold text-bright">Documentation</h1>
        <span className="text-[10px] text-ghost">v1.2</span>
      </div>
      <p className="text-[13px] text-dim mb-6">Proof of Task protocol — 3-level verification for AI agents.</p>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
        {/* Sidebar nav */}
        <div className="flex md:flex-col gap-1.5 flex-wrap">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`text-left text-[12px] px-3 py-1.5 transition-colors ${
                active === n.id
                  ? 'text-bright bg-card border border-accent/30'
                  : 'text-dim hover:text-tx border border-transparent'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {active === 'overview' && (
            <TBox title="OVERVIEW" color="#22c55e">
              <H2>What is Proof of Task?</H2>
              <P>
                Proof of Task (PoT) is a cryptographic attestation that an AI agent executed a specific task.
                It is not a consensus mechanism and it is not observability. It is a new verification primitive
                for the AI agent economy — client-facing proof that work was done, how it was done, and that
                nobody can alter the record.
              </P>

              <H3>3-Level Verification Stack</H3>
              <P>Every receipt is verified at three independent levels:</P>

              <div className="border border-faint bg-bg p-3 mb-4">
                <pre className="text-[12px] leading-[1.9] text-dim">{
`① SIGNATURE   Ed25519          → agent signed it
② ENCRYPTION  AES-256-GCM      → data is authentic
③ BLOCKCHAIN  Merkle on Base L2 → record is permanent`}
                </pre>
              </div>

              <H3>Architecture</H3>
              <Code>{
`Agent Action
     ↓
SDK: SHA-256 hash input/output
     ↓
SDK: AES-256-GCM encrypt (viewing key → URL fragment)
     ↓
SDK: Sign payload with Ed25519
     ↓
Save to ~/.openclawscan/ (local backup)
     ↓
POST /api/receipts (server stores encrypted blobs + hashes)
     ↓
POST /api/tasks/certify → Merkle tree → Base L2
     ↓
Public verification: /task/[slug] — 3-level verify in browser`}
              </Code>

              <H3>Receipt Format</H3>
              <P>Each signed receipt contains:</P>
              <Code>{
`{
  "version": "1.0",
  "receipt_id": "rcpt_wyuc8de1qj93",
  "agent_id": "sentinel-007",
  "owner_id": "github:myuser",
  "timestamp": "2026-02-21T14:31:15Z",
  "action": { "type": "tool_call", "name": "slither_scan", "duration_ms": 8400 },
  "model": { "provider": "anthropic", "name": "claude-sonnet-4-5", "tokens_in": 3840, "tokens_out": 5560 },
  "cost": { "amount_usd": 0.072 },
  "hashes": { "input_sha256": "a1b2c3...", "output_sha256": "f6e5d4..." },
  "context": { "task_id": "uuid", "session_id": "sess_abc", "sequence": 3 },
  "signature": { "algorithm": "ed25519", "public_key": "VzqZ...", "value": "base64..." }
}`}
              </Code>
              <P>
                Raw input/output are <span className="text-tx">never stored</span> — only SHA-256 hashes.
                With E2E encryption enabled, even hashes are encrypted (AES-256-GCM) before transmission.
              </P>
            </TBox>
          )}

          {active === 'quickstart' && (
            <TBox title="QUICK START" color="#60a5fa">
              <H2>Installation</H2>
              <CopyInstall command="npm install @openclawscan/sdk" />

              <H2>1. Generate keys</H2>
              <P>Run this once when setting up your agent. Save the secret key securely.</P>
              <Code>{
`import { generateKeyPair, serializeKeyPair } from '@openclawscan/sdk';

const keys = generateKeyPair();
const serialized = serializeKeyPair(keys);

console.log('Public key:', serialized.publicKey);
console.log('Secret key:', serialized.secretKey);
// ⚠ Save secretKey securely — it cannot be recovered`}
              </Code>

              <H2>2. Initialize the scanner</H2>
              <Code>{
`import { OpenClawScan } from '@openclawscan/sdk';

const scanner = new OpenClawScan({
  agentId: 'my-audit-agent',
  ownerId: 'github:myuser',
  secretKey: process.env.OCS_SECRET_KEY,
  apiKey: process.env.OCS_API_KEY,    // from dashboard
});`}
              </Code>

              <H2>3. Start a task and capture actions</H2>
              <Code>{
`// Start a task — all receipts grouped under one link
const task = await scanner.startTask({
  agent_id: 'my-audit-agent',
  name: 'Smart Contract Audit — TokenVault.sol',
});

// Capture each action — auto-hashed and signed
await scanner.capture({
  action: { type: 'tool_call', name: 'slither_scan', duration_ms: 8400 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 3840, tokens_out: 5560 },
  cost: { amount_usd: 0.072 },
  input: contractSource,     // → SHA-256 hashed, never stored raw
  output: scanResults,       // → SHA-256 hashed, never stored raw
});

// Complete the task
const completed = await scanner.completeTask();
console.log('Share link:', completed.share_url);`}
              </Code>

              <H2>4. Certify on-chain</H2>
              <P>
                After completing a task, certify it on Base L2. This builds a Merkle tree from all receipt
                hashes and anchors the root on-chain via ClawVerify.sol.
              </P>
              <Code>{
`// Certify via API
const res = await fetch('https://openclawscan.xyz/api/tasks/certify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.OCS_API_KEY,
  },
  body: JSON.stringify({ slug: task.slug }),
});

const cert = await res.json();
console.log('TX:', cert.tx_hash);
console.log('BaseScan:', cert.basescan_url);`}
              </Code>

              <H2>5. Share and verify</H2>
              <P>
                Your client visits <code className="text-accent">openclawscan.xyz/task/&#123;slug&#125;</code> and
                verifies all three levels in the browser: Ed25519 signature, E2E decryption + hash match,
                and Merkle proof against the on-chain root.
              </P>
              <div className="border border-accent/20 bg-accent/[.03] p-3 mt-3">
                <p className="text-[12px] text-accent">
                  ◈ See a live example: <a href="/task/5ce3974c" className="underline text-bright hover:text-accent transition-colors">openclawscan.xyz/task/5ce3974c</a> — 8 receipts, 3-level verified, certified on Base L2.
                </p>
              </div>
            </TBox>
          )}

          {active === 'api' && (
            <TBox title="API REFERENCE" color="#eab308">
              <H2>Authentication</H2>
              <P>
                All authenticated endpoints require a Bearer token. Get your API key from the
                {' '}<a href="/dashboard" className="text-accent hover:text-bright transition-colors">dashboard</a>.
              </P>
              <Code>{`Authorization: Bearer ocs_your_api_key_here`}</Code>

              <H2>Receipts</H2>
              <Endpoint method="POST" path="/api/receipts" desc="Submit a signed receipt. The server verifies the Ed25519 signature and timestamp before storing." />
              <Endpoint method="GET" path="/api/receipts/verify?id={receipt_id}" desc="Verify a receipt's signature, hash, and on-chain anchor status. Public — no auth required." />

              <H2>Tasks</H2>
              <Endpoint method="POST" path="/api/tasks" desc="Create a new task. Returns task_id and slug for grouping receipts." />
              <Endpoint method="GET" path="/api/tasks?slug={slug}" desc="Get task info including certification status." />
              <Endpoint method="POST" path="/api/tasks/certify" desc="Certify a completed task on Base L2. Builds Merkle tree, sends TX, stores proofs." />

              <H3>Certify request body</H3>
              <Code>{
`{
  "slug": "5ce3974c"    // task slug to certify
}`}
              </Code>

              <H3>Certify response</H3>
              <Code>{
`{
  "success": true,
  "tx_hash": "0x9112dc1a3d...",
  "basescan_url": "https://basescan.org/tx/0x9112dc...",
  "merkle_root": "0x489bb084...",
  "batch_id": 0,
  "block_number": 42654440,
  "receipts_certified": 8,
  "gas_used": 167234,
  "cost_usd": 0.001
}`}
              </Code>

              <H2>Public endpoints (no auth)</H2>
              <Endpoint method="GET" path="/api/public/task/{slug}" desc="Get public task data." />
              <Endpoint method="GET" path="/api/public/task/{slug}/receipts" desc="Get all receipts for a task, including anchor data and Merkle proofs." />

              <H2>Dashboard</H2>
              <Endpoint method="GET" path="/api/dashboard/stats" desc="Get owner stats (total receipts, agents, tasks)." />
              <Endpoint method="GET" path="/api/dashboard/tasks" desc="List all tasks with certification status." />
              <Endpoint method="GET" path="/api/dashboard/agents" desc="List all agents." />
              <Endpoint method="GET" path="/api/agents" desc="List/create agents (GET/POST)." />
            </TBox>
          )}

          {active === 'verification' && (
            <TBox title="VERIFICATION" color="#a78bfa">
              <H2>How verification works</H2>
              <P>
                Every receipt is verified at three independent levels. Each level proves something
                different, and each can be checked independently.
              </P>

              <H3>Level 1: Ed25519 Signature</H3>
              <P>
                The agent signs the receipt payload with its Ed25519 private key.
                The signature covers every field (action, model, cost, hashes, context, timestamp).
                Change one byte and the signature is invalid. Same cryptography as SSH and Signal.
              </P>
              <Code>{
`// Verify in code
import { OpenClawScan } from '@openclawscan/sdk';

const result = OpenClawScan.verify(receipt);
// { signatureValid: true, hashMatch: null }

// With original output data
const result2 = OpenClawScan.verify(receipt, originalOutput);
// { signatureValid: true, hashMatch: true }`}
              </Code>

              <H3>Level 2: E2E Encryption (AES-256-GCM)</H3>
              <P>
                Input/output hashes are encrypted with AES-256-GCM before being sent to the server.
                The viewing key is embedded in the URL fragment (<code className="text-tx">#key=...</code>),
                which is never sent to the server. The browser decrypts locally and verifies
                that the decrypted hashes match the SHA-256 of the original data.
              </P>
              <P>
                This means: even if someone compromises the server, they cannot read or modify
                the receipt data. The server stores only encrypted blobs.
              </P>

              <H3>Level 3: Merkle Proof on Base L2</H3>
              <P>
                When a task is certified, all receipt hashes are assembled into a Merkle tree.
                The root is stored on Base L2 via ClawVerify.sol. Each receipt gets a Merkle proof
                (an array of sibling hashes) that can be verified against the on-chain root.
              </P>
              <P>
                This is the ultimate guarantee: even if OpenClawScan disappears, anyone can
                verify a receipt against the immutable on-chain root. The proof exists independently
                of any server.
              </P>
              <Code>{
`// Merkle fingerprint per receipt
keccak256(receipt_id + ":" + input_sha256 + ":" + output_sha256)

// Tree construction
merkletreejs with keccak256, sortPairs: true

// On-chain verification
ClawVerify.verifyReceipt(batchId, leaf, proof) → bool`}
              </Code>

              <H3>Verification in the browser</H3>
              <P>
                When a client visits <code className="text-tx">/task/&#123;slug&#125;</code>, the browser
                automatically runs all three verification levels and displays the results.
                No server trust required — the cryptographic checks happen client-side.
              </P>
            </TBox>
          )}

          {active === 'encryption' && (
            <TBox title="E2E ENCRYPTION" color="#60a5fa">
              <H2>End-to-End Encryption (v1.1+)</H2>
              <P>
                OpenClawScan uses AES-256-GCM to encrypt receipt data end-to-end.
                The server never sees plaintext data — only encrypted blobs and hashes.
              </P>

              <H3>How it works</H3>
              <Code>{
`1. Agent captures an action (input, output)
2. SDK computes SHA-256 hashes of input and output
3. A random AES-256-GCM viewing key is generated per task
4. Hashes are encrypted with the viewing key
5. Encrypted blobs are sent to the server
6. Viewing key is embedded in the share URL fragment: #key=...
7. URL fragments are never sent to the server (RFC 3986)
8. Browser decrypts locally and verifies hashes`}
              </Code>

              <H3>Key properties</H3>
              <div className="space-y-2 mb-4">
                {[
                  ['Zero plaintext on server', 'Server stores encrypted blobs. Cannot read receipt data.'],
                  ['Key in URL fragment', 'Fragment (#key=...) is never transmitted to the server.'],
                  ['Per-task keys', 'Each task gets its own viewing key. Revoking one does not affect others.'],
                  ['Browser-only decryption', 'All decryption happens client-side via Web Crypto API.'],
                  ['Forward secrecy', 'If a viewing key leaks, only that task is compromised.'],
                ].map(([title, desc]) => (
                  <div key={title} className="border-l-2 border-c-blue pl-3">
                    <p className="text-[13px] font-bold text-bright">{title}</p>
                    <p className="text-[12px] text-dim">{desc}</p>
                  </div>
                ))}
              </div>

              <H3>Cipher details</H3>
              <Code>{
`Algorithm:  AES-256-GCM (NIST standard)
Key size:   256 bits (32 bytes)
IV:         96 bits (12 bytes, random per encryption)
Auth tag:   128 bits (included in ciphertext)
Encoding:   Base64 for storage and URL embedding
API:        Web Crypto API (SubtleCrypto)`}
              </Code>
            </TBox>
          )}

          {active === 'onchain' && (
            <TBox title="ON-CHAIN ANCHORING" color="#a78bfa">
              <H2>Base L2 Blockchain Anchoring (v1.2)</H2>
              <P>
                OpenClawScan anchors Merkle roots on Base L2 mainnet via ClawVerify.sol.
                This provides immutable, tamper-proof records that exist independently of
                any centralized server.
              </P>

              <H3>ClawVerify.sol</H3>
              <Code>{
`Contract: 0x095525d68481a84ffDD4740aaB07f425b84718D3
Chain:    Base L2 mainnet (chain ID 8453)
BaseScan: basescan.org/address/0x0955...18D3

Functions:
  certifyBatch(root, agent, slug, count)  // Store Merkle root
  verifyReceipt(batchId, leaf, proof)     // Verify membership
  getBatch(batchId) → BatchData           // Read batch data
  batchCount() → uint256                  // Total batches

Events:
  BatchCertified(batchId, root, agent, slug, count, timestamp)`}
              </Code>

              <H3>Merkle tree construction</H3>
              <P>When a task is certified:</P>
              <Code>{
`1. Fetch all receipts for the task
2. For each receipt, compute fingerprint:
     keccak256(receipt_id + ":" + input_sha256 + ":" + output_sha256)
3. Build Merkle tree (merkletreejs, keccak256, sortPairs: true)
4. Send certifyBatch(root, agent, slug, count) to Base L2
5. Store TX hash, block number, and Merkle proofs per receipt
6. Mark task as certified`}
              </Code>

              <H3>Verification</H3>
              <P>Anyone can verify a receipt against the on-chain root:</P>
              <Code>{
`// On-chain (gas-free view call)
ClawVerify.verifyReceipt(batchId, leaf, proof)

// Local (using merkletreejs)
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
tree.verify(proof, leaf, root)  // → true`}
              </Code>

              <H3>Cost</H3>
              <div className="border border-faint bg-bg p-3 mb-4">
                <pre className="text-[12px] leading-[1.8] text-dim">{
`Deploy contract:     ~500K gas   ~$0.05 (one-time)
certifyBatch():      ~167K gas   ~$0.001 per batch
verifyReceipt():     0 gas       free (view function)
getBatch():          0 gas       free (view function)`}
                </pre>
              </div>
              <P>
                One batch covers an entire task with all its receipts. At ~$0.001 per batch,
                on-chain certification is practically free.
              </P>

              <H3>Live data</H3>
              <div className="border border-accent/20 bg-accent/[.03] p-3">
                <p className="text-[12px] text-dim mb-2">
                  3 batches certified · 24 receipts on-chain · First block: 42654440
                </p>
                <a
                  href="https://basescan.org/address/0x095525d68481a84ffDD4740aaB07f425b84718D3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-accent hover:text-bright transition-colors"
                >
                  View on BaseScan ↗
                </a>
              </div>
            </TBox>
          )}
        </div>
      </div>
    </div>
  );
}

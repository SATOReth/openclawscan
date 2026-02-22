'use client';

import { useState } from 'react';
import { TBox } from '@/components/ui';

const sections = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'sdk', label: 'SDK' },
  { id: 'api', label: 'API' },
  { id: 'verify', label: 'Verification' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'selfhost', label: 'Self-host' },
];

function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div className="mb-4">
      {title && <p className="text-[9px] text-ghost tracking-widest mb-1">{title}</p>}
      <pre className="text-[11px] leading-[1.8] text-dim bg-bg border border-faint p-3 overflow-auto">{children}</pre>
    </div>
  );
}

function H2({ children }: { children: string }) {
  return <h2 className="text-[15px] font-bold text-bright mt-8 mb-3 tracking-tight">{children}</h2>;
}

function H3({ children }: { children: string }) {
  return <h3 className="text-[12px] font-bold text-tx mt-5 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-dim leading-[1.7] mb-3">{children}</p>;
}

export default function DocsPage() {
  const [active, setActive] = useState('quickstart');

  return (
    <div className="py-6 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8">
      {/* Sidebar */}
      <div className="md:sticky md:top-16 md:self-start">
        <p className="text-[9px] text-ghost tracking-widest mb-3">DOCUMENTATION</p>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`block w-full text-left py-1.5 text-[11px] transition-colors ${
              active === s.id ? 'text-accent font-bold' : 'text-dim hover:text-tx'
            }`}
          >
            {active === s.id && <span className="text-accent mr-1">›</span>}
            {s.label}
          </button>
        ))}
        <div className="mt-6 pt-4 border-t border-faint">
          <p className="text-[9px] text-ghost tracking-widest mb-2">VERSION</p>
          <p className="text-[11px] text-tx">v1.0.0</p>
          <p className="text-[9px] text-ghost mt-3 leading-relaxed">
            MIT Licensed<br />
            <a href="https://github.com" className="text-accent hover:underline">GitHub →</a>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0">
        {active === 'quickstart' && (
          <div>
            <h1 className="text-xl font-bold text-bright mb-2">Quickstart</h1>
            <P>Get OpenClawScan running in 5 minutes. Generate signed receipts for every AI agent action.</P>

            <H2>1. Install</H2>
            <Code title="TERMINAL">{`$ npm install @openclawscan/sdk`}</Code>

            <H2>2. Generate keypair</H2>
            <P>Every agent needs an Ed25519 keypair. The public key is registered with the server; the private key stays on your machine.</P>
            <Code title="generate-keys.ts">{`import { generateKeyPair, serializeKeyPair } from '@openclawscan/sdk'

const keys = generateKeyPair()
const serialized = serializeKeyPair(keys)

console.log('Public key:', serialized.publicKey)
console.log('Secret key:', serialized.secretKey)
// Save secretKey securely — you'll need it to sign receipts`}</Code>

            <H2>3. Register your agent</H2>
            <P>Register via the <span className="text-tx">dashboard</span> or the API:</P>
            <Code title="TERMINAL">{`$ curl -X POST https://openclawscan.xyz/api/agents \\
  -H "Authorization: Bearer ocs_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "my-audit-agent",
    "display_name": "Audit Agent",
    "public_key": "VzqZUrs/ZPyw+..."
  }'`}</Code>

            <H2>4. Capture actions</H2>
            <Code title="my-agent.ts">{`import { OpenClawScan } from '@openclawscan/sdk'

const scanner = new OpenClawScan({
  agentId: 'my-audit-agent',
  ownerId: 'github:myuser',
  secretKey: 'your-base64-secret-key',
  apiKey: 'ocs_your_api_key',
  apiUrl: 'https://openclawscan.xyz',
})

// Start a task (groups receipts together)
const task = await scanner.startTask({
  agent_id: 'my-audit-agent',
  name: 'Audit TokenVault.sol',
})

// Capture an action — auto-hashed and signed
await scanner.capture({
  action: { type: 'tool_call', name: 'slither_scan', duration_ms: 8400 },
  model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 3840, tokens_out: 5560 },
  cost: { amount_usd: 0.072 },
  input: contractSource,  // → SHA-256 hash (raw data stays local)
  output: scanResults,    // → SHA-256 hash
})

// Complete the task — get shareable link
const result = await scanner.completeTask()
console.log(result.share_url)
// → https://openclawscan.xyz/task/a3f8c2b1`}</Code>

            <H2>5. Share & verify</H2>
            <P>
              Your client opens the link. Every action, timestamp, cost, and signature is independently
              verifiable in the browser. No account needed to verify.
            </P>

            <TBox title="WHAT HAPPENS UNDER THE HOOD" color="#333">
              <div className="text-[10.5px] text-dim leading-relaxed space-y-1">
                <p><span className="text-accent">1.</span> SDK hashes input and output with SHA-256 (raw data stays local)</p>
                <p><span className="text-accent">2.</span> SDK builds receipt payload (action, model, cost, hashes, timestamp)</p>
                <p><span className="text-accent">3.</span> SDK signs the payload with your Ed25519 private key</p>
                <p><span className="text-accent">4.</span> Receipt saved to <span className="text-tx">~/.openclawscan/</span> (local backup)</p>
                <p><span className="text-accent">5.</span> Receipt sent to server (server adds independent timestamp)</p>
                <p><span className="text-accent">6.</span> Server verifies signature + checks time drift (&lt;5min)</p>
                <p><span className="text-accent">7.</span> Receipt stored in database (hashes only, no raw data)</p>
              </div>
            </TBox>
          </div>
        )}

        {active === 'sdk' && (
          <div>
            <h1 className="text-xl font-bold text-bright mb-2">SDK Reference</h1>
            <P>The <span className="text-tx">@openclawscan/sdk</span> package provides everything needed to generate and verify signed receipts.</P>

            <H2>OpenClawScan</H2>
            <P>Main class. Initialize once, use for all captures.</P>
            <Code title="CONSTRUCTOR">{`new OpenClawScan({
  agentId: string,          // Your agent identifier
  ownerId: string,          // Owner identifier (e.g. "github:user")
  secretKey: string,        // Ed25519 secret key (base64)
  apiKey?: string,          // API key for server submission
  apiUrl?: string,          // Server URL (default: https://openclawscan.xyz)
  autoCapture?: boolean,    // Auto-capture mode (default: false)
  defaultVisibility?: 'private' | 'task_only' | 'public',
  localBackupPath?: string, // Local backup dir (default: ~/.openclawscan/)
  onReceipt?: (receipt) => void,  // Callback on each receipt
})`}</Code>

            <H3>capture(input)</H3>
            <P>Generate a signed receipt and submit to server. Returns <span className="text-tx">Promise&lt;SignedReceipt&gt;</span>.</P>
            <Code>{`await scanner.capture({
  action: {
    type: 'tool_call' | 'file_write' | 'file_read' | 'api_request' |
          'message_send' | 'skill_exec' | 'code_exec' | 'web_search' | 'model_call',
    name: string,           // Action name (e.g. "slither_scan")
    duration_ms: number,    // Execution time in ms
  },
  model: {
    provider: string,       // "anthropic", "openai", etc.
    name: string,           // "claude-sonnet-4-5", "gpt-4o", etc.
    tokens_in: number,
    tokens_out: number,
  },
  cost: {
    amount_usd: number,
    was_routed?: boolean,   // If model was auto-routed
  },
  input: string,            // Raw input → will be SHA-256 hashed
  output: string,           // Raw output → will be SHA-256 hashed
  task_id?: string,         // Optional (auto-set if startTask active)
})`}</Code>

            <H3>captureSync(input)</H3>
            <P>Same as capture but synchronous — no server submission. Saves locally only.</P>

            <H3>startTask(task) / completeTask()</H3>
            <Code>{`const task = await scanner.startTask({
  agent_id: 'my-agent',
  name: 'Task description',
})
// ... capture actions ...
const result = await scanner.completeTask()
// result.share_url → public link`}</Code>

            <H3>OpenClawScan.verify(receipt, originalOutput?)</H3>
            <P>Static method — verify any receipt without server or API key.</P>
            <Code>{`const result = OpenClawScan.verify(receipt)
// { signatureValid: true, hashMatch: null }

const result = OpenClawScan.verify(receipt, 'original output text')
// { signatureValid: true, hashMatch: true }`}</Code>

            <H2>Crypto utilities</H2>
            <Code>{`import {
  generateKeyPair,     // → { publicKey, secretKey } (Uint8Array)
  serializeKeyPair,    // → { publicKey, secretKey } (base64 strings)
  deserializeKeyPair,  // base64 → Uint8Array
  sha256,              // string → 64-char hex hash
  verifySignature,     // verify Ed25519 signature
} from '@openclawscan/sdk'`}</Code>
          </div>
        )}

        {active === 'api' && (
          <div>
            <h1 className="text-xl font-bold text-bright mb-2">API Reference</h1>
            <P>All authenticated endpoints require <span className="text-tx">Authorization: Bearer ocs_your_key</span></P>

            <H2>POST /api/agents</H2>
            <P>Register a new agent.</P>
            <Code>{`{
  "agent_id": "my-agent",
  "display_name": "My Agent",
  "public_key": "base64-ed25519-public-key",
  "description": "Optional description"
}`}</Code>

            <H2>POST /api/receipts</H2>
            <P>Submit a signed receipt. Server verifies signature, checks time drift, stores receipt.</P>
            <Code>{`// Full SignedReceipt object from SDK
// Server returns:
{
  "receipt_id": "rcpt_xxxxxxxxxxxx",
  "explorer_url": "https://openclawscan.xyz/receipt/rcpt_xxx",
  "server_received_at": "2026-02-21T14:31:15Z"
}`}</Code>
            <P>Error responses: <span className="text-c-red">403</span> invalid signature · <span className="text-c-red">400</span> time drift &gt;5min · <span className="text-c-red">409</span> duplicate · <span className="text-c-red">429</span> limit reached</P>

            <H2>POST /api/tasks</H2>
            <P>Create a new task. Returns slug for sharing.</P>
            <Code>{`{ "agent_id": "my-agent", "name": "Task name" }
// Returns: { task_id, slug, share_url, status }`}</Code>

            <H2>PATCH /api/tasks</H2>
            <P>Complete or fail a task.</P>
            <Code>{`{ "task_id": "uuid", "status": "completed" | "failed" }`}</Code>

            <H2>GET /api/receipts/verify</H2>
            <P>Public — no auth required. Verify any receipt.</P>
            <Code>{`GET /api/receipts/verify?receipt_id=rcpt_xxxxxxxxxxxx

// Returns: { verified, details, receipt, agent }`}</Code>

            <H2>Rate limits</H2>
            <P>OpenClawScan is completely free with no receipt limits. API keys are used for authentication, not gating.</P>
          </div>
        )}

        {active === 'verify' && (
          <div>
            <h1 className="text-xl font-bold text-bright mb-2">Verification</h1>
            <P>Anyone can verify a receipt — no account, API key, or server trust needed.</P>

            <H2>How verification works</H2>
            <TBox title="VERIFICATION STEPS" color="#22c55e">
              <div className="text-[10.5px] text-dim leading-relaxed space-y-1">
                <p><span className="text-accent">1.</span> Extract the payload (everything except signature)</p>
                <p><span className="text-accent">2.</span> Serialize payload to canonical JSON</p>
                <p><span className="text-accent">3.</span> Verify Ed25519 signature against payload + public key</p>
                <p><span className="text-accent">4.</span> Check: public key matches registered agent</p>
                <p><span className="text-accent">5.</span> Check: timestamp drift &lt; 5 minutes</p>
                <p><span className="text-accent">6.</span> Check: sequence numbers have no gaps</p>
              </div>
            </TBox>

            <H2>Client-side verification</H2>
            <Code>{`import { OpenClawScan } from '@openclawscan/sdk'

// Verify signature (no server needed)
const result = OpenClawScan.verify(receipt)
console.log(result.signatureValid) // true

// Verify output hash (if you have the original output)
const result = OpenClawScan.verify(receipt, originalOutput)
console.log(result.hashMatch) // true`}</Code>

            <H2>Browser verification</H2>
            <P>Visit <span className="text-tx">openclawscan.xyz/receipt/[receipt_id]</span> — signatures are verified client-side in the browser. The server only provides the data; verification is independent.</P>

            <H2>What can go wrong</H2>
            <TBox title="TAMPER DETECTION" color="#ef4444">
              <div className="text-[10.5px] text-dim space-y-2">
                <p><span className="text-c-red font-bold">Modified receipt →</span> Signature becomes invalid. Ed25519 signatures cover the entire payload — change one byte and verification fails.</p>
                <p><span className="text-c-red font-bold">Deleted receipt →</span> Sequence gap visible. If #1, #2, #4, #5 exist but #3 is missing — that gap is immediately obvious.</p>
                <p><span className="text-c-red font-bold">Backdated receipt →</span> Server timestamp doesn't match. Agent and server timestamps are compared — drift &gt;5min is flagged.</p>
                <p><span className="text-c-red font-bold">Forged receipt →</span> Wrong private key. Signature won't match the registered public key.</p>
              </div>
            </TBox>
          </div>
        )}

        {active === 'privacy' && (
          <div>
            <h1 className="text-xl font-bold text-bright mb-2">Privacy model</h1>
            <P>OpenClawScan is designed with a privacy-first architecture. Raw data never leaves your machine.</P>

            <H2>What is stored remotely</H2>
            <Code>{`receipt_id      ✓ stored   (identifier)
timestamp       ✓ stored   (when it happened)
action type     ✓ stored   (what kind of action)
action name     ✓ stored   (what was called)
model info      ✓ stored   (which model, token counts)
cost            ✓ stored   (how much it cost)
input           ✗ HASHED   (SHA-256, irreversible)
output          ✗ HASHED   (SHA-256, irreversible)
signature       ✓ stored   (Ed25519, for verification)`}</Code>

            <H2>What stays local</H2>
            <P>Every receipt is saved to <span className="text-tx">~/.openclawscan/receipts/</span> before transmission. Your local copy contains the full receipt (still with hashed I/O). The raw input/output text is never written anywhere by the SDK — it exists only in your application's memory during the <span className="text-tx">capture()</span> call.</P>

            <H2>Visibility levels</H2>
            <TBox title="VISIBILITY" color="#60a5fa">
              <div className="text-[10.5px] text-dim space-y-2">
                <p><span className="text-tx font-bold">private</span> — Only you can see this receipt (via dashboard with auth).</p>
                <p><span className="text-tx font-bold">task_only</span> — Anyone with the task URL can see this receipt.</p>
                <p><span className="text-tx font-bold">public</span> — Anyone can find and verify this receipt.</p>
              </div>
            </TBox>
          </div>
        )}

        {active === 'selfhost' && (
          <div>
            <h1 className="text-xl font-bold text-bright mb-2">Self-hosting</h1>
            <P>OpenClawScan is MIT licensed. You can run the entire stack on your own infrastructure.</P>

            <H2>Requirements</H2>
            <Code>{`Node.js >= 18
PostgreSQL (or Supabase)
Vercel / any Node.js host`}</Code>

            <H2>Setup</H2>
            <Code title="TERMINAL">{`$ git clone https://github.com/openclawscan/openclawscan.git
$ cd openclawscan
$ cp apps/web/.env.example apps/web/.env.local

# Edit .env.local with your Supabase credentials
$ nano apps/web/.env.local

# Run migrations
$ supabase db push

# Start dev server
$ npm run dev`}</Code>

            <H2>Environment variables</H2>
            <Code>{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com`}</Code>

            <H2>SDK pointing to self-hosted</H2>
            <Code>{`const scanner = new OpenClawScan({
  agentId: 'my-agent',
  ownerId: 'me',
  secretKey: '...',
  apiKey: 'ocs_...',
  apiUrl: 'https://your-domain.com',  // ← your instance
})`}</Code>
          </div>
        )}
      </div>
    </div>
  );
}

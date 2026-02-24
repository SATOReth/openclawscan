'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TBox, Stat, StatusBadge, Skeleton, Empty } from '@/components/ui';
import nacl from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';

// ── Types ───────────────────────────────────────────────────

type ResultType = 'receipt' | 'task' | null;

interface ReceiptResult {
  verified: boolean;
  details: {
    signature_valid: boolean;
    key_registered: boolean;
    time_drift_ms: number;
    time_drift_acceptable: boolean;
  };
  receipt: {
    receipt_id: string;
    timestamp: string;
    server_received_at: string;
    action: { type: string; name: string; duration_ms: number };
    model: { provider: string; name: string };
    cost_usd: number;
    hashes: { input: string; output: string };
  };
  agent: { id: string; name: string; public_key: string };
}

interface TaskResult {
  task_id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  total_receipts: number;
  total_duration_ms: number;
  total_cost_usd: number;
  total_tokens: number;
  agent: { id: string; name: string };
  owner: { name: string };
}

interface TaskReceipt {
  receipt_id: string;
  timestamp: string;
  action: { type: string; name: string; duration_ms: number };
  model: { provider: string; name: string; tokens_in: number; tokens_out: number };
  cost_usd: number;
  hashes: { input: string; output: string };
  sequence: number;
  signature: { algorithm: string; public_key: string; value: string };
  signed_payload: Record<string, unknown> | null;
}

// ── Client-side Ed25519 verification ────────────────────────

function deepSortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = deepSortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

function verifyReceiptClientSide(receipt: TaskReceipt): boolean {
  try {
    if (!receipt.signed_payload) return false;
    if (receipt.signature.algorithm !== 'ed25519') return false;
    const publicKey = decodeBase64(receipt.signature.public_key);
    const signatureBytes = decodeBase64(receipt.signature.value);
    const sorted = deepSortKeys(receipt.signed_payload);
    const json = JSON.stringify(sorted);
    const messageBytes = new TextEncoder().encode(json);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch {
    return false;
  }
}

// ── Utilities ───────────────────────────────────────────────

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function formatCost(usd: number) { return `$${usd.toFixed(3)}`; }

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return ts; }
}

function formatTimeShort(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return ts; }
}

// ── Component ───────────────────────────────────────────────

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="py-8"><Skeleton lines={6} /></div>}>
      <ScanPageInner />
    </Suspense>
  );
}

function ScanPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultType, setResultType] = useState<ResultType>(null);

  // Receipt state
  const [receiptData, setReceiptData] = useState<ReceiptResult | null>(null);
  const [receiptVerifying, setReceiptVerifying] = useState(true);

  // Task state
  const [taskData, setTaskData] = useState<TaskResult | null>(null);
  const [taskReceipts, setTaskReceipts] = useState<TaskReceipt[]>([]);
  const [taskVerification, setTaskVerification] = useState({
    total: 0, verified: 0, failed: 0, done: false,
    results: new Map<string, boolean>(),
  });

  // Auto-search if query param present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  function detectType(q: string): 'receipt' | 'task' {
    const trimmed = q.trim();
    if (trimmed.startsWith('rcpt_')) return 'receipt';
    // If it looks like a URL, extract the ID
    if (trimmed.includes('/receipt/')) return 'receipt';
    if (trimmed.includes('/task/')) return 'task';
    // Default: try as task slug first, then receipt
    return 'task';
  }

  function extractId(q: string): string {
    const trimmed = q.trim();
    // Extract from full URL
    const receiptMatch = trimmed.match(/\/receipt\/([^\s/?#]+)/);
    if (receiptMatch) return receiptMatch[1];
    const taskMatch = trimmed.match(/\/task\/([^\s/?#]+)/);
    if (taskMatch) return taskMatch[1];
    // Return as-is
    return trimmed;
  }

  async function doSearch(q: string) {
    const id = extractId(q);
    if (!id) return;

    setLoading(true);
    setError('');
    setResultType(null);
    setReceiptData(null);
    setTaskData(null);
    setTaskReceipts([]);
    setTaskVerification({ total: 0, verified: 0, failed: 0, done: false, results: new Map() });

    // Update URL without reload
    router.replace(`/scan?q=${encodeURIComponent(id)}`, { scroll: false });

    const type = detectType(q);

    if (type === 'receipt') {
      await searchReceipt(id);
    } else {
      // Try task first, fall back to receipt
      const taskFound = await searchTask(id);
      if (!taskFound) {
        await searchReceipt(id);
      }
    }

    setLoading(false);
  }

  async function searchReceipt(id: string) {
    try {
      const res = await fetch(`/api/receipts/verify?receipt_id=${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Receipt not found');
        return;
      }
      const data = await res.json();
      setReceiptData(data);
      setResultType('receipt');
      setReceiptVerifying(true);
      setTimeout(() => setReceiptVerifying(false), 1200);
    } catch {
      setError('Failed to verify receipt');
    }
  }

  async function searchTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/public/task/${id}`);
      if (!res.ok) return false;

      const taskInfo = await res.json();
      setTaskData(taskInfo);
      setResultType('task');

      // Fetch receipts
      const receiptsRes = await fetch(`/api/public/task/${id}/receipts`);
      if (receiptsRes.ok) {
        const receiptsInfo = await receiptsRes.json();
        const rcpts: TaskReceipt[] = receiptsInfo.receipts || [];
        setTaskReceipts(rcpts);

        // Client-side verification
        if (rcpts.length > 0) {
          const results = new Map<string, boolean>();
          let verified = 0;
          let failed = 0;
          for (const r of rcpts) {
            const valid = verifyReceiptClientSide(r);
            results.set(r.receipt_id, valid);
            if (valid) verified++; else failed++;
            setTaskVerification({
              total: rcpts.length, verified, failed,
              done: verified + failed === rcpts.length,
              results: new Map(results),
            });
            if (rcpts.length > 20) await new Promise(r => setTimeout(r, 0));
          }
        } else {
          setTaskVerification({ total: 0, verified: 0, failed: 0, done: true, results: new Map() });
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) doSearch(query);
  }

  // ── Receipt Result ────────────────────────────────────────

  function renderReceiptResult() {
    if (!receiptData) return null;
    const r = receiptData.receipt;
    const d = receiptData.details;
    const ok = !receiptVerifying && receiptData.verified;

    const checks: [string, string, boolean | null][] = [
      ['Signature', receiptVerifying ? 'verifying…' : d.signature_valid ? 'valid (Ed25519)' : 'INVALID', receiptVerifying ? null : d.signature_valid],
      ['Key match', receiptVerifying ? 'verifying…' : d.key_registered ? 'registered agent' : 'MISMATCH', receiptVerifying ? null : d.key_registered],
      ['Time drift', `${d.time_drift_ms.toLocaleString()}ms`, d.time_drift_acceptable],
      ['Tampering', receiptVerifying ? 'verifying…' : ok ? 'none detected' : 'POSSIBLE', receiptVerifying ? null : ok],
    ];

    return (
      <div className="mt-6">
        {/* Status bar */}
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge ok={ok} loading={receiptVerifying} />
          <span className="text-[10px] text-ghost">{r.receipt_id}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Verification checks */}
          <TBox title="VERIFICATION" color={ok ? '#22c55e' : receiptVerifying ? '#666' : '#ef4444'}>
            {checks.map(([k, v, good], i) => (
              <div key={k} className={`flex justify-between py-2 ${i < checks.length - 1 ? 'border-b border-faint' : ''} text-[11px]`}>
                <span className="text-dim">{k}</span>
                <span className={`transition-colors ${good === null ? 'text-ghost' : good ? 'text-accent' : 'text-red-400'}`}>
                  {good === true ? '✓ ' : good === false ? '✗ ' : ''}{v}
                </span>
              </div>
            ))}
          </TBox>

          {/* Action details */}
          <div>
            <div className="grid grid-cols-2 gap-px bg-faint mb-4">
              <Stat label="ACTION" value={r.action.type} sub={r.action.name} />
              <Stat label="DURATION" value={formatDuration(r.action.duration_ms)} />
              <Stat label="MODEL" value={r.model.name} sub={r.model.provider} />
              <Stat label="COST" value={formatCost(r.cost_usd)} />
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <TBox title="TIMESTAMPS" color="#60a5fa">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
            <div>
              <span className="text-ghost text-[9px] tracking-widest">AGENT</span>
              <p className="text-tx mt-0.5">{formatTime(r.timestamp)}</p>
            </div>
            <div>
              <span className="text-ghost text-[9px] tracking-widest">SERVER</span>
              <p className="text-tx mt-0.5">{formatTime(r.server_received_at)}</p>
            </div>
            <div>
              <span className="text-ghost text-[9px] tracking-widest">DRIFT</span>
              <p className={`mt-0.5 ${d.time_drift_acceptable ? 'text-accent' : 'text-red-400'}`}>
                {d.time_drift_ms.toLocaleString()}ms {d.time_drift_acceptable ? '✓' : '⚠ >5min'}
              </p>
            </div>
          </div>
        </TBox>

        {/* Hashes + Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TBox title="SHA-256 HASHES" color="#a78bfa">
            <div className="mb-2.5">
              <p className="text-[8px] text-ghost tracking-widest mb-0.5">INPUT</p>
              <p className="text-[10px] text-dim break-all leading-snug font-mono">{r.hashes.input}</p>
            </div>
            <div>
              <p className="text-[8px] text-ghost tracking-widest mb-0.5">OUTPUT</p>
              <p className="text-[10px] text-dim break-all leading-snug font-mono">{r.hashes.output}</p>
            </div>
          </TBox>

          <TBox title="AGENT IDENTITY" color="#eab308">
            <div className="mb-3">
              <p className="text-[8px] text-ghost tracking-widest mb-0.5">NAME</p>
              <p className="text-[13px] text-tx font-semibold">{receiptData.agent.name}</p>
            </div>
            <div>
              <p className="text-[8px] text-ghost tracking-widest mb-0.5">PUBLIC KEY (Ed25519)</p>
              <p className="text-[10px] text-dim break-all font-mono">{receiptData.agent.public_key}</p>
            </div>
          </TBox>
        </div>
      </div>
    );
  }

  // ── Task Result ───────────────────────────────────────────

  function renderTaskResult() {
    if (!taskData) return null;

    const v = taskVerification;
    const allDone = v.done;
    const allValid = allDone && v.failed === 0 && v.total > 0;
    const hasFailures = v.failed > 0;

    return (
      <div className="mt-6">
        {/* Status bar */}
        <div className="flex items-center gap-3 mb-2">
          <StatusBadge ok={allValid} loading={!allDone} />
          <span className="text-[10px] text-ghost">task/{taskData.slug}</span>
        </div>

        <h2 className="text-[clamp(18px,2.2vw,24px)] font-bold text-bright tracking-tight mb-1">
          {taskData.name}
        </h2>
        <p className="text-[11px] text-dim mb-4">
          {taskData.description && <>{taskData.description} · </>}
          agent:<span className="text-tx">{taskData.agent.name}</span>
          {' · '}owner:{taskData.owner.name}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint mb-4">
          <Stat label="ACTIONS" value={String(taskData.total_receipts)} />
          <Stat label="DURATION" value={formatDuration(taskData.total_duration_ms)} />
          <Stat label="COST" value={formatCost(taskData.total_cost_usd)} />
          <Stat label="STATUS" value={taskData.status.toUpperCase()} color={taskData.status === 'completed' ? '#22c55e' : '#60a5fa'} />
        </div>

        {/* Receipts table */}
        {taskReceipts.length > 0 && (
          <TBox title="ACTION LOG" color="#22c55e" noPad>
            <div className="text-[10.5px] overflow-auto">
              <div className="grid gap-2 px-3.5 py-2 border-b border-faint text-[9px] text-ghost tracking-wide"
                style={{ gridTemplateColumns: '24px 52px 78px 1fr 40px 48px 16px' }}>
                <span>#</span><span>TIME</span><span>TYPE</span><span>NAME</span>
                <span className="text-right">DUR</span><span className="text-right">COST</span><span></span>
              </div>
              {taskReceipts.map((r) => {
                const sigOk = v.results.get(r.receipt_id);
                const checked = sigOk !== undefined;
                return (
                  <div
                    key={r.receipt_id}
                    className="grid gap-2 px-3.5 py-2 items-center border-b border-faint/50 last:border-b-0 hover:bg-hl transition-colors"
                    style={{ gridTemplateColumns: '24px 52px 78px 1fr 40px 48px 16px' }}
                  >
                    <span className="text-ghost">{r.sequence}</span>
                    <span className="text-ghost">{formatTimeShort(r.timestamp).slice(0, 8)}</span>
                    <span className="text-dim">{r.action.type}</span>
                    <span className="text-tx font-medium truncate">{r.action.name}</span>
                    <span className="text-ghost text-right">{formatDuration(r.action.duration_ms)}</span>
                    <span className="text-dim text-right">{formatCost(r.cost_usd)}</span>
                    <span className={`text-right transition-colors ${
                      !checked ? 'text-ghost' : sigOk ? 'text-accent' : 'text-red-500'
                    }`}>
                      {!checked ? '·' : sigOk ? '✓' : '✗'}
                    </span>
                  </div>
                );
              })}
            </div>
          </TBox>
        )}

        {/* Verification summary */}
        <div
          className="flex items-center gap-2 px-3.5 py-3 border transition-all mb-4"
          style={{
            borderColor: allValid ? '#22c55e33' : hasFailures ? '#ef444433' : '#22222233',
            background: allValid ? '#22c55e06' : hasFailures ? '#ef444406' : 'transparent',
          }}
        >
          <span className="w-1.5 h-1.5 transition-all" style={{
            background: allValid ? '#22c55e' : hasFailures ? '#ef4444' : '#333',
            boxShadow: allValid ? '0 0 6px #22c55e55' : hasFailures ? '0 0 6px #ef444455' : 'none',
          }} />
          <span className={`text-[11px] transition-colors ${
            allValid ? 'text-accent' : hasFailures ? 'text-red-400' : 'text-dim'
          }`}>
            {!allDone
              ? `verifying signatures… ${v.verified + v.failed}/${v.total}`
              : hasFailures
                ? `⚠ ${v.failed}/${v.total} signatures FAILED`
                : v.total === 0
                  ? 'No receipts to verify'
                  : `${v.verified}/${v.total} signatures valid (Ed25519, client-verified)`
            }
          </span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-accent text-2xl block mb-2">◈</span>
        <h1 className="text-xl font-bold text-bright mb-1">Scan &amp; Verify</h1>
        <p className="text-[12px] text-dim max-w-[460px] mx-auto leading-relaxed">
          Paste a receipt ID, task slug, or full link. Signatures are verified
          client-side using Ed25519 — no login required, no trust required.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="max-w-[600px] mx-auto mb-2">
        <div className="flex gap-0">
          <div className="flex items-center gap-2 flex-1 bg-card border border-faint px-3.5">
            <span className="text-accent text-[12px]">◈</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="rcpt_abc123  or  task-slug  or  full URL…"
              className="flex-1 bg-transparent py-3 text-[12px] text-tx outline-none placeholder:text-ghost/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 bg-accent text-black text-[11px] font-bold disabled:opacity-30 transition-opacity"
          >
            {loading ? 'SCANNING…' : 'SCAN'}
          </button>
        </div>
      </form>

      {/* Help text */}
      <div className="max-w-[600px] mx-auto mb-6">
        <p className="text-[10px] text-ghost text-center">
          Accepts: <span className="text-dim">rcpt_xxxxxxxxx</span>
          {' · '}<span className="text-dim">task-slug</span>
          {' · '}<span className="text-dim">openclawscan.xyz/task/...</span>
          {' · '}<span className="text-dim">openclawscan.xyz/receipt/...</span>
        </p>
      </div>

      {/* Loading */}
      {loading && <Skeleton lines={6} />}

      {/* Error */}
      {error && !loading && (
        <div className="max-w-[600px] mx-auto">
          <TBox title="NOT FOUND" color="#ef4444">
            <div className="text-center py-6">
              <span className="text-2xl text-ghost block mb-3">✗</span>
              <p className="text-[12px] text-bright mb-1">{error}</p>
              <p className="text-[10px] text-dim">
                Check the ID or slug and try again. Only public and task-visible receipts can be verified.
              </p>
            </div>
          </TBox>
        </div>
      )}

      {/* Results */}
      {resultType === 'receipt' && renderReceiptResult()}
      {resultType === 'task' && renderTaskResult()}

      {/* Empty state */}
      {!loading && !error && !resultType && (
        <div className="max-w-[500px] mx-auto mt-8">
          <TBox title="HOW IT WORKS" color="#333">
            {[
              ['01', 'Agent performs an action', 'The AI agent calls a tool, queries an LLM, or writes a file.'],
              ['02', 'SDK creates a signed receipt', 'Input/output are SHA-256 hashed. The receipt is signed with Ed25519.'],
              ['03', 'Anyone can verify', 'Paste the receipt ID here. Signatures are checked in your browser — trustlessly.'],
            ].map(([n, title, desc], i) => (
              <div key={n} className={`py-3 ${i < 2 ? 'border-b border-faint' : ''}`}>
                <div className="flex gap-2 items-center mb-1">
                  <span className="text-[10px] text-accent font-bold">{n}</span>
                  <span className="text-[12px] font-bold text-bright">{title}</span>
                </div>
                <p className="text-[11px] text-dim leading-relaxed pl-6">{desc}</p>
              </div>
            ))}
          </TBox>
        </div>
      )}
    </div>
  );
}

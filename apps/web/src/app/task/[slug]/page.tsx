'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TBox, Stat, StatusBadge, BackBtn, Skeleton, Empty } from '@/components/ui';
import nacl from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';
import {
  extractViewingKey,
  verifyKeyHash,
  decryptAndVerify,
  decryptReceiptField,
  detectEncryptionLevel,
  type DecryptedReceiptField,
} from '@/lib/e2e-decrypt';

interface Receipt {
  receipt_id: string;
  timestamp: string;
  server_received_at: string;
  action: { type: string; name: string; duration_ms: number };
  model: { provider: string; name: string; tokens_in: number; tokens_out: number };
  cost_usd: number;
  hashes: { input: string; output: string };
  sequence: number;
  signature: { algorithm: string; public_key: string; value: string };
  signed_payload: Record<string, unknown> | null;
  // v1.1: E2E encrypted fields
  encrypted_input: string | null;
  encrypted_output: string | null;
}

interface TaskData {
  task_id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  total_receipts: number;
  total_duration_ms: number;
  total_cost_usd: number;
  total_tokens: number;
  // v1.1: E2E fields
  key_hash: string | null;
  encrypted_summary: string | null;
  agent: { id: string; name: string };
  owner: { name: string };
}

interface VerificationResult {
  total: number;
  verified: number;
  failed: number;
  done: boolean;
  results: Map<string, boolean>;
}

// v1.1: Decrypted content cache
interface DecryptedContent {
  input: DecryptedReceiptField | null;
  output: DecryptedReceiptField | null;
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

function verifyReceiptClientSide(receipt: Receipt): boolean {
  try {
    if (!receipt.signed_payload) return false;
    if (receipt.signature.algorithm !== 'ed25519') return false;

    const publicKey = decodeBase64(receipt.signature.public_key);
    const signatureBytes = decodeBase64(receipt.signature.value);

    const sorted = deepSortKeys(receipt.signed_payload);
    const json = JSON.stringify(sorted);
    const messageBytes = new TextEncoder().encode(json);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch (e) {
    console.error('[OCS] Verification error for', receipt.receipt_id, e);
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

function formatTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ts; }
}

// ── Component ───────────────────────────────────────────────

export default function TaskPage() {
  const { slug } = useParams<{ slug: string }>();
  const [task, setTask] = useState<TaskData | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationResult>({
    total: 0, verified: 0, failed: 0, done: false, results: new Map(),
  });
  const [error, setError] = useState('');

  // v1.1: E2E decryption state
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const [keyValid, setKeyValid] = useState<boolean | null>(null); // null = not checked
  const [decryptedMap, setDecryptedMap] = useState<Map<string, DecryptedContent>>(new Map());
  const [decryptedSummary, setDecryptedSummary] = useState<string | null>(null);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [decryptionDone, setDecryptionDone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, receiptsRes] = await Promise.all([
          fetch(`/api/public/task/${slug}`),
          fetch(`/api/public/task/${slug}/receipts`),
        ]);

        if (!taskRes.ok) {
          setError('Task not found');
          setLoading(false);
          return;
        }

        const taskData: TaskData = await taskRes.json();
        const receiptsData = await receiptsRes.json();
        const rcpts: Receipt[] = receiptsData.receipts || [];

        setTask(taskData);
        setReceipts(rcpts);
        setLoading(false);

        // ── Ed25519 signature verification ──
        if (rcpts.length > 0) {
          const results = new Map<string, boolean>();
          let verified = 0;
          let failed = 0;

          for (const r of rcpts) {
            const valid = verifyReceiptClientSide(r);
            results.set(r.receipt_id, valid);
            if (valid) verified++;
            else failed++;

            setVerification({
              total: rcpts.length,
              verified,
              failed,
              done: verified + failed === rcpts.length,
              results: new Map(results),
            });

            if (rcpts.length > 20) {
              await new Promise(r => setTimeout(r, 0));
            }
          }
        } else {
          setVerification({ total: 0, verified: 0, failed: 0, done: true, results: new Map() });
        }

        // ── v1.1: E2E Decryption ──
        const key = extractViewingKey();
        if (key && taskData.key_hash) {
          setViewingKey(key);
          const isValid = await verifyKeyHash(key, taskData.key_hash);
          setKeyValid(isValid);

          if (isValid) {
            // Decrypt all receipts
            const dMap = new Map<string, DecryptedContent>();
            for (const r of rcpts) {
              const content: DecryptedContent = { input: null, output: null };
              try {
                if (r.encrypted_input) {
                  content.input = await decryptAndVerify(r.encrypted_input, key, r.hashes.input);
                }
                if (r.encrypted_output) {
                  content.output = await decryptAndVerify(r.encrypted_output, key, r.hashes.output);
                }
              } catch (e) {
                console.error('[OCS] Decryption error for', r.receipt_id, e);
              }
              dMap.set(r.receipt_id, content);
            }
            setDecryptedMap(dMap);

            // Decrypt task summary
            if (taskData.encrypted_summary) {
              try {
                const summary = await decryptReceiptField(taskData.encrypted_summary, key);
                setDecryptedSummary(summary);
              } catch (e) {
                console.error('[OCS] Summary decryption error', e);
              }
            }
          }
          setDecryptionDone(true);
        } else {
          setDecryptionDone(true);
        }
      } catch {
        setError('Failed to load task');
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Check for sequence gaps
  function checkGaps(receipts: Receipt[]): string | null {
    for (let i = 0; i < receipts.length; i++) {
      if (receipts[i].sequence !== i) {
        return `Gap detected: missing sequence #${i}`;
      }
    }
    return null;
  }

  // v1.1: Check if this is an encrypted task
  const isEncryptedTask = task?.key_hash !== null && task?.key_hash !== undefined;
  const hasEncryptedReceipts = receipts.some(r => r.encrypted_input || r.encrypted_output);

  if (loading) {
    return <div className="py-8"><Skeleton lines={8} /></div>;
  }

  if (error || !task) {
    return <div className="py-8"><Empty icon="✗" title="Task not found" description={error || `No task with slug "${slug}"`} /></div>;
  }

  const gaps = checkGaps(receipts);
  const allDone = verification.done;
  const allValid = allDone && verification.failed === 0 && verification.total > 0;
  const hasFailures = verification.failed > 0;

  return (
    <div>
      <BackBtn href="/" label="← HOME" />

      {/* ── Header ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge ok={allValid && !gaps} loading={!allDone} />
            <span className="text-[9px] text-ghost">task/{slug}</span>
            {/* v1.1: E2E encryption badge */}
            {isEncryptedTask && (
              <span className={`text-[9px] px-1.5 py-0.5 border ${
                keyValid
                  ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5'
                  : 'text-amber-400 border-amber-400/30 bg-amber-400/5'
              }`}>
                {keyValid ? '🔓 E2E DECRYPTED' : '🔒 ENCRYPTED'}
              </span>
            )}
            <button
              onClick={() => window.open(`/api/tasks/${task.task_id}/pdf`, '_blank')}
              className="ml-auto text-[9px] text-dim border border-faint px-2 py-0.5 hover:border-ghost hover:text-tx transition-colors"
              title="Download PDF audit report"
            >
              ↓ PDF
            </button>
          </div>
          <h1 className="text-[clamp(20px,2.5vw,28px)] font-bold text-bright tracking-tight mb-1">
            {task.name}
          </h1>
          <p className="text-[12px] text-dim">
            {task.description && <>{task.description} · </>}
            agent:<span className="text-tx">{task.agent.name}</span>
            {' · '}owner:{task.owner.name}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-faint">
          <Stat label="ACTIONS" value={String(task.total_receipts)} />
          <Stat label="DURATION" value={formatDuration(task.total_duration_ms)} />
          <Stat label="COST" value={formatCost(task.total_cost_usd)} />
          <Stat label="TOKENS" value={formatTokens(task.total_tokens)} />
        </div>
      </div>

      {/* v1.1: Decrypted summary */}
      {decryptedSummary && (
        <div className="mb-4 px-3.5 py-3 border border-emerald-400/20 bg-emerald-400/5">
          <span className="text-[9px] text-emerald-400/60 tracking-wide block mb-1">DECRYPTED SUMMARY</span>
          <p className="text-[12px] text-tx leading-relaxed">{decryptedSummary}</p>
        </div>
      )}

      {/* v1.1: Encryption notice (no key provided) */}
      {isEncryptedTask && !viewingKey && decryptionDone && (
        <div className="mb-4 px-3.5 py-3 border border-amber-400/20 bg-amber-400/5">
          <span className="text-[11px] text-amber-400">
            🔒 This task has E2E encrypted content. Add the viewing key to the URL to decrypt:
          </span>
          <pre className="text-[10px] text-dim mt-1 overflow-auto">
            {`${typeof window !== 'undefined' ? window.location.href : ''}#key=VIEWING_KEY`}
          </pre>
        </div>
      )}

      {/* v1.1: Wrong key warning */}
      {viewingKey && keyValid === false && decryptionDone && (
        <div className="mb-4 px-3.5 py-3 border border-red-400/20 bg-red-400/5">
          <span className="text-[11px] text-red-400">
            ✗ Viewing key does not match this task. Content cannot be decrypted.
          </span>
        </div>
      )}

      {/* ── Action Log ── */}
      {receipts.length === 0 ? (
        <TBox title="ACTION LOG" color="#22c55e">
          <Empty icon="◈" title="No receipts yet" description="This task has no public receipts." />
        </TBox>
      ) : (
        <TBox title="ACTION LOG" color="#22c55e" noPad>
          <div className="text-[10.5px] overflow-auto">
            {/* Header */}
            <div className="grid gap-2 px-3.5 py-2 border-b border-faint text-[9px] text-ghost tracking-wide"
              style={{ gridTemplateColumns: '24px 52px 78px 1fr 40px 48px 16px' }}>
              <span>#</span><span>TIME</span><span>TYPE</span><span>NAME</span>
              <span className="text-right">DUR</span><span className="text-right">COST</span><span></span>
            </div>
            {/* Rows */}
            {receipts.map((r) => {
              const sigOk = verification.results.get(r.receipt_id);
              const checked = sigOk !== undefined;
              const isExpanded = expandedReceipt === r.receipt_id;
              const decrypted = decryptedMap.get(r.receipt_id);
              const hasDecrypted = decrypted && (decrypted.input || decrypted.output);
              const encLevel = detectEncryptionLevel(r);

              return (
                <div key={r.receipt_id} className="border-b border-faint/50 last:border-b-0">
                  {/* Main row */}
                  <div
                    onClick={() => {
                      if (hasDecrypted) {
                        setExpandedReceipt(isExpanded ? null : r.receipt_id);
                      } else {
                        window.location.href = `/receipt/${r.receipt_id}`;
                      }
                    }}
                    className={`grid gap-2 px-3.5 py-2 items-center hover:bg-hl transition-colors cursor-pointer ${
                      isExpanded ? 'bg-hl' : ''
                    }`}
                    style={{ gridTemplateColumns: '24px 52px 78px 1fr 40px 48px 16px' }}
                  >
                    <span className="text-ghost">{r.sequence}</span>
                    <span className="text-ghost">{formatTime(r.timestamp).slice(0, 8)}</span>
                    <span className="text-dim">{r.action.type}</span>
                    <span className="text-tx font-medium truncate flex items-center gap-1.5">
                      {r.action.name}
                      {hasDecrypted && (
                        <span className="text-[8px] text-emerald-400/50">{isExpanded ? '▾' : '▸'}</span>
                      )}
                    </span>
                    <span className="text-ghost text-right">{formatDuration(r.action.duration_ms)}</span>
                    <span className="text-dim text-right">{formatCost(r.cost_usd)}</span>
                    <span className={`text-right transition-colors ${
                      !checked ? 'text-ghost' : sigOk ? 'text-accent' : 'text-red-500'
                    }`}>
                      {!checked ? '·' : sigOk ? '✓' : '✗'}
                    </span>
                  </div>

                  {/* v1.1: Expanded decrypted content */}
                  {isExpanded && hasDecrypted && (
                    <div className="px-3.5 py-3 bg-[#0a0f0a] border-t border-faint/30">
                      {decrypted.input && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] text-ghost tracking-wide">INPUT</span>
                            {decrypted.input.hashMatch ? (
                              <span className="text-[8px] text-emerald-400">✓ hash verified</span>
                            ) : (
                              <span className="text-[8px] text-red-400">✗ hash mismatch</span>
                            )}
                          </div>
                          <pre className="text-[11px] text-dim leading-relaxed whitespace-pre-wrap break-all">
                            {decrypted.input.plaintext}
                          </pre>
                        </div>
                      )}
                      {decrypted.output && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] text-ghost tracking-wide">OUTPUT</span>
                            {decrypted.output.hashMatch ? (
                              <span className="text-[8px] text-emerald-400">✓ hash verified</span>
                            ) : (
                              <span className="text-[8px] text-red-400">✗ hash mismatch</span>
                            )}
                          </div>
                          <pre className="text-[11px] text-dim leading-relaxed whitespace-pre-wrap break-all">
                            {decrypted.output.plaintext}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TBox>
      )}

      {/* ── Verification status bar ── */}
      <div
        className="flex items-center gap-2 px-3.5 py-3 border transition-all mb-2"
        style={{
          borderColor: allValid ? '#22c55e33' : hasFailures ? '#ef444433' : '#22222233',
          background: allValid ? '#22c55e06' : hasFailures ? '#ef444406' : 'transparent',
        }}
      >
        <span
          className="w-1.5 h-1.5 transition-all"
          style={{
            background: allValid ? '#22c55e' : hasFailures ? '#ef4444' : '#333',
            boxShadow: allValid ? '0 0 6px #22c55e55' : hasFailures ? '0 0 6px #ef444455' : 'none',
          }}
        />
        <span className={`text-[11px] transition-colors ${
          allValid ? 'text-accent' : hasFailures ? 'text-red-400' : 'text-dim'
        }`}>
          {!allDone
            ? `verifying signatures… ${verification.verified + verification.failed}/${verification.total}`
            : hasFailures
              ? `⚠ ${verification.failed}/${verification.total} signatures FAILED — receipts may have been tampered with`
              : gaps
                ? `⚠ ${gaps} · ${verification.verified}/${verification.total} signatures valid (Ed25519)`
                : `seq #0→#${receipts.length - 1} · no gaps · ${verification.verified}/${verification.total} signatures valid (Ed25519, client-verified)`
          }
        </span>
      </div>

      {/* v1.1: E2E encryption status bar */}
      {hasEncryptedReceipts && decryptionDone && (
        <div
          className="flex items-center gap-2 px-3.5 py-3 border transition-all mb-6"
          style={{
            borderColor: keyValid ? '#22c55e33' : '#f59e0b33',
            background: keyValid ? '#22c55e06' : '#f59e0b06',
          }}
        >
          <span
            className="w-1.5 h-1.5"
            style={{
              background: keyValid ? '#22c55e' : '#f59e0b',
              boxShadow: keyValid ? '0 0 6px #22c55e55' : '0 0 6px #f59e0b55',
            }}
          />
          <span className={`text-[11px] ${keyValid ? 'text-accent' : 'text-amber-400'}`}>
            {keyValid
              ? `AES-256-GCM · ${decryptedMap.size} receipts decrypted · all hashes verified · zero plaintext on server`
              : viewingKey
                ? 'AES-256-GCM · wrong viewing key — content cannot be decrypted'
                : 'AES-256-GCM · encrypted content available — add #key=VIEWING_KEY to URL'
            }
          </span>
        </div>
      )}

      {/* Spacer if no E2E bar */}
      {!hasEncryptedReceipts && <div className="mb-6" />}
    </div>
  );
}

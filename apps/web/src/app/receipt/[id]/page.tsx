'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TBox, Stat, StatusBadge, BackBtn, Skeleton, Empty } from '@/components/ui';
import { ReceiptMerkleBadge } from '@/components/chain-badge';

interface VerifyResponse {
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
  // Phase 2: on-chain anchoring
  anchor: {
    chain: string | null;
    tx_hash: string | null;
    batch_id: string | null;
    anchored_at: string | null;
    merkle_proof: {
      proof: string[];
      leaf: string;
      index: number;
    } | null;
  } | null;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/receipts/verify?receipt_id=${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || 'Receipt not found');
          setLoading(false);
          return;
        }
        const json = await res.json();
        setData(json);
        setLoading(false);
        // Animate verification
        setTimeout(() => setVerifying(false), 1600);
      } catch {
        setError('Failed to verify receipt');
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="py-8"><Skeleton lines={10} /></div>;
  if (error || !data) {
    return <div className="py-8"><Empty icon="✗" title="Receipt not found" description={error} /></div>;
  }

  const r = data.receipt;
  const d = data.details;
  const ok = !verifying && data.verified;
  const anchor = data.anchor;
  const isAnchored = !!anchor?.tx_hash;

  const checks: [string, string, boolean][] = [
    ['Signature', verifying ? 'checking…' : d.signature_valid ? 'valid' : 'INVALID', !verifying && d.signature_valid],
    ['Algorithm', 'ed25519', true],
    ['Key match', verifying ? 'checking…' : d.key_registered ? 'confirmed' : 'MISMATCH', !verifying && d.key_registered],
    ['Time drift', `${d.time_drift_ms}ms`, d.time_drift_acceptable],
    ['Tampering', verifying ? 'checking…' : ok ? 'none' : 'DETECTED', !verifying && ok],
    ['On-chain', isAnchored ? `Batch #${anchor?.batch_id}` : 'not anchored', isAnchored],
  ];

  return (
    <div>
      <BackBtn href="/" label="← HOME" />

      {/* ── Header ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <StatusBadge ok={ok} loading={verifying} />
          {isAnchored && (
            <span className="text-[9px] px-1.5 py-0.5 border text-accent border-accent/30 bg-accent/5">
              ⛓ ON-CHAIN
            </span>
          )}
        </div>
        <h1 className="text-[clamp(20px,2.5vw,28px)] font-bold text-bright mt-2.5 mb-1">
          {r.action.name}
        </h1>
        <p className="text-[10px] text-ghost">{r.receipt_id} · agent:{data.agent.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Verification checks ── */}
        <TBox title="VERIFICATION" color={ok ? '#22c55e' : verifying ? '#666' : '#ef4444'}>
          {checks.map(([k, v, good], i) => (
            <div key={k} className={`flex justify-between py-2 ${i < checks.length - 1 ? 'border-b border-faint' : ''} text-[11px]`}>
              <span className="text-dim">{k}</span>
              <span className={`transition-colors ${good ? 'text-accent' : 'text-ghost'}`}>
                {good ? '✓ ' : ''}{v}
              </span>
            </div>
          ))}
        </TBox>

        {/* ── Stats + Tokens ── */}
        <div>
          <div className="grid grid-cols-2 gap-px bg-faint mb-4">
            <Stat label="ACTION" value={r.action.type} sub={r.action.name} />
            <Stat label="DURATION" value={formatDuration(r.action.duration_ms)} sub={`${r.action.duration_ms.toLocaleString()}ms`} />
            <Stat label="MODEL" value={r.model.name} sub={r.model.provider} />
            <Stat label="COST" value={`$${r.cost_usd.toFixed(3)}`} sub="direct" />
          </div>

          <TBox title="TIMESTAMPS">
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-dim">Agent timestamp</span>
                <span className="text-tx">{new Date(r.timestamp).toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Server received</span>
                <span className="text-tx">{new Date(r.server_received_at).toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Drift</span>
                <span className={d.time_drift_acceptable ? 'text-accent' : 'text-c-red'}>
                  {d.time_drift_ms}ms {d.time_drift_acceptable ? '✓' : '⚠ >5min'}
                </span>
              </div>
            </div>
          </TBox>
        </div>
      </div>

      {/* ── On-chain Merkle Proof ── */}
      <div className="mb-4">
        <div className="text-[10px] tracking-wide overflow-hidden whitespace-nowrap" style={{ color: isAnchored ? '#22c55e' : '#333' }}>
          ┌── <span className="text-dim">BLOCKCHAIN ANCHORING</span>{' '}{'─'.repeat(44)}
        </div>
        <ReceiptMerkleBadge
          isAnchored={isAnchored}
          anchorTxHash={anchor?.tx_hash}
          anchorBatchId={anchor?.batch_id}
          merkleProof={anchor?.merkle_proof}
        />
        <div className="text-[10px] overflow-hidden whitespace-nowrap" style={{ color: isAnchored ? '#22c55e' : '#333' }}>
          └{'─'.repeat(66)}
        </div>
      </div>

      {/* ── Hashes + Signature ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TBox title="SHA-256 HASHES" color="#a78bfa">
          <div className="mb-2.5">
            <p className="text-[8px] text-ghost tracking-widest mb-0.5">INPUT</p>
            <p className="text-[10.5px] text-dim break-all leading-snug">{r.hashes.input}</p>
          </div>
          <div>
            <p className="text-[8px] text-ghost tracking-widest mb-0.5">OUTPUT</p>
            <p className="text-[10.5px] text-dim break-all leading-snug">{r.hashes.output}</p>
          </div>
        </TBox>

        <TBox title="DIGITAL SIGNATURE" color="#eab308">
          <div className="mb-3">
            <p className="text-[8px] text-ghost mb-0.5">ALGORITHM</p>
            <p className="text-[13px] text-tx font-semibold">ed25519</p>
          </div>
          <div>
            <p className="text-[8px] text-ghost mb-0.5">PUBLIC KEY</p>
            <p className="text-[10.5px] text-dim break-all">{data.agent.public_key}</p>
          </div>
        </TBox>
      </div>
    </div>
  );
}

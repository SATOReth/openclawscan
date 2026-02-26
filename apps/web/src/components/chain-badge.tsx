/**
 * components/chain-badge.tsx — On-chain certification badge.
 * Matches the OpenClawScan terminal aesthetic (JetBrains Mono, box-drawing, dark palette).
 */

'use client';

import { useState } from 'react';

const EXPLORER = 'https://basescan.org';

// ─── Types ──────────────────────────────────────────────────

export interface CertificationData {
  tx_hash: string;
  block_number?: number;
  merkle_root: string;
  batch_id_onchain: number;
  contract_address: string;
  certified_at: string;
  receipt_count: number;
  cost_eth?: string;
  explorer_url?: string;
}

interface MerkleProofData {
  proof: string[];
  leaf: string;
  index: number;
}

// ─── Task Certification Badge ───────────────────────────────

export function TaskCertificationBadge({
  isCertified,
  certification,
  isOwner,
  taskId,
  taskStatus,
  onCertified,
}: {
  isCertified: boolean;
  certification?: CertificationData | null;
  isOwner: boolean;
  taskId: string;
  taskStatus: string;
  onCertified?: (data: CertificationData) => void;
}) {
  if (isCertified && certification) {
    return <CertifiedBlock certification={certification} />;
  }
  if (isOwner && taskStatus === 'completed') {
    return <CertifyAction taskId={taskId} onCertified={onCertified} />;
  }
  return <UncertifiedBlock taskStatus={taskStatus} />;
}

// ─── Certified ──────────────────────────────────────────────

function CertifiedBlock({ certification }: { certification: CertificationData }) {
  const [open, setOpen] = useState(false);
  const txUrl = `${EXPLORER}/tx/${certification.tx_hash}`;
  const contractUrl = `${EXPLORER}/address/${certification.contract_address}`;
  const date = new Date(certification.certified_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div>
      {/* TBox-style header */}
      <div className="text-[10px] tracking-wide overflow-hidden whitespace-nowrap text-accent">
        ┌── <span className="text-dim">ON-CHAIN CERTIFICATION</span>{' '}{'─'.repeat(44)}
      </div>

      <div className="bg-card" style={{ borderLeft: '1px solid #22c55e44', borderRight: '1px solid #22c55e44' }}>
        {/* Summary row */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-hl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-accent text-[13px]">⛓</span>
            <span className="text-[10px] text-accent font-bold tracking-widest uppercase">VERIFIED</span>
            <span className="text-[9px] text-ghost">Base L2 · Batch #{certification.batch_id_onchain}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-ghost">{date}</span>
            <span className="text-[9px] text-ghost">{open ? '▲' : '▼'}</span>
          </div>
        </button>

        {/* Expandable details */}
        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-faint space-y-3">
            {/* TX Hash */}
            <div>
              <p className="text-[8px] text-ghost tracking-widest mb-0.5">TX HASH</p>
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-accent hover:text-accent-dim font-mono break-all transition-colors"
              >
                {certification.tx_hash} <span className="text-[8px]">↗</span>
              </a>
            </div>

            {/* Merkle Root */}
            <div>
              <p className="text-[8px] text-ghost tracking-widest mb-0.5">MERKLE ROOT</p>
              <p className="text-[10px] text-dim font-mono break-all">{certification.merkle_root}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-px bg-faint">
              {[
                ['BATCH', `#${certification.batch_id_onchain}`],
                ['RECEIPTS', String(certification.receipt_count)],
                ['BLOCK', certification.block_number ? certification.block_number.toLocaleString() : '—'],
                ['COST', certification.cost_eth ? `${certification.cost_eth} ETH` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="p-2.5 bg-card">
                  <p className="text-[8px] text-ghost tracking-widest mb-0.5">{label}</p>
                  <p className="text-[11px] text-tx font-mono">{value}</p>
                </div>
              ))}
            </div>

            {/* Links */}
            <div className="flex gap-2 pt-1">
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-accent/70 hover:text-accent border border-accent/20 px-2.5 py-1 transition-colors"
              >
                BaseScan ↗
              </a>
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-ghost hover:text-dim border border-faint px-2.5 py-1 transition-colors"
              >
                Contract ↗
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] overflow-hidden whitespace-nowrap text-accent">
        └{'─'.repeat(66)}
      </div>
    </div>
  );
}

// ─── Uncertified ────────────────────────────────────────────

function UncertifiedBlock({ taskStatus }: { taskStatus: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card" style={{ borderLeft: '1px solid #22222244', borderRight: '1px solid #22222244' }}>
      <span className="text-ghost text-[13px]">⛓</span>
      <span className="text-[10px] text-ghost tracking-widest uppercase">NOT CERTIFIED</span>
      {taskStatus !== 'completed' && (
        <span className="text-[9px] text-ghost/60">(complete task to certify)</span>
      )}
    </div>
  );
}

// ─── Certify Action ─────────────────────────────────────────

function CertifyAction({
  taskId,
  onCertified,
}: {
  taskId: string;
  onCertified?: (data: CertificationData) => void;
}) {
  const [state, setState] = useState<'idle' | 'confirm' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<CertificationData | null>(null);

  const handleCertify = async () => {
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/tasks/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Certification failed');
      setResult(data.certification);
      setState('done');
      onCertified?.(data.certification);
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  };

  if (state === 'done' && result) {
    return <CertifiedBlock certification={result} />;
  }

  return (
    <div>
      <div className="text-[10px] tracking-wide overflow-hidden whitespace-nowrap text-cyan">
        ┌── <span className="text-dim">BLOCKCHAIN CERTIFICATION</span>{' '}{'─'.repeat(40)}
      </div>

      <div className="bg-card px-4 py-3" style={{ borderLeft: '1px solid #22d3ee44', borderRight: '1px solid #22d3ee44' }}>
        {state === 'idle' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-cyan text-[13px]">⛓</span>
              <span className="text-[10px] text-cyan tracking-widest uppercase font-bold">READY TO CERTIFY</span>
            </div>
            <button
              onClick={() => setState('confirm')}
              className="text-[10px] text-bg bg-cyan hover:bg-cyan/80 px-3.5 py-1.5 font-bold tracking-widest uppercase transition-colors cursor-pointer"
            >
              CERTIFY
            </button>
          </div>
        )}

        {state === 'confirm' && (
          <div className="space-y-2.5">
            <p className="text-[10px] text-dim leading-relaxed">
              This writes a Merkle root of all task receipts to <span className="text-tx">Base L2 mainnet</span>.
              Permanent and immutable. Cost: ~$0.001.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCertify}
                className="text-[10px] text-bg bg-cyan hover:bg-cyan/80 px-3.5 py-1.5 font-bold tracking-widest uppercase transition-colors cursor-pointer"
              >
                CONFIRM
              </button>
              <button
                onClick={() => setState('idle')}
                className="text-[10px] text-ghost hover:text-dim border border-faint px-3.5 py-1.5 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {state === 'sending' && (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 border border-cyan border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-[11px] text-cyan font-bold">Certifying on Base L2…</p>
              <p className="text-[9px] text-ghost">Merkle tree → TX → confirmation (~10s)</p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-2">
            <p className="text-[10px] text-c-red">✗ {error}</p>
            <button
              onClick={() => setState('idle')}
              className="text-[9px] text-ghost hover:text-dim border border-faint px-2.5 py-1 transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <div className="text-[10px] overflow-hidden whitespace-nowrap text-cyan">
        └{'─'.repeat(66)}
      </div>
    </div>
  );
}

// ─── Receipt Merkle Badge ───────────────────────────────────

export function ReceiptMerkleBadge({
  isAnchored,
  anchorTxHash,
  anchorBatchId,
  merkleProof,
}: {
  isAnchored: boolean;
  anchorTxHash?: string | null;
  anchorBatchId?: string | null;
  merkleProof?: MerkleProofData | null;
}) {
  const [showProof, setShowProof] = useState(false);

  if (!isAnchored || !anchorTxHash) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-l border-r border-faint">
        <span className="text-ghost text-[11px]">⛓</span>
        <span className="text-ghost text-[9px] tracking-widest uppercase">NOT ANCHORED</span>
      </div>
    );
  }

  const txUrl = `${EXPLORER}/tx/${anchorTxHash}`;

  return (
    <div className="bg-card border-l border-r" style={{ borderColor: '#22c55e44' }}>
      <div className="flex items-center justify-between px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-accent text-[11px]">⛓</span>
          <span className="text-accent text-[9px] font-bold tracking-widest uppercase">ON-CHAIN</span>
          <span className="text-[8px] text-ghost font-mono">Batch #{anchorBatchId}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {merkleProof && (
            <button
              onClick={() => setShowProof(!showProof)}
              className="text-[8px] text-ghost hover:text-dim cursor-pointer transition-colors"
            >
              {showProof ? '▲ hide proof' : '▼ show proof'}
            </button>
          )}
          <a href={txUrl} target="_blank" rel="noopener noreferrer"
            className="text-[8px] text-accent/60 hover:text-accent transition-colors">
            BaseScan ↗
          </a>
        </div>
      </div>

      {showProof && merkleProof && (
        <div className="px-3.5 pb-3 pt-1 border-t border-faint space-y-2">
          <div>
            <p className="text-[8px] text-ghost tracking-widest mb-0.5">LEAF</p>
            <p className="text-[9px] text-dim font-mono break-all">{merkleProof.leaf}</p>
          </div>
          <div>
            <p className="text-[8px] text-ghost tracking-widest mb-0.5">INDEX</p>
            <p className="text-[10px] text-dim font-mono">{merkleProof.index}</p>
          </div>
          <div>
            <p className="text-[8px] text-ghost tracking-widest mb-0.5">PROOF ({merkleProof.proof.length} nodes)</p>
            {merkleProof.proof.map((p, i) => (
              <p key={i} className="text-[8px] text-ghost font-mono break-all">[{i}] {p}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3-Level Verification Stack ─────────────────────────────

export function VerificationStack({
  ed25519: { total, verified, failed, done },
  e2e,
  onChain,
}: {
  ed25519: { total: number; verified: number; failed: number; done: boolean };
  e2e?: { valid: boolean | null; decrypted: number } | null;
  onChain?: { certified: boolean; txHash?: string | null; batchId?: number } | null;
}) {
  const sigOk = done && failed === 0 && total > 0;
  const sigFail = failed > 0;

  return (
    <div>
      <div className="text-[10px] tracking-wide overflow-hidden whitespace-nowrap text-ghost">
        ┌── <span className="text-dim">3-LEVEL VERIFICATION</span>{' '}{'─'.repeat(44)}
      </div>

      <div className="bg-card divide-y divide-faint" style={{ borderLeft: '1px solid #22222244', borderRight: '1px solid #22222244' }}>
        {/* Level 1: Ed25519 */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[12px]">🔏</span>
            <div>
              <p className="text-[10px] text-tx">Ed25519 Signatures</p>
              <p className="text-[8px] text-ghost">Agent cryptographically signed each receipt</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold ${
            !done ? 'text-dim' : sigOk ? 'text-accent' : 'text-c-red'
          }`}>
            {!done
              ? `${verified + failed}/${total}…`
              : sigOk
                ? `✓ ${verified}/${total}`
                : `✗ ${failed} FAILED`
            }
          </span>
        </div>

        {/* Level 2: E2E (if applicable) */}
        {e2e && e2e.valid !== null && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[12px]">🔐</span>
              <div>
                <p className="text-[10px] text-tx">AES-256-GCM Encryption</p>
                <p className="text-[8px] text-ghost">Data decrypted and hash-verified client-side</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold ${e2e.valid ? 'text-accent' : 'text-c-red'}`}>
              {e2e.valid ? `✓ ${e2e.decrypted} decrypted` : '✗ MISMATCH'}
            </span>
          </div>
        )}

        {/* Level 3: On-Chain */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[12px]">⛓</span>
            <div>
              <p className="text-[10px] text-tx">Merkle Proof on Base L2</p>
              <p className="text-[8px] text-ghost">Immutable — even OpenClawScan cannot alter</p>
            </div>
          </div>
          {onChain?.certified ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-accent">✓ ON-CHAIN</span>
              {onChain.txHash && (
                <a
                  href={`${EXPLORER}/tx/${onChain.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[8px] text-accent/50 hover:text-accent transition-colors"
                >
                  ↗
                </a>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-ghost">— not certified</span>
          )}
        </div>
      </div>

      <div className="text-[10px] overflow-hidden whitespace-nowrap text-ghost">
        └{'─'.repeat(66)}
      </div>
    </div>
  );
}

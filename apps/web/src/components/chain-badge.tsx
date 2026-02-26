/**
 * components/chain-badge.tsx — On-chain certification badge for tasks and receipts.
 *
 * Shows ⛓ ON-CHAIN verified badge with BaseScan link.
 * Used on /task/[slug] pages and /scan/[id] receipt pages.
 *
 * Three variants:
 * - TaskBadge:    Full badge with certify button (for task owner) or verified state
 * - ReceiptBadge: Compact inline badge for individual receipts
 * - CertifyButton: Action button to trigger certification (task owner only)
 */

'use client';

import { useState } from 'react';

// ─── Constants ──────────────────────────────────────────────

const BASE_EXPLORER = 'https://basescan.org';

// ─── Types ──────────────────────────────────────────────────

interface CertificationData {
  tx_hash: string;
  block_number?: number;
  merkle_root: string;
  batch_id_onchain: number;
  contract_address: string;
  certified_at: string;
  receipt_count: number;
  cost_eth?: string;
}

interface MerkleProofData {
  proof: string[];
  leaf: string;
  index: number;
}

// ─── Task Badge ─────────────────────────────────────────────
// Full certification badge for task pages.

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
    return <CertifiedBadge certification={certification} />;
  }

  if (isOwner && taskStatus === 'completed') {
    return <CertifyButton taskId={taskId} onCertified={onCertified} />;
  }

  // Not certified, not owner or not completed
  return <NotCertifiedBadge taskStatus={taskStatus} />;
}

// ─── Certified Badge ────────────────────────────────────────

function CertifiedBadge({ certification }: { certification: CertificationData }) {
  const [expanded, setExpanded] = useState(false);
  const txUrl = `${BASE_EXPLORER}/tx/${certification.tx_hash}`;
  const contractUrl = `${BASE_EXPLORER}/address/${certification.contract_address}`;
  const date = new Date(certification.certified_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/[.04] rounded-none">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emerald-500/[.06] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-400 text-[14px]">⛓</span>
          <span className="text-emerald-400 text-[12px] font-bold tracking-wider uppercase">
            On-Chain Verified
          </span>
          <span className="text-[10px] text-emerald-400/60 font-mono">
            Base L2
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-neutral-500">{date}</span>
          <span className="text-[10px] text-neutral-600">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-emerald-500/10 space-y-3">
          {/* TX Hash */}
          <div>
            <p className="text-[9px] text-neutral-600 tracking-widest mb-1">TRANSACTION</p>
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono break-all transition-colors"
            >
              {certification.tx_hash}
              <span className="text-[9px] ml-1">↗</span>
            </a>
          </div>

          {/* Merkle Root */}
          <div>
            <p className="text-[9px] text-neutral-600 tracking-widest mb-1">MERKLE ROOT</p>
            <p className="text-[10px] text-neutral-400 font-mono break-all">
              {certification.merkle_root}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6">
            <div>
              <p className="text-[9px] text-neutral-600 tracking-widest mb-1">BATCH ID</p>
              <p className="text-[12px] text-neutral-300 font-mono">
                #{certification.batch_id_onchain}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-600 tracking-widest mb-1">RECEIPTS</p>
              <p className="text-[12px] text-neutral-300 font-mono">
                {certification.receipt_count}
              </p>
            </div>
            {certification.block_number && (
              <div>
                <p className="text-[9px] text-neutral-600 tracking-widest mb-1">BLOCK</p>
                <p className="text-[12px] text-neutral-300 font-mono">
                  {certification.block_number.toLocaleString()}
                </p>
              </div>
            )}
            {certification.cost_eth && (
              <div>
                <p className="text-[9px] text-neutral-600 tracking-widest mb-1">COST</p>
                <p className="text-[12px] text-neutral-300 font-mono">
                  {certification.cost_eth} ETH
                </p>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex gap-3 pt-1">
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-emerald-400/70 hover:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 transition-colors"
            >
              View on BaseScan ↗
            </a>
            <a
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-neutral-500 hover:text-neutral-300 border border-neutral-700 px-3 py-1.5 transition-colors"
            >
              Contract ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Not Certified Badge ────────────────────────────────────

function NotCertifiedBadge({ taskStatus }: { taskStatus: string }) {
  return (
    <div className="border border-neutral-800 bg-neutral-900/50 px-4 py-3 flex items-center gap-2.5">
      <span className="text-neutral-600 text-[14px]">⛓</span>
      <span className="text-neutral-600 text-[12px] tracking-wider uppercase">
        Not Certified
      </span>
      {taskStatus !== 'completed' && (
        <span className="text-[10px] text-neutral-700 ml-2">
          (Complete task to certify)
        </span>
      )}
    </div>
  );
}

// ─── Certify Button ─────────────────────────────────────────

function CertifyButton({
  taskId,
  onCertified,
}: {
  taskId: string;
  onCertified?: (data: CertificationData) => void;
}) {
  const [state, setState] = useState<'idle' | 'confirming' | 'certifying' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const handleCertify = async () => {
    setState('certifying');
    setError('');

    try {
      const res = await fetch('/api/tasks/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Certification failed');
      }

      setResult(data.certification);
      setState('done');
      onCertified?.(data.certification);
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  };

  if (state === 'done' && result) {
    return <CertifiedBadge certification={result} />;
  }

  return (
    <div className="border border-cyan-500/30 bg-cyan-500/[.04] px-4 py-3">
      {state === 'idle' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-cyan-400 text-[14px]">⛓</span>
            <span className="text-cyan-400 text-[12px] tracking-wider uppercase">
              Ready to Certify
            </span>
          </div>
          <button
            onClick={() => setState('confirming')}
            className="text-[11px] text-black bg-cyan-400 hover:bg-cyan-300 px-4 py-1.5 font-bold tracking-wider uppercase transition-colors cursor-pointer"
          >
            Certify On-Chain
          </button>
        </div>
      )}

      {state === 'confirming' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-cyan-400 text-[14px]">⛓</span>
            <span className="text-cyan-400 text-[12px] font-bold">Confirm Certification</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            This will write a Merkle root of all task receipts to <strong className="text-neutral-300">Base L2 mainnet</strong>.
            The transaction is permanent and immutable. Gas cost: ~$0.001.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCertify}
              className="text-[11px] text-black bg-cyan-400 hover:bg-cyan-300 px-4 py-1.5 font-bold tracking-wider uppercase transition-colors cursor-pointer"
            >
              Confirm & Certify
            </button>
            <button
              onClick={() => setState('idle')}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 border border-neutral-700 px-4 py-1.5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state === 'certifying' && (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-[12px] text-cyan-400 font-bold">Certifying on Base L2...</p>
            <p className="text-[10px] text-neutral-500">Building Merkle tree → Sending TX → Waiting for confirmation</p>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-red-400 text-[14px]">✗</span>
            <span className="text-red-400 text-[12px] font-bold">Certification Failed</span>
          </div>
          <p className="text-[11px] text-red-400/70">{error}</p>
          <button
            onClick={() => setState('idle')}
            className="text-[11px] text-neutral-500 hover:text-neutral-300 border border-neutral-700 px-3 py-1 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Receipt Merkle Badge ───────────────────────────────────
// Compact badge for individual receipts on /scan/[id] pages.

export function ReceiptMerkleBadge({
  isAnchored,
  anchorTxHash,
  anchorBatchId,
  merkleProof,
  contractAddress,
}: {
  isAnchored: boolean;
  anchorTxHash?: string | null;
  anchorBatchId?: string | null;
  merkleProof?: MerkleProofData | null;
  contractAddress?: string;
}) {
  const [showProof, setShowProof] = useState(false);

  if (!isAnchored || !anchorTxHash) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-neutral-800 bg-neutral-900/40">
        <span className="text-neutral-700 text-[11px]">⛓</span>
        <span className="text-neutral-700 text-[10px] tracking-wider uppercase">
          Not anchored
        </span>
      </div>
    );
  }

  const txUrl = `${BASE_EXPLORER}/tx/${anchorTxHash}`;

  return (
    <div className="border border-emerald-500/20 bg-emerald-500/[.03]">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-[11px]">⛓</span>
          <span className="text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
            On-Chain
          </span>
          <span className="text-[9px] text-emerald-400/50 font-mono">
            Batch #{anchorBatchId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {merkleProof && (
            <button
              onClick={() => setShowProof(!showProof)}
              className="text-[9px] text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
            >
              {showProof ? 'Hide' : 'Show'} proof
            </button>
          )}
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-emerald-400/70 hover:text-emerald-400 transition-colors"
          >
            BaseScan ↗
          </a>
        </div>
      </div>

      {showProof && merkleProof && (
        <div className="px-3 pb-3 pt-1 border-t border-emerald-500/10 space-y-2">
          <div>
            <p className="text-[8px] text-neutral-600 tracking-widest mb-0.5">LEAF HASH</p>
            <p className="text-[9px] text-neutral-400 font-mono break-all">{merkleProof.leaf}</p>
          </div>
          <div>
            <p className="text-[8px] text-neutral-600 tracking-widest mb-0.5">LEAF INDEX</p>
            <p className="text-[10px] text-neutral-400 font-mono">{merkleProof.index}</p>
          </div>
          <div>
            <p className="text-[8px] text-neutral-600 tracking-widest mb-0.5">
              PROOF ({merkleProof.proof.length} elements)
            </p>
            <div className="space-y-0.5">
              {merkleProof.proof.map((p, i) => (
                <p key={i} className="text-[9px] text-neutral-500 font-mono break-all">
                  [{i}] {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3-Level Verification Summary ───────────────────────────
// Shows the full verification stack on task and scan pages.

export function VerificationStack({
  ed25519Valid,
  e2eValid,
  onChainValid,
  txHash,
}: {
  ed25519Valid: boolean;
  e2eValid?: boolean | null;     // null if no E2E on this receipt
  onChainValid?: boolean | null; // null if not anchored
  txHash?: string | null;
}) {
  const levels = [
    {
      name: 'Ed25519 Signature',
      desc: 'Agent cryptographically signed this receipt',
      valid: ed25519Valid,
      icon: '🔏',
    },
    {
      name: 'E2E Encryption',
      desc: 'Data is authentic (AES-256-GCM verified)',
      valid: e2eValid,
      icon: '🔐',
      optional: true,
    },
    {
      name: 'On-Chain Proof',
      desc: 'Merkle proof verified on Base L2',
      valid: onChainValid,
      icon: '⛓',
      optional: true,
      link: txHash ? `${BASE_EXPLORER}/tx/${txHash}` : undefined,
    },
  ];

  return (
    <div className="border border-neutral-800 divide-y divide-neutral-800">
      <div className="px-4 py-2.5 bg-neutral-900/60">
        <p className="text-[10px] text-neutral-500 tracking-widest uppercase font-bold">
          3-Level Verification
        </p>
      </div>
      {levels.map((level) => {
        if (level.optional && level.valid === null) return null;

        return (
          <div
            key={level.name}
            className="px-4 py-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[13px]">{level.icon}</span>
              <div>
                <p className="text-[11px] text-neutral-300">{level.name}</p>
                <p className="text-[9px] text-neutral-600">{level.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold ${
                  level.valid ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {level.valid ? '✓ PASS' : '✗ FAIL'}
              </span>
              {level.link && (
                <a
                  href={level.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
                >
                  ↗
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * lib/merkle.ts — Merkle tree builder for OpenClawScan receipt certification.
 *
 * Takes an array of receipt hashes (SHA-256 hex strings), builds a Merkle tree
 * using keccak256 (to match Solidity's keccak256), and returns the root + proofs.
 *
 * Dependencies: merkletreejs, keccak256 (via ethers.js)
 */

import { MerkleTree } from 'merkletreejs';
import { keccak256 as solidityKeccak256 } from 'ethers';

// ─── Types ──────────────────────────────────────────────────

export interface MerkleProofData {
  proof: string[];    // array of 0x-prefixed hex proof elements
  leaf: string;       // 0x-prefixed hex leaf hash
  index: number;      // leaf index in the tree
}

export interface MerkleTreeResult {
  root: string;                          // 0x-prefixed hex Merkle root
  leafCount: number;                     // number of leaves
  leaves: string[];                      // ordered 0x-prefixed hex leaves
  proofs: Map<string, MerkleProofData>;  // receiptHash -> proof data
  tree: MerkleTree;                      // raw tree object (for debugging)
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Convert a SHA-256 hex string to a keccak256 leaf for the Merkle tree.
 * We keccak256 the SHA-256 hash to make it compatible with Solidity verification.
 *
 * Receipt hash (SHA-256 hex) → keccak256(abi.encodePacked(bytes32)) → leaf
 */
function receiptHashToLeaf(sha256Hex: string): Buffer {
  // Ensure 0x prefix
  const prefixed = sha256Hex.startsWith('0x') ? sha256Hex : `0x${sha256Hex}`;
  // keccak256 of the bytes32 representation
  const hash = solidityKeccak256(prefixed);
  return Buffer.from(hash.slice(2), 'hex');
}

/**
 * Build a "receipt fingerprint" — the unique hash that represents a receipt
 * in the Merkle tree. Combines input_sha256 + output_sha256 + receipt_id.
 */
export function buildReceiptFingerprint(receipt: {
  receipt_id: string;
  input_sha256: string;
  output_sha256: string;
}): string {
  // Concatenate the three fields and keccak256 them
  const combined = `${receipt.receipt_id}:${receipt.input_sha256}:${receipt.output_sha256}`;
  return solidityKeccak256(Buffer.from(combined, 'utf-8'));
}

// ─── Core Builder ───────────────────────────────────────────

/**
 * Build a Merkle tree from an array of receipt fingerprint hashes.
 * Returns the root, all proofs, and the ordered leaves.
 *
 * @param receiptHashes - Array of 0x-prefixed keccak256 fingerprints
 *                        (from buildReceiptFingerprint)
 * @returns MerkleTreeResult with root and proofs for each receipt
 */
export function buildMerkleTree(receiptHashes: string[]): MerkleTreeResult {
  if (receiptHashes.length === 0) {
    throw new Error('Cannot build Merkle tree with zero leaves');
  }

  // Convert hex strings to Buffers
  const leaves = receiptHashes.map((h) => {
    const hex = h.startsWith('0x') ? h.slice(2) : h;
    return Buffer.from(hex, 'hex');
  });

  // Build tree with keccak256 hash function and sorted pairs
  // sortPairs: true ensures deterministic tree regardless of leaf order
  const tree = new MerkleTree(leaves, keccak256Buffer, {
    sortPairs: true,
  });

  const root = '0x' + tree.getRoot().toString('hex');
  const orderedLeaves = leaves.map((l) => '0x' + l.toString('hex'));

  // Generate proof for each leaf
  const proofs = new Map<string, MerkleProofData>();

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    const proof = tree.getProof(leaf);
    const hexProof = proof.map((p) => '0x' + p.data.toString('hex'));

    proofs.set(receiptHashes[i], {
      proof: hexProof,
      leaf: '0x' + leaf.toString('hex'),
      index: i,
    });
  }

  return {
    root,
    leafCount: leaves.length,
    leaves: orderedLeaves,
    proofs,
    tree,
  };
}

/**
 * Verify a single receipt's Merkle proof locally (without on-chain call).
 */
export function verifyProofLocally(
  receiptHash: string,
  proof: string[],
  root: string
): boolean {
  const leaf = Buffer.from(
    receiptHash.startsWith('0x') ? receiptHash.slice(2) : receiptHash,
    'hex'
  );
  const proofBuffers = proof.map((p) =>
    Buffer.from(p.startsWith('0x') ? p.slice(2) : p, 'hex')
  );
  const rootBuffer = Buffer.from(
    root.startsWith('0x') ? root.slice(2) : root,
    'hex'
  );

  const tree = new MerkleTree([], keccak256Buffer, { sortPairs: true });
  return tree.verify(proofBuffers, leaf, rootBuffer);
}

// ─── Internal keccak256 wrapper for merkletreejs ────────────

function keccak256Buffer(data: Buffer): Buffer {
  const hash = solidityKeccak256(data);
  return Buffer.from(hash.slice(2), 'hex');
}

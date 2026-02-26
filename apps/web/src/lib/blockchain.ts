/**
 * lib/blockchain.ts — Ethers.js wrapper for ClawVerify.sol on Base L2 mainnet.
 *
 * Handles: sending certifyBatch TX, reading batch data, verifying on-chain.
 * Uses server-side wallet (private key in env) for signing transactions.
 *
 * Dependencies: ethers (v6)
 */

import { ethers } from 'ethers';

// ─── Constants ──────────────────────────────────────────────

export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = 'https://mainnet.base.org';
export const BASE_EXPLORER = 'https://basescan.org';

// ClawVerify.sol ABI — only the functions we need
export const CLAW_VERIFY_ABI = [
  // Write
  'function certifyBatch(bytes32 _merkleRoot, string _agentId, string _taskSlug, uint256 _receiptCount) external returns (uint256)',
  // Read
  'function verifyReceipt(uint256 _batchId, bytes32 _receiptHash, bytes32[] _proof) external view returns (bool)',
  'function getBatch(uint256 _batchId) external view returns (bytes32 merkleRoot, uint256 timestamp, address certifier, string agentId, string taskSlug, uint256 receiptCount)',
  'function batchCount() external view returns (uint256)',
  'function owner() external view returns (address)',
  // Events
  'event BatchCertified(uint256 indexed batchId, address indexed certifier, bytes32 merkleRoot, string agentId, string taskSlug, uint256 receiptCount, uint256 timestamp)',
];

// ─── Types ──────────────────────────────────────────────────

export interface CertifyResult {
  batchId: number;
  txHash: string;
  blockNumber: number;
  merkleRoot: string;
  gasUsed: bigint;
  costWei: bigint | number;
  costEth: string;
  explorerUrl: string;
}

export interface OnChainBatch {
  merkleRoot: string;
  timestamp: number;
  certifier: string;
  agentId: string;
  taskSlug: string;
  receiptCount: number;
}

// ─── Provider & Contract ────────────────────────────────────

function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BASE_RPC_URL || BASE_RPC_URL;
  return new ethers.JsonRpcProvider(rpcUrl, BASE_CHAIN_ID);
}

function getWallet(): ethers.Wallet {
  const privateKey = process.env.CERTIFIER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('CERTIFIER_PRIVATE_KEY not set in environment');
  }
  return new ethers.Wallet(privateKey, getProvider());
}

function getContractAddress(): string {
  const addr = process.env.CLAWVERIFY_CONTRACT_ADDRESS;
  if (!addr) {
    throw new Error('CLAWVERIFY_CONTRACT_ADDRESS not set in environment');
  }
  return addr;
}

function getReadContract(): ethers.Contract {
  return new ethers.Contract(getContractAddress(), CLAW_VERIFY_ABI, getProvider());
}

function getWriteContract(): ethers.Contract {
  return new ethers.Contract(getContractAddress(), CLAW_VERIFY_ABI, getWallet());
}

// ─── Core Functions ─────────────────────────────────────────

/**
 * Send a certifyBatch transaction to ClawVerify.sol on Base mainnet.
 * This writes the Merkle root on-chain and returns the TX details.
 */
export async function certifyBatchOnChain(
  merkleRoot: string,
  agentId: string,
  taskSlug: string,
  receiptCount: number
): Promise<CertifyResult> {
  const contract = getWriteContract();

  // Convert merkleRoot to bytes32
  const rootBytes32 = merkleRoot.startsWith('0x') ? merkleRoot : `0x${merkleRoot}`;

  console.log(`[blockchain] Sending certifyBatch TX...`);
  console.log(`  Root:     ${rootBytes32}`);
  console.log(`  Agent:    ${agentId}`);
  console.log(`  Task:     ${taskSlug}`);
  console.log(`  Receipts: ${receiptCount}`);

  // Send transaction
  const tx = await contract.certifyBatch(
    rootBytes32,
    agentId,
    taskSlug,
    receiptCount
  );

  console.log(`[blockchain] TX sent: ${tx.hash}`);
  console.log(`[blockchain] Waiting for confirmation...`);

  // Wait for 1 confirmation
  const receipt = await tx.wait(1);

  if (!receipt || receipt.status !== 1) {
    throw new Error(`Transaction failed: ${tx.hash}`);
  }

  // Parse the BatchCertified event to get the batchId
  let batchId = -1;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed && parsed.name === 'BatchCertified') {
        batchId = Number(parsed.args[0]); // batchId is first indexed param
        break;
      }
    } catch {
      // Not our event, skip
    }
  }

  const gasUsed = receipt.gasUsed;
  const costWei = gasUsed * (receipt.gasPrice ?? BigInt(0));
  const costEth = ethers.formatEther(costWei);

  const result: CertifyResult = {
    batchId,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    merkleRoot: rootBytes32,
    gasUsed,
    costWei,
    costEth,
    explorerUrl: `${BASE_EXPLORER}/tx/${receipt.hash}`,
  };

  console.log(`[blockchain] ✓ Confirmed in block ${receipt.blockNumber}`);
  console.log(`  Batch ID: ${batchId}`);
  console.log(`  Gas:      ${gasUsed.toString()}`);
  console.log(`  Cost:     ${costEth} ETH`);
  console.log(`  Explorer: ${result.explorerUrl}`);

  return result;
}

/**
 * Read batch data from the contract (no gas cost).
 */
export async function getBatchFromChain(batchId: number): Promise<OnChainBatch> {
  const contract = getReadContract();
  const [merkleRoot, timestamp, certifier, agentId, taskSlug, receiptCount] =
    await contract.getBatch(batchId);

  return {
    merkleRoot,
    timestamp: Number(timestamp),
    certifier,
    agentId,
    taskSlug,
    receiptCount: Number(receiptCount),
  };
}

/**
 * Verify a receipt's Merkle proof on-chain (no gas cost).
 */
export async function verifyReceiptOnChain(
  batchId: number,
  receiptHash: string,
  proof: string[]
): Promise<boolean> {
  const contract = getReadContract();
  const hash = receiptHash.startsWith('0x') ? receiptHash : `0x${receiptHash}`;
  return contract.verifyReceipt(batchId, hash, proof);
}

/**
 * Get the current batch count from the contract.
 */
export async function getBatchCount(): Promise<number> {
  const contract = getReadContract();
  return Number(await contract.batchCount());
}

/**
 * Get the wallet balance (for checking if we have enough ETH).
 */
export async function getWalletBalance(): Promise<{ wei: bigint; eth: string }> {
  const wallet = getWallet();
  const balance = await wallet.provider!.getBalance(wallet.address);
  return {
    wei: balance,
    eth: ethers.formatEther(balance),
  };
}

/**
 * Get the certifier wallet address.
 */
export function getCertifierAddress(): string {
  return getWallet().address;
}

// ─── Utility ────────────────────────────────────────────────

/**
 * Generate BaseScan URL for a transaction.
 */
export function basescanTxUrl(txHash: string): string {
  return `${BASE_EXPLORER}/tx/${txHash}`;
}

/**
 * Generate BaseScan URL for a contract.
 */
export function basescanContractUrl(address?: string): string {
  return `${BASE_EXPLORER}/address/${address || getContractAddress()}`;
}

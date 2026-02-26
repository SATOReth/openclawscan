#!/usr/bin/env node

/**
 * deploy-contract.mjs — Deploy ClawVerify.sol to Base L2 mainnet.
 *
 * Prerequisites:
 *   npm install ethers solc
 *
 * Usage:
 *   node deploy-contract.mjs --private-key 0xYOUR_KEY
 *
 * Or set environment variable:
 *   $env:CERTIFIER_PRIVATE_KEY = "0xYOUR_KEY"
 *   node deploy-contract.mjs
 *
 * ⚠ This deploys to MAINNET (chain 8453). Make sure your wallet has ETH on Base.
 *    Wallet: 0x6abe18aA8dff37A3E64091b1B21Ae46d0E932798
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

// ─── Config ─────────────────────────────────────────────────

const BASE_RPC = 'https://mainnet.base.org';
const BASE_CHAIN_ID = 8453;
const BASE_EXPLORER = 'https://basescan.org';

// ─── Parse args ─────────────────────────────────────────────

function getPrivateKey() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--private-key' && args[i + 1]) return args[i + 1];
  }
  if (process.env.CERTIFIER_PRIVATE_KEY) return process.env.CERTIFIER_PRIVATE_KEY;
  return null;
}

// ─── Compile contract ───────────────────────────────────────

function compileContract() {
  const require = createRequire(import.meta.url);
  let solc;
  try {
    solc = require('solc');
  } catch {
    console.error('\n  ✗ solc not found. Install it:\n    npm install solc\n');
    process.exit(1);
  }

  const source = readFileSync('contracts/ClawVerify.sol', 'utf-8');

  const input = {
    language: 'Solidity',
    sources: {
      'ClawVerify.sol': { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  console.log('  Compiling ClawVerify.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('\n  ✗ Compilation errors:\n');
      errors.forEach((e) => console.error('   ', e.formattedMessage));
      process.exit(1);
    }
    // Show warnings
    output.errors
      .filter((e) => e.severity === 'warning')
      .forEach((e) => console.log('  ⚠', e.message));
  }

  const contract = output.contracts['ClawVerify.sol']['ClawVerify'];
  return {
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object,
  };
}

// ─── Deploy ─────────────────────────────────────────────────

async function main() {
  console.log('\n  ◈ ClawVerify.sol — Deploy to Base L2 Mainnet\n');

  const privateKey = getPrivateKey();
  if (!privateKey) {
    console.error('  ✗ No private key provided.\n');
    console.error('  Usage:');
    console.error('    node deploy-contract.mjs --private-key 0xYOUR_KEY\n');
    console.error('  Or set environment variable:');
    console.error('    $env:CERTIFIER_PRIVATE_KEY = "0xYOUR_KEY"');
    console.error('    node deploy-contract.mjs\n');
    process.exit(1);
  }

  // Connect to Base
  const provider = new ethers.JsonRpcProvider(BASE_RPC, BASE_CHAIN_ID);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`  Chain:    Base L2 Mainnet (${BASE_CHAIN_ID})`);
  console.log(`  Wallet:   ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log(`  Balance:  ${balanceEth} ETH`);

  if (balance === 0n) {
    console.error('\n  ✗ Wallet has 0 ETH. Fund it first on Base mainnet.\n');
    process.exit(1);
  }

  // Compile
  const { abi, bytecode } = compileContract();
  console.log(`  Bytecode: ${bytecode.length / 2} bytes`);
  console.log('');

  // Estimate gas
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction();
  const estimatedGas = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const feeData = await provider.getFeeData();
  const estimatedCost = estimatedGas * (feeData.gasPrice || 0n);

  console.log(`  Estimated gas:  ${estimatedGas.toString()}`);
  console.log(`  Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);

  if (estimatedCost > balance) {
    console.error('\n  ✗ Insufficient balance for deployment.\n');
    process.exit(1);
  }

  console.log('\n  Deploying...');

  // Deploy
  const contract = await factory.deploy();
  const txHash = contract.deploymentTransaction()?.hash;
  console.log(`  TX:       ${txHash}`);
  console.log(`  Waiting for confirmation...`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await provider.getTransactionReceipt(txHash);

  const gasUsed = receipt?.gasUsed || 0n;
  const actualCost = gasUsed * (receipt?.gasPrice || 0n);

  console.log('\n  ✓ Deployed!\n');
  console.log(`  ┌──────────────────────────────────────────────────────┐`);
  console.log(`  │  Contract: ${address}  │`);
  console.log(`  └──────────────────────────────────────────────────────┘`);
  console.log('');
  console.log(`  TX:       ${BASE_EXPLORER}/tx/${txHash}`);
  console.log(`  Contract: ${BASE_EXPLORER}/address/${address}`);
  console.log(`  Block:    ${receipt?.blockNumber}`);
  console.log(`  Gas:      ${gasUsed.toString()}`);
  console.log(`  Cost:     ${ethers.formatEther(actualCost)} ETH`);
  console.log('');
  console.log('  ── Next steps ──────────────────────────────────────');
  console.log('');
  console.log(`  1. Add to .env.local:`);
  console.log(`     CLAWVERIFY_CONTRACT_ADDRESS=${address}`);
  console.log(`     CERTIFIER_PRIVATE_KEY=${privateKey}`);
  console.log('');
  console.log(`  2. Verify on BaseScan (optional):`);
  console.log(`     Visit ${BASE_EXPLORER}/address/${address}#code`);
  console.log('');
  console.log(`  3. Run migration 005 in Supabase SQL Editor`);
  console.log('');
  console.log(`  4. Test: node demo-certify.mjs --task-slug YOUR_TASK`);
  console.log('');

  // Save deployment info
  const deployInfo = {
    contract_address: address,
    tx_hash: txHash,
    block_number: receipt?.blockNumber,
    chain_id: BASE_CHAIN_ID,
    chain: 'base_l2',
    deployer: wallet.address,
    gas_used: gasUsed.toString(),
    cost_eth: ethers.formatEther(actualCost),
    deployed_at: new Date().toISOString(),
    abi: abi,
  };

  const { writeFileSync } = await import('fs');
  writeFileSync('deployment.json', JSON.stringify(deployInfo, null, 2));
  console.log('  Saved deployment.json ✓\n');
}

main().catch((err) => {
  console.error('\n  ✗ Deploy failed:', err.message || err);
  process.exit(1);
});

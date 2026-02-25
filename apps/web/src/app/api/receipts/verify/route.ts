import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyReceiptSignature } from '@/lib/verify';
import { jsonError } from '@/lib/auth';

/**
 * Public receipt verification.
 * Anyone can verify a receipt — no auth required.
 * 
 * GET /api/receipts/verify?receipt_id=rcpt_xxxx
 * 
 * Returns: signature validity, agent info, timestamp.
 * Does NOT return private data (hashes only).
 * 
 * FIX v1.1: Uses stored signed_payload for verification instead of
 * reconstructing from DB columns. The reconstruction was broken because:
 * 1. owner_id used display_name instead of original value (github:xxx)
 * 2. context.task_id used UUID instead of original task_id string
 * 3. E2E encrypted fields would mismatch the original plaintext payload
 * The signed_payload column stores the EXACT JSON that was signed.
 */
export async function GET(req: NextRequest) {
  const receiptId = req.nextUrl.searchParams.get('receipt_id');
  if (!receiptId) {
    return jsonError('Missing receipt_id parameter', 400);
  }

  // Fetch receipt — include signed_payload for proper verification
  const { data: receipt, error } = await supabaseAdmin
    .from('receipts')
    .select(`
      receipt_id, timestamp, server_received_at,
      action_type, action_name, action_duration_ms,
      model_provider, model_name, tokens_in, tokens_out,
      cost_usd, was_routed,
      input_sha256, output_sha256,
      session_id, sequence, task_id,
      visibility,
      signature_algorithm, signature_public_key, signature_value,
      signed_payload,
      agents!inner(agent_id, display_name, public_key, is_public),
      owners!inner(display_name)
    `)
    .eq('receipt_id', receiptId)
    .single();

  if (error || !receipt) {
    return jsonError('Receipt not found', 404);
  }

  // Check visibility: private receipts can't be verified publicly
  if (receipt.visibility === 'private') {
    return jsonError(
      'This receipt is private. The owner has not made it publicly verifiable.',
      403
    );
  }

  const agent = receipt.agents as any;
  const owner = receipt.owners as any;

  const signature = {
    algorithm: receipt.signature_algorithm,
    public_key: receipt.signature_public_key,
    value: receipt.signature_value,
  };

  // ── Signature verification ────────────────────────────────
  // Use signed_payload if available (v1.1+), fall back to reconstruction
  // for legacy receipts that don't have it.
  let signatureValid = false;

  if (receipt.signed_payload) {
    // v1.1+: Use the stored original payload (what was actually signed)
    signatureValid = verifyReceiptSignature(
      receipt.signed_payload as Record<string, unknown>,
      signature
    );
  } else {
    // Legacy fallback: reconstruct from columns
    // NOTE: This may fail if owner_id or task_id don't match original values
    const reconstructedPayload = {
      version: '1.0' as const,
      receipt_id: receipt.receipt_id,
      agent_id: agent.agent_id,
      owner_id: owner.display_name,
      timestamp: receipt.timestamp,
      action: {
        type: receipt.action_type,
        name: receipt.action_name,
        duration_ms: receipt.action_duration_ms,
      },
      model: {
        provider: receipt.model_provider,
        name: receipt.model_name,
        tokens_in: receipt.tokens_in,
        tokens_out: receipt.tokens_out,
      },
      cost: {
        amount_usd: receipt.cost_usd,
        was_routed: receipt.was_routed,
      },
      hashes: {
        input_sha256: receipt.input_sha256,
        output_sha256: receipt.output_sha256,
      },
      context: {
        task_id: receipt.task_id,
        session_id: receipt.session_id,
        sequence: receipt.sequence,
      },
      visibility: receipt.visibility,
    };
    signatureValid = verifyReceiptSignature(reconstructedPayload, signature);
  }

  // Check if agent's registered key matches
  const keyMatch = receipt.signature_public_key === agent.public_key;

  // Time drift between agent timestamp and server receipt
  const agentTime = new Date(receipt.timestamp).getTime();
  const serverTime = new Date(receipt.server_received_at).getTime();
  const timeDriftMs = Math.abs(serverTime - agentTime);

  return Response.json({
    verified: signatureValid && keyMatch,
    details: {
      signature_valid: signatureValid,
      key_registered: keyMatch,
      time_drift_ms: timeDriftMs,
      time_drift_acceptable: timeDriftMs < 5 * 60 * 1000,
    },
    receipt: {
      receipt_id: receipt.receipt_id,
      timestamp: receipt.timestamp,
      server_received_at: receipt.server_received_at,
      action: {
        type: receipt.action_type,
        name: receipt.action_name,
        duration_ms: receipt.action_duration_ms,
      },
      model: {
        provider: receipt.model_provider,
        name: receipt.model_name,
      },
      cost_usd: receipt.cost_usd,
      hashes: {
        input: receipt.input_sha256,
        output: receipt.output_sha256,
      },
      signed_payload: receipt.signed_payload || null,
    },
    agent: {
      id: agent.agent_id,
      name: agent.display_name,
      public_key: agent.public_key,
    },
    verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://openclawscan.xyz'}/receipt/${receipt.receipt_id}`,
  });
}

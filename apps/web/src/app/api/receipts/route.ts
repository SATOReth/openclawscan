import { NextRequest } from 'next/server';
import { authenticateRequest, jsonError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  verifyReceiptSignature,
  extractSignablePayload,
  isTimestampReasonable,
} from '@/lib/verify';

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  if (!auth) return jsonError('Invalid or missing API key', 401);

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  // 3. Basic field validation
  const required = [
    'version', 'receipt_id', 'agent_id', 'owner_id',
    'timestamp', 'action', 'model', 'cost', 'hashes',
    'context', 'signature',
  ];
  for (const field of required) {
    if (!(field in body)) {
      return jsonError(`Missing required field: ${field}`, 400);
    }
  }

  if (body.version !== '1.0') {
    return jsonError('Unsupported receipt version', 400);
  }

  // 4. Verify signature
  // extractSignablePayload excludes: signature, server_received_at,
  // encrypted_input, encrypted_output (v1.1 transport-only fields)
  const payload = extractSignablePayload(body);
  const signature = body.signature as {
    algorithm: string;
    public_key: string;
    value: string;
  };

  const signatureValid = verifyReceiptSignature(payload, signature);
  if (!signatureValid) {
    return jsonError('Invalid signature — receipt may have been tampered with', 403);
  }

  // 5. Verify timestamp is reasonable
  const timestamp = body.timestamp as string;
  if (!isTimestampReasonable(timestamp)) {
    return jsonError(
      'Receipt timestamp is too far from server time (>5 min drift)',
      400
    );
  }

  // 6. Look up the agent (by agent_id string + owner)
  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('id, public_key')
    .eq('agent_id', body.agent_id)
    .eq('owner_id', auth.ownerId)
    .single();

  if (agentError || !agent) {
    return jsonError('Agent not found. Register the agent first.', 404);
  }

  // 7. Verify the signature public key matches the registered agent
  if (signature.public_key !== agent.public_key) {
    return jsonError(
      'Signature public key does not match registered agent key',
      403
    );
  }

  // 8. No receipt limits — OpenClawScan is completely free

  // 8b. Extract the signed payload for storage
  const signedPayload = extractSignablePayload(body);

  // 9. Check for duplicate receipt_id
  const { data: existing } = await supabaseAdmin
    .from('receipts')
    .select('receipt_id')
    .eq('receipt_id', body.receipt_id)
    .single();

  if (existing) {
    return jsonError('Duplicate receipt_id — already submitted', 409);
  }

  // 10. Resolve task_id if provided
  const context = body.context as {
    task_id?: string;
    session_id: string;
    sequence: number;
  };
  let taskUuid: string | null = null;

  if (context.task_id) {
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', context.task_id)
      .eq('agent_id', agent.id)
      .single();

    if (task) {
      taskUuid = task.id;
    }
  }

  // 11. Prepare data
  const action = body.action as { type: string; name: string; duration_ms: number };
  const model = body.model as {
    provider: string;
    name: string;
    tokens_in: number;
    tokens_out: number;
  };
  const cost = body.cost as { amount_usd: number; was_routed: boolean };
  const hashes = body.hashes as { input_sha256: string; output_sha256: string };
  const visibility = (body.visibility as string) || 'private';
  const serverReceivedAt = new Date().toISOString();
  const VALID_VISIBILITIES = ['private', 'task_only', 'public'];
  if (!VALID_VISIBILITIES.includes(visibility)) {
    return jsonError('Invalid visibility: ' + visibility + '. Must be: private, task_only, public', 400);
  }

  // v1.1: Extract encrypted fields (optional, null for v1.0 receipts)
  const encrypted_input = (body.encrypted_input as string) || null;
  const encrypted_output = (body.encrypted_output as string) || null;

  // Validate encrypted fields format (if present, must be base64)
  if (encrypted_input !== null) {
    try {
      const buf = Buffer.from(encrypted_input, 'base64');
      // Minimum: 12 (IV) + 0 (empty ciphertext) + 16 (authTag) = 28 bytes
      if (buf.length < 28) {
        return jsonError('encrypted_input blob too short — invalid AES-256-GCM format', 400);
      }
    } catch {
      return jsonError('encrypted_input must be valid base64', 400);
    }
  }

  if (encrypted_output !== null) {
    try {
      const buf = Buffer.from(encrypted_output, 'base64');
      if (buf.length < 28) {
        return jsonError('encrypted_output blob too short — invalid AES-256-GCM format', 400);
      }
    } catch {
      return jsonError('encrypted_output must be valid base64', 400);
    }
  }

  // 12. Insert into database
  const { error: insertError } = await supabaseAdmin
    .from('receipts')
    .insert({
      receipt_id: body.receipt_id,
      agent_id: agent.id,
      owner_id: auth.ownerId,
      task_id: taskUuid,
      timestamp: body.timestamp,
      server_received_at: serverReceivedAt,
      action_type: action.type,
      action_name: action.name,
      action_duration_ms: action.duration_ms,
      model_provider: model.provider,
      model_name: model.name,
      tokens_in: model.tokens_in,
      tokens_out: model.tokens_out,
      cost_usd: cost.amount_usd,
      was_routed: cost.was_routed,
      input_sha256: hashes.input_sha256,
      output_sha256: hashes.output_sha256,
      session_id: context.session_id,
      sequence: context.sequence,
      visibility,
      signature_algorithm: signature.algorithm,
      signature_public_key: signature.public_key,
      signature_value: signature.value,
      signed_payload: signedPayload,
      // v1.1: E2E encrypted fields (null for v1.0 receipts)
      encrypted_input,
      encrypted_output,
    });

  if (insertError) {
    console.error('Receipt insert error:', insertError);
    return jsonError('Failed to store receipt: ' + insertError.message, 500);
  }

  // 13. Return success with explorer URL
  const explorerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://openclawscan.xyz'}/receipt/${body.receipt_id}`;

  return Response.json(
    {
      receipt_id: body.receipt_id,
      explorer_url: explorerUrl,
      server_received_at: serverReceivedAt,
    },
    { status: 201 }
  );
}

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

  // 8b. Extract the signed payload (everything except signature + server_received_at)
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

  // 11. Store the receipt
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

  // 12. Return success with explorer URL
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


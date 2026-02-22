"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedReceipt = exports.ReceiptPayload = exports.ReceiptSignature = exports.ReceiptContext = exports.ReceiptHashes = exports.ReceiptCost = exports.ReceiptModel = exports.ReceiptAction = exports.Visibility = exports.ActionType = void 0;
const zod_1 = require("zod");
// ─── Enums ────────────────────────────────────────────────
exports.ActionType = zod_1.z.enum([
    'tool_call',
    'file_write',
    'file_read',
    'api_request',
    'message_send',
    'skill_exec',
    'code_exec',
    'web_search',
    'model_call',
]);
exports.Visibility = zod_1.z.enum(['private', 'task_only', 'public']);
// ─── Receipt Schema ───────────────────────────────────────
exports.ReceiptAction = zod_1.z.object({
    type: exports.ActionType,
    name: zod_1.z.string().min(1).max(256),
    duration_ms: zod_1.z.number().int().nonnegative(),
});
exports.ReceiptModel = zod_1.z.object({
    provider: zod_1.z.string().min(1).max(64),
    name: zod_1.z.string().min(1).max(128),
    tokens_in: zod_1.z.number().int().nonnegative(),
    tokens_out: zod_1.z.number().int().nonnegative(),
});
exports.ReceiptCost = zod_1.z.object({
    amount_usd: zod_1.z.number().nonnegative(),
    was_routed: zod_1.z.boolean().default(false),
});
exports.ReceiptHashes = zod_1.z.object({
    input_sha256: zod_1.z.string().regex(/^[a-f0-9]{64}$/),
    output_sha256: zod_1.z.string().regex(/^[a-f0-9]{64}$/),
});
exports.ReceiptContext = zod_1.z.object({
    task_id: zod_1.z.string().nullable().default(null),
    session_id: zod_1.z.string().min(1),
    sequence: zod_1.z.number().int().nonnegative(),
});
exports.ReceiptSignature = zod_1.z.object({
    algorithm: zod_1.z.literal('ed25519'),
    public_key: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
});
/**
 * The core receipt payload — the data that gets signed.
 * Signature is NOT included in the signed payload (it's added after).
 */
exports.ReceiptPayload = zod_1.z.object({
    version: zod_1.z.literal('1.0'),
    receipt_id: zod_1.z.string().min(1),
    agent_id: zod_1.z.string().min(1),
    owner_id: zod_1.z.string().min(1),
    timestamp: zod_1.z.string().datetime(),
    action: exports.ReceiptAction,
    model: exports.ReceiptModel,
    cost: exports.ReceiptCost,
    hashes: exports.ReceiptHashes,
    context: exports.ReceiptContext,
    visibility: exports.Visibility.default('private'),
});
/**
 * A complete signed receipt = payload + signature.
 */
exports.SignedReceipt = exports.ReceiptPayload.extend({
    signature: exports.ReceiptSignature,
    server_received_at: zod_1.z.string().datetime().nullable().default(null),
});

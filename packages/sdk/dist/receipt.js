"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptBuilder = void 0;
exports.generateReceiptId = generateReceiptId;
exports.generateSessionId = generateSessionId;
const crypto_1 = require("crypto");
const crypto_2 = require("./crypto");
// ─── ID Generation ────────────────────────────────────────
/**
 * Generate a unique receipt ID.
 * Format: rcpt_ + 12 random alphanumeric chars
 */
function generateReceiptId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = (0, crypto_1.randomBytes)(12);
    let id = 'rcpt_';
    for (let i = 0; i < 12; i++) {
        id += chars[bytes[i] % chars.length];
    }
    return id;
}
/**
 * Generate a session ID.
 */
function generateSessionId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = (0, crypto_1.randomBytes)(8);
    let id = 'sess_';
    for (let i = 0; i < 8; i++) {
        id += chars[bytes[i] % chars.length];
    }
    return id;
}
// ─── Receipt Builder ──────────────────────────────────────
class ReceiptBuilder {
    constructor(config) {
        this.agentId = config.agentId;
        this.ownerId = config.ownerId;
        this.secretKey = config.secretKey;
        this.sessionId = config.sessionId || generateSessionId();
        this.sequence = 0;
        this.defaultVisibility = config.defaultVisibility || 'private';
    }
    /**
     * Build and sign a receipt from action input.
     * The raw input/output are hashed — only hashes are stored in the receipt.
     */
    build(input) {
        const receiptId = generateReceiptId();
        const timestamp = new Date().toISOString();
        const sequence = this.sequence++;
        // Hash input and output — privacy preserved
        const inputHash = (0, crypto_2.sha256)(input.input);
        const outputHash = (0, crypto_2.sha256)(input.output);
        // Build the payload (the data that gets signed)
        const payload = {
            version: '1.0',
            receipt_id: receiptId,
            agent_id: this.agentId,
            owner_id: this.ownerId,
            timestamp,
            action: {
                type: input.action.type,
                name: input.action.name,
                duration_ms: input.action.duration_ms,
            },
            model: {
                provider: input.model.provider,
                name: input.model.name,
                tokens_in: input.model.tokens_in,
                tokens_out: input.model.tokens_out,
            },
            cost: {
                amount_usd: input.cost.amount_usd,
                was_routed: input.cost.was_routed ?? false,
            },
            hashes: {
                input_sha256: inputHash,
                output_sha256: outputHash,
            },
            context: {
                task_id: input.task_id ?? null,
                session_id: this.sessionId,
                sequence,
            },
            visibility: input.visibility ?? this.defaultVisibility,
        };
        // Sign the payload
        const signature = (0, crypto_2.signPayload)(payload, this.secretKey);
        // Return the complete signed receipt
        const signedReceipt = {
            ...payload,
            signature,
            server_received_at: null,
        };
        return signedReceipt;
    }
    /**
     * Get current session ID.
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Get current sequence number (next receipt will have this number).
     */
    getSequence() {
        return this.sequence;
    }
    /**
     * Start a new session (resets sequence counter).
     */
    newSession() {
        this.sessionId = generateSessionId();
        this.sequence = 0;
        return this.sessionId;
    }
}
exports.ReceiptBuilder = ReceiptBuilder;

import { SignedReceipt, ActionType, Visibility } from './types';
/**
 * Generate a unique receipt ID.
 * Format: rcpt_ + 12 random alphanumeric chars
 */
export declare function generateReceiptId(): string;
/**
 * Generate a session ID.
 */
export declare function generateSessionId(): string;
export interface ReceiptInput {
    action: {
        type: ActionType;
        name: string;
        duration_ms: number;
    };
    model: {
        provider: string;
        name: string;
        tokens_in: number;
        tokens_out: number;
    };
    cost: {
        amount_usd: number;
        was_routed?: boolean;
    };
    input: string;
    output: string;
    task_id?: string;
    visibility?: Visibility;
}
export declare class ReceiptBuilder {
    private agentId;
    private ownerId;
    private secretKey;
    private sessionId;
    private sequence;
    private defaultVisibility;
    constructor(config: {
        agentId: string;
        ownerId: string;
        secretKey: string;
        sessionId?: string;
        defaultVisibility?: Visibility;
    });
    /**
     * Build and sign a receipt from action input.
     * The raw input/output are hashed — only hashes are stored in the receipt.
     */
    build(input: ReceiptInput): SignedReceipt;
    /**
     * Get current session ID.
     */
    getSessionId(): string;
    /**
     * Get current sequence number (next receipt will have this number).
     */
    getSequence(): number;
    /**
     * Start a new session (resets sequence counter).
     */
    newSession(): string;
}

import { z } from 'zod';

declare const ActionType: z.ZodEnum<["tool_call", "file_write", "file_read", "api_request", "message_send", "skill_exec", "code_exec", "web_search", "model_call"]>;
type ActionType = z.infer<typeof ActionType>;
declare const Visibility: z.ZodEnum<["private", "task_only", "public"]>;
type Visibility = z.infer<typeof Visibility>;
declare const ReceiptAction: z.ZodObject<{
    type: z.ZodEnum<["tool_call", "file_write", "file_read", "api_request", "message_send", "skill_exec", "code_exec", "web_search", "model_call"]>;
    name: z.ZodString;
    duration_ms: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
    name: string;
    duration_ms: number;
}, {
    type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
    name: string;
    duration_ms: number;
}>;
type ReceiptAction = z.infer<typeof ReceiptAction>;
declare const ReceiptModel: z.ZodObject<{
    provider: z.ZodString;
    name: z.ZodString;
    tokens_in: z.ZodNumber;
    tokens_out: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    provider: string;
    tokens_in: number;
    tokens_out: number;
}, {
    name: string;
    provider: string;
    tokens_in: number;
    tokens_out: number;
}>;
type ReceiptModel = z.infer<typeof ReceiptModel>;
declare const ReceiptCost: z.ZodObject<{
    amount_usd: z.ZodNumber;
    was_routed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    amount_usd: number;
    was_routed: boolean;
}, {
    amount_usd: number;
    was_routed?: boolean | undefined;
}>;
type ReceiptCost = z.infer<typeof ReceiptCost>;
declare const ReceiptHashes: z.ZodObject<{
    input_sha256: z.ZodString;
    output_sha256: z.ZodString;
}, "strip", z.ZodTypeAny, {
    input_sha256: string;
    output_sha256: string;
}, {
    input_sha256: string;
    output_sha256: string;
}>;
type ReceiptHashes = z.infer<typeof ReceiptHashes>;
declare const ReceiptContext: z.ZodObject<{
    task_id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    session_id: z.ZodString;
    sequence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    task_id: string | null;
    session_id: string;
    sequence: number;
}, {
    session_id: string;
    sequence: number;
    task_id?: string | null | undefined;
}>;
type ReceiptContext = z.infer<typeof ReceiptContext>;
declare const ReceiptSignature: z.ZodObject<{
    algorithm: z.ZodLiteral<"ed25519">;
    public_key: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
    algorithm: "ed25519";
    public_key: string;
}, {
    value: string;
    algorithm: "ed25519";
    public_key: string;
}>;
type ReceiptSignature = z.infer<typeof ReceiptSignature>;
/**
 * The core receipt payload — the data that gets signed.
 * Signature is NOT included in the signed payload (it's added after).
 */
declare const ReceiptPayload: z.ZodObject<{
    version: z.ZodLiteral<"1.0">;
    receipt_id: z.ZodString;
    agent_id: z.ZodString;
    owner_id: z.ZodString;
    timestamp: z.ZodString;
    action: z.ZodObject<{
        type: z.ZodEnum<["tool_call", "file_write", "file_read", "api_request", "message_send", "skill_exec", "code_exec", "web_search", "model_call"]>;
        name: z.ZodString;
        duration_ms: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    }, {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    }>;
    model: z.ZodObject<{
        provider: z.ZodString;
        name: z.ZodString;
        tokens_in: z.ZodNumber;
        tokens_out: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    }, {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    }>;
    cost: z.ZodObject<{
        amount_usd: z.ZodNumber;
        was_routed: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        amount_usd: number;
        was_routed: boolean;
    }, {
        amount_usd: number;
        was_routed?: boolean | undefined;
    }>;
    hashes: z.ZodObject<{
        input_sha256: z.ZodString;
        output_sha256: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        input_sha256: string;
        output_sha256: string;
    }, {
        input_sha256: string;
        output_sha256: string;
    }>;
    context: z.ZodObject<{
        task_id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        session_id: z.ZodString;
        sequence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        task_id: string | null;
        session_id: string;
        sequence: number;
    }, {
        session_id: string;
        sequence: number;
        task_id?: string | null | undefined;
    }>;
    visibility: z.ZodDefault<z.ZodEnum<["private", "task_only", "public"]>>;
}, "strip", z.ZodTypeAny, {
    version: "1.0";
    receipt_id: string;
    agent_id: string;
    owner_id: string;
    timestamp: string;
    action: {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    };
    model: {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    };
    cost: {
        amount_usd: number;
        was_routed: boolean;
    };
    hashes: {
        input_sha256: string;
        output_sha256: string;
    };
    context: {
        task_id: string | null;
        session_id: string;
        sequence: number;
    };
    visibility: "private" | "task_only" | "public";
}, {
    version: "1.0";
    receipt_id: string;
    agent_id: string;
    owner_id: string;
    timestamp: string;
    action: {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    };
    model: {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    };
    cost: {
        amount_usd: number;
        was_routed?: boolean | undefined;
    };
    hashes: {
        input_sha256: string;
        output_sha256: string;
    };
    context: {
        session_id: string;
        sequence: number;
        task_id?: string | null | undefined;
    };
    visibility?: "private" | "task_only" | "public" | undefined;
}>;
type ReceiptPayload = z.infer<typeof ReceiptPayload>;
/**
 * A complete signed receipt = payload + signature.
 */
declare const SignedReceipt: z.ZodObject<{
    version: z.ZodLiteral<"1.0">;
    receipt_id: z.ZodString;
    agent_id: z.ZodString;
    owner_id: z.ZodString;
    timestamp: z.ZodString;
    action: z.ZodObject<{
        type: z.ZodEnum<["tool_call", "file_write", "file_read", "api_request", "message_send", "skill_exec", "code_exec", "web_search", "model_call"]>;
        name: z.ZodString;
        duration_ms: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    }, {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    }>;
    model: z.ZodObject<{
        provider: z.ZodString;
        name: z.ZodString;
        tokens_in: z.ZodNumber;
        tokens_out: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    }, {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    }>;
    cost: z.ZodObject<{
        amount_usd: z.ZodNumber;
        was_routed: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        amount_usd: number;
        was_routed: boolean;
    }, {
        amount_usd: number;
        was_routed?: boolean | undefined;
    }>;
    hashes: z.ZodObject<{
        input_sha256: z.ZodString;
        output_sha256: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        input_sha256: string;
        output_sha256: string;
    }, {
        input_sha256: string;
        output_sha256: string;
    }>;
    context: z.ZodObject<{
        task_id: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        session_id: z.ZodString;
        sequence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        task_id: string | null;
        session_id: string;
        sequence: number;
    }, {
        session_id: string;
        sequence: number;
        task_id?: string | null | undefined;
    }>;
    visibility: z.ZodDefault<z.ZodEnum<["private", "task_only", "public"]>>;
} & {
    signature: z.ZodObject<{
        algorithm: z.ZodLiteral<"ed25519">;
        public_key: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        algorithm: "ed25519";
        public_key: string;
    }, {
        value: string;
        algorithm: "ed25519";
        public_key: string;
    }>;
    server_received_at: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    version: "1.0";
    receipt_id: string;
    agent_id: string;
    owner_id: string;
    timestamp: string;
    action: {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    };
    model: {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    };
    cost: {
        amount_usd: number;
        was_routed: boolean;
    };
    hashes: {
        input_sha256: string;
        output_sha256: string;
    };
    context: {
        task_id: string | null;
        session_id: string;
        sequence: number;
    };
    visibility: "private" | "task_only" | "public";
    signature: {
        value: string;
        algorithm: "ed25519";
        public_key: string;
    };
    server_received_at: string | null;
}, {
    version: "1.0";
    receipt_id: string;
    agent_id: string;
    owner_id: string;
    timestamp: string;
    action: {
        type: "tool_call" | "file_write" | "file_read" | "api_request" | "message_send" | "skill_exec" | "code_exec" | "web_search" | "model_call";
        name: string;
        duration_ms: number;
    };
    model: {
        name: string;
        provider: string;
        tokens_in: number;
        tokens_out: number;
    };
    cost: {
        amount_usd: number;
        was_routed?: boolean | undefined;
    };
    hashes: {
        input_sha256: string;
        output_sha256: string;
    };
    context: {
        session_id: string;
        sequence: number;
        task_id?: string | null | undefined;
    };
    signature: {
        value: string;
        algorithm: "ed25519";
        public_key: string;
    };
    visibility?: "private" | "task_only" | "public" | undefined;
    server_received_at?: string | null | undefined;
}>;
type SignedReceipt = z.infer<typeof SignedReceipt>;
interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}
interface SerializedKeyPair {
    publicKey: string;
    secretKey: string;
}
interface OpenClawScanConfig {
    agentId: string;
    ownerId: string;
    apiKey?: string;
    apiUrl?: string;
    secretKey: string;
    autoCapture?: boolean;
    defaultVisibility?: Visibility;
    localBackupPath?: string;
    onReceipt?: (receipt: SignedReceipt) => void;
}
interface SubmitReceiptResponse {
    receipt_id: string;
    explorer_url: string;
    server_received_at: string;
}
interface VerifyResult {
    signature_valid: boolean;
    hash_match: boolean | null;
    receipt_registered: boolean;
    timestamp: string;
    agent_id: string;
    details: {
        public_key: string;
        algorithm: string;
    };
}
interface TaskCreate {
    agent_id: string;
    name: string;
    description?: string;
}
interface TaskInfo {
    task_id: string;
    slug: string;
    share_url: string;
    status: 'active' | 'completed' | 'failed';
    total_receipts: number;
    total_duration_ms: number;
    total_cost_usd: number;
}

/**
 * Generate a unique receipt ID.
 * Format: rcpt_ + 12 random alphanumeric chars
 */
declare function generateReceiptId(): string;
/**
 * Generate a session ID.
 */
declare function generateSessionId(): string;
interface ReceiptInput {
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
declare class ReceiptBuilder {
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

/**
 * Generate a new Ed25519 keypair for signing receipts.
 * Call this once when setting up an agent. Save the keys securely.
 */
declare function generateKeyPair(): KeyPair;
/**
 * Serialize a keypair to base64 strings for storage.
 */
declare function serializeKeyPair(kp: KeyPair): SerializedKeyPair;
/**
 * Deserialize a keypair from base64 strings.
 */
declare function deserializeKeyPair(skp: SerializedKeyPair): KeyPair;
/**
 * Get public key from a base64-encoded secret key.
 */
declare function publicKeyFromSecret(secretKeyBase64: string): string;
/**
 * Compute SHA-256 hash of any string data.
 * Returns lowercase hex string (64 chars).
 */
declare function sha256(data: string): string;
/**
 * Verify a signed receipt's signature.
 * Returns true if the signature is valid for the given payload.
 */
declare function verifySignature(payload: ReceiptPayload, signature: ReceiptSignature): boolean;
/**
 * Verify that an original data string matches a SHA-256 hash.
 */
declare function verifyHash(originalData: string, expectedHash: string): boolean;
/**
 * Full verification of a signed receipt.
 * Optionally verifies output hash against original data.
 */
declare function verifyReceipt(receipt: {
    signature: ReceiptSignature;
} & ReceiptPayload, originalOutput?: string): {
    signatureValid: boolean;
    hashMatch: boolean | null;
};

/**
 * Local receipt backup.
 * Saves every receipt as a JSON line in a daily log file.
 * This ensures the agent owner always has an independent copy
 * of their receipts, regardless of the server.
 *
 * File structure:
 *   ~/.openclawscan/receipts/
 *     2026-02-21.jsonl
 *     2026-02-22.jsonl
 */
declare class LocalBackup {
    private backupDir;
    constructor(backupDir?: string);
    private ensureDir;
    /**
     * Save a receipt to the local backup.
     * Appends as a single JSON line to today's log file.
     */
    save(receipt: SignedReceipt): void;
    /**
     * Get the backup directory path.
     */
    getPath(): string;
}

/**
 * HTTP client for the OpenClawScan API.
 * Handles receipt submission, task management, and verification.
 */
declare class ApiClient {
    private apiUrl;
    private apiKey;
    constructor(apiUrl?: string, apiKey?: string);
    private request;
    /**
     * Submit a signed receipt to the server.
     */
    submitReceipt(receipt: SignedReceipt): Promise<SubmitReceiptResponse>;
    /**
     * Create a new task (group of receipts).
     */
    createTask(task: TaskCreate): Promise<TaskInfo>;
    /**
     * Complete a task and get the shareable URL.
     */
    completeTask(taskId: string): Promise<TaskInfo>;
    /**
     * Get task info.
     */
    getTask(taskId: string): Promise<TaskInfo>;
}

/**
 * OpenClawScan SDK
 *
 * Cryptographically signed receipts for AI agent actions.
 *
 * Usage:
 *
 *   import { OpenClawScan, generateKeyPair, serializeKeyPair } from '@openclawscan/sdk';
 *
 *   // First time: generate keys
 *   const keys = generateKeyPair();
 *   const serialized = serializeKeyPair(keys);
 *   // Save serialized.secretKey securely!
 *
 *   // Initialize
 *   const scanner = new OpenClawScan({
 *     agentId: 'my-agent',
 *     ownerId: 'github:myuser',
 *     secretKey: serialized.secretKey,
 *   });
 *
 *   // Generate a receipt
 *   const receipt = scanner.capture({
 *     action: { type: 'tool_call', name: 'web_search', duration_ms: 1200 },
 *     model: { provider: 'anthropic', name: 'claude-sonnet-4-5', tokens_in: 500, tokens_out: 1200 },
 *     cost: { amount_usd: 0.015 },
 *     input: 'search query text',
 *     output: 'search results text',
 *   });
 *
 *   // Verify a receipt
 *   const result = OpenClawScan.verify(receipt, 'search results text');
 *   // { signatureValid: true, hashMatch: true }
 */

declare class OpenClawScan {
    private builder;
    private backup;
    private api;
    private config;
    private activeTaskId;
    constructor(config: OpenClawScanConfig);
    /**
     * Capture an action and generate a signed receipt.
     * The receipt is saved locally and optionally sent to the server.
     */
    capture(input: ReceiptInput): Promise<SignedReceipt>;
    /**
     * Capture an action synchronously (no server submission).
     * Useful for high-frequency actions where you don't want to wait for HTTP.
     */
    captureSync(input: ReceiptInput): SignedReceipt;
    /**
     * Start a new task. All subsequent receipts will be grouped under this task.
     */
    startTask(task: TaskCreate): Promise<TaskInfo>;
    /**
     * Complete the active task and get a shareable link.
     */
    completeTask(): Promise<TaskInfo>;
    /**
     * Get current session ID.
     */
    getSessionId(): string;
    /**
     * Start a new session.
     */
    newSession(): string;
    /**
     * Get the local backup path.
     */
    getBackupPath(): string;
    /**
     * Verify a signed receipt (static method — no instance needed).
     * Anyone can verify a receipt without an API key or server.
     */
    static verify(receipt: SignedReceipt, originalOutput?: string): {
        signatureValid: boolean;
        hashMatch: boolean | null;
    };
}

export { ActionType, ApiClient, type KeyPair, LocalBackup, OpenClawScan, type OpenClawScanConfig, ReceiptAction, ReceiptBuilder, ReceiptContext, ReceiptCost, ReceiptHashes, type ReceiptInput, ReceiptModel, ReceiptPayload, ReceiptSignature, type SerializedKeyPair, SignedReceipt, type SubmitReceiptResponse, type TaskCreate, type TaskInfo, type VerifyResult, Visibility, deserializeKeyPair, generateKeyPair, generateReceiptId, generateSessionId, publicKeyFromSecret, serializeKeyPair, sha256, verifyHash, verifyReceipt, verifySignature };

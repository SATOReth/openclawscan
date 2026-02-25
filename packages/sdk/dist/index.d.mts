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
 * Encrypted fields are NOT part of the signed payload either.
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
/**
 * v1.1: A signed receipt with optional E2E encrypted fields.
 * The encrypted fields are transport-only — they are NOT part
 * of the signed payload (the hashes in the payload verify them).
 *
 * Flow:
 *   1. SHA-256(raw_input) → hashes.input_sha256 (in signed payload)
 *   2. AES-GCM-encrypt(raw_input, viewing_key) → encrypted_input (transport)
 *   3. Verifier decrypts → SHA-256(decrypted) must match hashes.input_sha256
 */
declare const EncryptedReceipt: z.ZodObject<{
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
} & {
    encrypted_input: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    encrypted_output: z.ZodDefault<z.ZodNullable<z.ZodString>>;
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
    encrypted_input: string | null;
    encrypted_output: string | null;
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
    encrypted_input?: string | null | undefined;
    encrypted_output?: string | null | undefined;
}>;
type EncryptedReceipt = z.infer<typeof EncryptedReceipt>;
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
/**
 * v1.1: Task creation with E2E encryption support.
 * key_hash allows the server to confirm key correctness
 * without ever seeing the actual viewing key.
 */
interface EncryptedTaskCreate extends TaskCreate {
    key_hash: string;
}
interface TaskInfo {
    task_id: string;
    slug: string;
    share_url: string;
    status: 'active' | 'completed' | 'failed';
    total_receipts: number;
    total_duration_ms: number;
    total_cost_usd: number;
    key_hash?: string | null;
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
    private viewingKey;
    constructor(config: {
        agentId: string;
        ownerId: string;
        secretKey: string;
        sessionId?: string;
        defaultVisibility?: Visibility;
        viewingKey?: string;
    });
    /**
     * Build and sign a receipt from action input.
     * The raw input/output are hashed — only hashes are stored in the signed payload.
     *
     * v1.1: If a viewing key is set, also encrypts raw input/output with AES-256-GCM.
     * The encrypted fields are NOT part of the signed payload — they're transport-only.
     * Verification: decrypt(encrypted_input) → SHA-256 must match hashes.input_sha256
     */
    build(input: ReceiptInput): EncryptedReceipt;
    /**
     * Set or update the viewing key for E2E encryption.
     * Called when starting a new encrypted task.
     */
    setViewingKey(key: string | null): void;
    /**
     * Check if E2E encryption is active.
     */
    hasViewingKey(): boolean;
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
 * Generate a random AES-256-GCM viewing key for a task.
 * Returns a base64url-encoded 32-byte key (URL-safe, no padding).
 *
 * This key goes in the URL fragment: /task/slug#key=THIS_VALUE
 * The fragment is never sent to the server (per HTTP spec).
 */
declare function generateViewingKey(): string;
/**
 * Encrypt a plaintext string with AES-256-GCM.
 *
 * @param plaintext - The raw data to encrypt (input or output string)
 * @param viewingKeyBase64Url - The task's viewing key (base64url)
 * @returns base64-encoded blob: IV (12B) || ciphertext || authTag (16B)
 */
declare function encryptField(plaintext: string, viewingKeyBase64Url: string): string;
/**
 * Decrypt an AES-256-GCM encrypted blob back to plaintext.
 *
 * @param encryptedBase64 - base64-encoded blob: IV (12B) || ciphertext || authTag (16B)
 * @param viewingKeyBase64Url - The task's viewing key (base64url)
 * @returns The original plaintext string
 * @throws Error if decryption fails (wrong key, tampered data)
 */
declare function decryptField(encryptedBase64: string, viewingKeyBase64Url: string): string;
/**
 * Hash the viewing key with SHA-256.
 * Stored in tasks.key_hash so the frontend can verify
 * the user has the correct key BEFORE attempting decryption.
 *
 * The server never sees the actual key — only this hash.
 */
declare function hashViewingKey(viewingKeyBase64Url: string): string;
/**
 * Convert raw bytes to base64url string (no padding).
 */
declare function toBase64Url(buffer: Buffer | Uint8Array): string;
/**
 * Convert base64url string back to Buffer.
 */
declare function fromBase64Url(base64url: string): Buffer;

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
     * v1.1: Also sends encrypted_input/encrypted_output if present.
     */
    submitReceipt(receipt: SignedReceipt | EncryptedReceipt): Promise<SubmitReceiptResponse>;
    /**
     * Submit multiple receipts in a batch.
     */
    submitBatch(receipts: (SignedReceipt | EncryptedReceipt)[]): Promise<SubmitReceiptResponse[]>;
    /**
     * Create a new task (group of receipts).
     * v1.1: Can include key_hash for E2E encrypted tasks.
     */
    createTask(task: TaskCreate | EncryptedTaskCreate): Promise<TaskInfo>;
    /**
     * Complete a task and get the shareable URL.
     * v1.1: Can include encrypted_summary.
     */
    completeTask(taskId: string, options?: {
        encrypted_summary?: string;
    }): Promise<TaskInfo>;
    /**
     * Get task info.
     */
    getTask(taskId: string): Promise<TaskInfo>;
}

/**
 * OpenClawScan SDK v1.1
 *
 * Cryptographically signed receipts for AI agent actions.
 * Now with E2E encryption — raw input/output encrypted client-side,
 * server stores only encrypted blobs + SHA-256 hashes.
 *
 * === v1.0 Usage (hash-only, backward compatible): ===
 *
 *   const scanner = new OpenClawScan({
 *     agentId: 'my-agent',
 *     ownerId: 'github:myuser',
 *     secretKey: serialized.secretKey,
 *   });
 *
 *   const receipt = await scanner.capture({ ... });
 *
 * === v1.1 Usage (E2E encrypted): ===
 *
 *   const scanner = new OpenClawScan({
 *     agentId: 'my-agent',
 *     ownerId: 'github:myuser',
 *     secretKey: serialized.secretKey,
 *   });
 *
 *   // Start an encrypted task — generates a viewing key automatically
 *   const { taskInfo, viewingKey } = await scanner.startEncryptedTask({
 *     agent_id: 'my-agent',
 *     name: 'Smart Contract Audit',
 *   });
 *
 *   // Capture actions — auto-encrypted with task's viewing key
 *   await scanner.capture({ ... });
 *
 *   // Complete and share — key goes in URL fragment (never sent to server)
 *   const completed = await scanner.completeTask();
 *   const shareUrl = `${completed.share_url}#key=${viewingKey}`;
 *   // → https://openclawscan.xyz/task/abc123#key=BASE64URL_KEY
 */

declare class OpenClawScan {
    private builder;
    private backup;
    private api;
    private config;
    private activeTaskId;
    private activeViewingKey;
    constructor(config: OpenClawScanConfig);
    /**
     * Capture an action and generate a signed receipt.
     * The receipt is saved locally and optionally sent to the server.
     *
     * v1.1: If an encrypted task is active, raw input/output are also
     * encrypted with AES-256-GCM before being sent to the server.
     */
    capture(input: ReceiptInput): Promise<EncryptedReceipt>;
    /**
     * Capture an action synchronously (no server submission).
     * Useful for high-frequency actions where you don't want to wait for HTTP.
     */
    captureSync(input: ReceiptInput): EncryptedReceipt;
    /**
     * Start a new task (v1.0 — no encryption).
     * All subsequent receipts will be grouped under this task.
     */
    startTask(task: TaskCreate): Promise<TaskInfo>;
    /**
     * v1.1: Start a new E2E encrypted task.
     * Generates a random AES-256-GCM viewing key automatically.
     * All subsequent receipts will have their input/output encrypted.
     *
     * Returns both the task info and the viewing key.
     * The viewing key is for the share URL: /task/slug#key=VIEWING_KEY
     *
     * IMPORTANT: Store the viewing key! It's not recoverable from the server.
     */
    startEncryptedTask(task: TaskCreate): Promise<{
        taskInfo: TaskInfo;
        viewingKey: string;
    }>;
    /**
     * Complete the active task and get a shareable link.
     * v1.1: Can include an encrypted summary of the task results.
     */
    completeTask(summary?: string): Promise<TaskInfo>;
    /**
     * Get the viewing key for the currently active encrypted task.
     * Returns null if no encrypted task is active or if using v1.0 mode.
     *
     * Use this to build the share URL:
     *   `${taskInfo.share_url}#key=${scanner.getViewingKey()}`
     */
    getViewingKey(): string | null;
    /**
     * Check if E2E encryption is currently active.
     */
    isEncrypted(): boolean;
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

export { ActionType, ApiClient, EncryptedReceipt, type EncryptedTaskCreate, type KeyPair, LocalBackup, OpenClawScan, type OpenClawScanConfig, ReceiptAction, ReceiptBuilder, ReceiptContext, ReceiptCost, ReceiptHashes, type ReceiptInput, ReceiptModel, ReceiptPayload, ReceiptSignature, type SerializedKeyPair, SignedReceipt, type SubmitReceiptResponse, type TaskCreate, type TaskInfo, type VerifyResult, Visibility, decryptField, deserializeKeyPair, encryptField, fromBase64Url, generateKeyPair, generateReceiptId, generateSessionId, generateViewingKey, hashViewingKey, publicKeyFromSecret, serializeKeyPair, sha256, toBase64Url, verifyHash, verifyReceipt, verifySignature };

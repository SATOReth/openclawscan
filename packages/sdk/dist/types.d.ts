import { z } from 'zod';
export declare const ActionType: z.ZodEnum<["tool_call", "file_write", "file_read", "api_request", "message_send", "skill_exec", "code_exec", "web_search", "model_call"]>;
export type ActionType = z.infer<typeof ActionType>;
export declare const Visibility: z.ZodEnum<["private", "task_only", "public"]>;
export type Visibility = z.infer<typeof Visibility>;
export declare const ReceiptAction: z.ZodObject<{
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
export type ReceiptAction = z.infer<typeof ReceiptAction>;
export declare const ReceiptModel: z.ZodObject<{
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
export type ReceiptModel = z.infer<typeof ReceiptModel>;
export declare const ReceiptCost: z.ZodObject<{
    amount_usd: z.ZodNumber;
    was_routed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    amount_usd: number;
    was_routed: boolean;
}, {
    amount_usd: number;
    was_routed?: boolean | undefined;
}>;
export type ReceiptCost = z.infer<typeof ReceiptCost>;
export declare const ReceiptHashes: z.ZodObject<{
    input_sha256: z.ZodString;
    output_sha256: z.ZodString;
}, "strip", z.ZodTypeAny, {
    input_sha256: string;
    output_sha256: string;
}, {
    input_sha256: string;
    output_sha256: string;
}>;
export type ReceiptHashes = z.infer<typeof ReceiptHashes>;
export declare const ReceiptContext: z.ZodObject<{
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
export type ReceiptContext = z.infer<typeof ReceiptContext>;
export declare const ReceiptSignature: z.ZodObject<{
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
export type ReceiptSignature = z.infer<typeof ReceiptSignature>;
/**
 * The core receipt payload — the data that gets signed.
 * Signature is NOT included in the signed payload (it's added after).
 */
export declare const ReceiptPayload: z.ZodObject<{
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
export type ReceiptPayload = z.infer<typeof ReceiptPayload>;
/**
 * A complete signed receipt = payload + signature.
 */
export declare const SignedReceipt: z.ZodObject<{
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
export type SignedReceipt = z.infer<typeof SignedReceipt>;
export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}
export interface SerializedKeyPair {
    publicKey: string;
    secretKey: string;
}
export interface OpenClawScanConfig {
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
export interface SubmitReceiptResponse {
    receipt_id: string;
    explorer_url: string;
    server_received_at: string;
}
export interface VerifyResult {
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
export interface TaskCreate {
    agent_id: string;
    name: string;
    description?: string;
}
export interface TaskInfo {
    task_id: string;
    slug: string;
    share_url: string;
    status: 'active' | 'completed' | 'failed';
    total_receipts: number;
    total_duration_ms: number;
    total_cost_usd: number;
}

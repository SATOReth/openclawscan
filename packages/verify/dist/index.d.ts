/**
 * @openclawscan/verify
 *
 * Lightweight standalone receipt verification.
 * Use this if you're a marketplace, client, or auditor who needs
 * to verify OpenClawScan receipts without installing the full SDK.
 *
 * Usage:
 *
 *   import { verifyReceipt } from '@openclawscan/verify';
 *
 *   const result = verifyReceipt(receiptJson);
 *   console.log(result.valid);        // true/false
 *   console.log(result.details);      // { signatureValid, payloadIntact, ... }
 *
 *   // Or verify a specific output matches the hash:
 *   const result2 = verifyReceipt(receiptJson, { output: 'the actual output text' });
 *   console.log(result2.hashMatch);   // true/false
 */
export interface ReceiptJson {
    version: string;
    receipt_id: string;
    agent_id: string;
    owner_id: string;
    timestamp: string;
    action: {
        type: string;
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
    visibility: string;
    signature: {
        algorithm: string;
        public_key: string;
        value: string;
    };
    server_received_at?: string | null;
}
export interface VerifyOptions {
    output?: string;
    input?: string;
}
export interface VerifyResult {
    valid: boolean;
    details: {
        signatureValid: boolean;
        supportedVersion: boolean;
        supportedAlgorithm: boolean;
        inputHashMatch: boolean | null;
        outputHashMatch: boolean | null;
    };
    receipt: {
        id: string;
        agent: string;
        timestamp: string;
        action: string;
        model: string;
        cost_usd: number;
    };
}
/**
 * Verify a signed OpenClawScan receipt.
 *
 * Checks:
 * 1. Signature is valid (Ed25519)
 * 2. Version and algorithm are supported
 * 3. Optionally: input/output match their SHA-256 hashes
 */
export declare function verifyReceipt(receipt: ReceiptJson, options?: VerifyOptions): VerifyResult;
export default verifyReceipt;

// src/receipt.ts
import { randomBytes } from "crypto";

// src/crypto.ts
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";
import { createHash } from "crypto";
function generateKeyPair() {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey
  };
}
function serializeKeyPair(kp) {
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey)
  };
}
function deserializeKeyPair(skp) {
  return {
    publicKey: decodeBase64(skp.publicKey),
    secretKey: decodeBase64(skp.secretKey)
  };
}
function publicKeyFromSecret(secretKeyBase64) {
  const secretKey = decodeBase64(secretKeyBase64);
  const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
  return encodeBase64(keyPair.publicKey);
}
function sha256(data) {
  return createHash("sha256").update(data, "utf8").digest("hex");
}
function deepSortKeys(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepSortKeys);
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = deepSortKeys(obj[key]);
  }
  return sorted;
}
function payloadToBytes(payload) {
  const sorted = deepSortKeys(payload);
  const json = JSON.stringify(sorted);
  return new TextEncoder().encode(json);
}
function signPayload(payload, secretKeyBase64) {
  const secretKey = decodeBase64(secretKeyBase64);
  const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
  const messageBytes = payloadToBytes(payload);
  const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
  return {
    algorithm: "ed25519",
    public_key: encodeBase64(keyPair.publicKey),
    value: encodeBase64(signatureBytes)
  };
}
function verifySignature(payload, signature) {
  try {
    if (signature.algorithm !== "ed25519") return false;
    const publicKey = decodeBase64(signature.public_key);
    const signatureBytes = decodeBase64(signature.value);
    const messageBytes = payloadToBytes(payload);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch {
    return false;
  }
}
function verifyHash(originalData, expectedHash) {
  return sha256(originalData) === expectedHash;
}
function verifyReceipt(receipt, originalOutput) {
  const { signature, server_received_at, ...payload } = receipt;
  const signatureValid = verifySignature(payload, signature);
  let hashMatch = null;
  if (originalOutput !== void 0) {
    hashMatch = verifyHash(originalOutput, payload.hashes.output_sha256);
  }
  return { signatureValid, hashMatch };
}

// src/receipt.ts
function generateReceiptId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(12);
  let id = "rcpt_";
  for (let i = 0; i < 12; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}
function generateSessionId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  let id = "sess_";
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}
var ReceiptBuilder = class {
  constructor(config) {
    this.agentId = config.agentId;
    this.ownerId = config.ownerId;
    this.secretKey = config.secretKey;
    this.sessionId = config.sessionId || generateSessionId();
    this.sequence = 0;
    this.defaultVisibility = config.defaultVisibility || "private";
  }
  /**
   * Build and sign a receipt from action input.
   * The raw input/output are hashed — only hashes are stored in the receipt.
   */
  build(input) {
    const receiptId = generateReceiptId();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const sequence = this.sequence++;
    const inputHash = sha256(input.input);
    const outputHash = sha256(input.output);
    const payload = {
      version: "1.0",
      receipt_id: receiptId,
      agent_id: this.agentId,
      owner_id: this.ownerId,
      timestamp,
      action: {
        type: input.action.type,
        name: input.action.name,
        duration_ms: input.action.duration_ms
      },
      model: {
        provider: input.model.provider,
        name: input.model.name,
        tokens_in: input.model.tokens_in,
        tokens_out: input.model.tokens_out
      },
      cost: {
        amount_usd: input.cost.amount_usd,
        was_routed: input.cost.was_routed ?? false
      },
      hashes: {
        input_sha256: inputHash,
        output_sha256: outputHash
      },
      context: {
        task_id: input.task_id ?? null,
        session_id: this.sessionId,
        sequence
      },
      visibility: input.visibility ?? this.defaultVisibility
    };
    const signature = signPayload(payload, this.secretKey);
    const signedReceipt = {
      ...payload,
      signature,
      server_received_at: null
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
};

// src/backup.ts
import { mkdirSync, appendFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
var DEFAULT_BACKUP_DIR = join(homedir(), ".openclawscan", "receipts");
var LocalBackup = class {
  constructor(backupDir) {
    this.backupDir = backupDir || DEFAULT_BACKUP_DIR;
    this.ensureDir();
  }
  ensureDir() {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }
  /**
   * Save a receipt to the local backup.
   * Appends as a single JSON line to today's log file.
   */
  save(receipt) {
    try {
      const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const filePath = join(this.backupDir, `${date}.jsonl`);
      const line = JSON.stringify(receipt) + "\n";
      appendFileSync(filePath, line, "utf8");
    } catch (err) {
      console.error("[OpenClawScan] Local backup failed:", err);
    }
  }
  /**
   * Get the backup directory path.
   */
  getPath() {
    return this.backupDir;
  }
};

// src/api.ts
var DEFAULT_API_URL = "https://openclawscan.xyz/api";
var ApiClient = class {
  constructor(apiUrl, apiKey) {
    this.apiUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, "");
    this.apiKey = apiKey;
  }
  async request(method, path, body) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Unknown error");
      throw new Error(
        `OpenClawScan API error: ${res.status} ${res.statusText} \u2014 ${errorBody}`
      );
    }
    return res.json();
  }
  /**
   * Submit a signed receipt to the server.
   */
  async submitReceipt(receipt) {
    return this.request("POST", "/receipts", receipt);
  }
  /**
   * Create a new task (group of receipts).
   */
  async createTask(task) {
    return this.request("POST", "/tasks", task);
  }
  /**
   * Complete a task and get the shareable URL.
   */
  async completeTask(taskId) {
    return this.request("PATCH", `/tasks/${taskId}`, {
      status: "completed"
    });
  }
  /**
   * Get task info.
   */
  async getTask(taskId) {
    return this.request("GET", `/tasks/${taskId}`);
  }
};

// src/index.ts
var OpenClawScan = class {
  constructor(config) {
    this.activeTaskId = null;
    this.config = config;
    this.builder = new ReceiptBuilder({
      agentId: config.agentId,
      ownerId: config.ownerId,
      secretKey: config.secretKey,
      defaultVisibility: config.defaultVisibility
    });
    this.backup = new LocalBackup(config.localBackupPath);
    this.api = new ApiClient(config.apiUrl, config.apiKey);
  }
  /**
   * Capture an action and generate a signed receipt.
   * The receipt is saved locally and optionally sent to the server.
   */
  async capture(input) {
    if (this.activeTaskId && !input.task_id) {
      input.task_id = this.activeTaskId;
    }
    const receipt = this.builder.build(input);
    this.backup.save(receipt);
    if (this.config.apiKey) {
      try {
        const response = await this.api.submitReceipt(receipt);
        receipt.server_received_at = response.server_received_at;
      } catch (err) {
        console.error("[OpenClawScan] Failed to submit receipt to server:", err);
      }
    }
    if (this.config.onReceipt) {
      this.config.onReceipt(receipt);
    }
    return receipt;
  }
  /**
   * Capture an action synchronously (no server submission).
   * Useful for high-frequency actions where you don't want to wait for HTTP.
   */
  captureSync(input) {
    if (this.activeTaskId && !input.task_id) {
      input.task_id = this.activeTaskId;
    }
    const receipt = this.builder.build(input);
    this.backup.save(receipt);
    if (this.config.onReceipt) {
      this.config.onReceipt(receipt);
    }
    return receipt;
  }
  /**
   * Start a new task. All subsequent receipts will be grouped under this task.
   */
  async startTask(task) {
    const info = await this.api.createTask(task);
    this.activeTaskId = info.task_id;
    return info;
  }
  /**
   * Complete the active task and get a shareable link.
   */
  async completeTask() {
    if (!this.activeTaskId) {
      throw new Error("No active task to complete");
    }
    const info = await this.api.completeTask(this.activeTaskId);
    this.activeTaskId = null;
    return info;
  }
  /**
   * Get current session ID.
   */
  getSessionId() {
    return this.builder.getSessionId();
  }
  /**
   * Start a new session.
   */
  newSession() {
    return this.builder.newSession();
  }
  /**
   * Get the local backup path.
   */
  getBackupPath() {
    return this.backup.getPath();
  }
  /**
   * Verify a signed receipt (static method — no instance needed).
   * Anyone can verify a receipt without an API key or server.
   */
  static verify(receipt, originalOutput) {
    return verifyReceipt(receipt, originalOutput);
  }
};
export {
  ApiClient,
  LocalBackup,
  OpenClawScan,
  ReceiptBuilder,
  deserializeKeyPair,
  generateKeyPair,
  generateReceiptId,
  generateSessionId,
  publicKeyFromSecret,
  serializeKeyPair,
  sha256,
  verifyHash,
  verifyReceipt,
  verifySignature
};

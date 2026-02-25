"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiClient: () => ApiClient,
  LocalBackup: () => LocalBackup,
  OpenClawScan: () => OpenClawScan,
  ReceiptBuilder: () => ReceiptBuilder,
  decryptField: () => decryptField,
  deserializeKeyPair: () => deserializeKeyPair,
  encryptField: () => encryptField,
  fromBase64Url: () => fromBase64Url,
  generateKeyPair: () => generateKeyPair,
  generateReceiptId: () => generateReceiptId,
  generateSessionId: () => generateSessionId,
  generateViewingKey: () => generateViewingKey,
  hashViewingKey: () => hashViewingKey,
  publicKeyFromSecret: () => publicKeyFromSecret,
  serializeKeyPair: () => serializeKeyPair,
  sha256: () => sha256,
  toBase64Url: () => toBase64Url,
  verifyHash: () => verifyHash,
  verifyReceipt: () => verifyReceipt,
  verifySignature: () => verifySignature
});
module.exports = __toCommonJS(index_exports);

// src/receipt.ts
var import_crypto2 = require("crypto");

// src/crypto.ts
var import_tweetnacl = __toESM(require("tweetnacl"));
var import_tweetnacl_util = require("tweetnacl-util");
var import_crypto = require("crypto");
function generateKeyPair() {
  const kp = import_tweetnacl.default.sign.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey
  };
}
function serializeKeyPair(kp) {
  return {
    publicKey: (0, import_tweetnacl_util.encodeBase64)(kp.publicKey),
    secretKey: (0, import_tweetnacl_util.encodeBase64)(kp.secretKey)
  };
}
function deserializeKeyPair(skp) {
  return {
    publicKey: (0, import_tweetnacl_util.decodeBase64)(skp.publicKey),
    secretKey: (0, import_tweetnacl_util.decodeBase64)(skp.secretKey)
  };
}
function publicKeyFromSecret(secretKeyBase64) {
  const secretKey = (0, import_tweetnacl_util.decodeBase64)(secretKeyBase64);
  const keyPair = import_tweetnacl.default.sign.keyPair.fromSecretKey(secretKey);
  return (0, import_tweetnacl_util.encodeBase64)(keyPair.publicKey);
}
function sha256(data) {
  return (0, import_crypto.createHash)("sha256").update(data, "utf8").digest("hex");
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
  const secretKey = (0, import_tweetnacl_util.decodeBase64)(secretKeyBase64);
  const keyPair = import_tweetnacl.default.sign.keyPair.fromSecretKey(secretKey);
  const messageBytes = payloadToBytes(payload);
  const signatureBytes = import_tweetnacl.default.sign.detached(messageBytes, secretKey);
  return {
    algorithm: "ed25519",
    public_key: (0, import_tweetnacl_util.encodeBase64)(keyPair.publicKey),
    value: (0, import_tweetnacl_util.encodeBase64)(signatureBytes)
  };
}
function verifySignature(payload, signature) {
  try {
    if (signature.algorithm !== "ed25519") return false;
    const publicKey = (0, import_tweetnacl_util.decodeBase64)(signature.public_key);
    const signatureBytes = (0, import_tweetnacl_util.decodeBase64)(signature.value);
    const messageBytes = payloadToBytes(payload);
    return import_tweetnacl.default.sign.detached.verify(messageBytes, signatureBytes, publicKey);
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
function generateViewingKey() {
  const key = (0, import_crypto.randomBytes)(32);
  return toBase64Url(key);
}
function encryptField(plaintext, viewingKeyBase64Url) {
  const key = fromBase64Url(viewingKeyBase64Url);
  const iv = (0, import_crypto.randomBytes)(12);
  const cipher = (0, import_crypto.createCipheriv)("aes-256-gcm", key, iv);
  const plaintextBytes = Buffer.from(plaintext, "utf8");
  const encrypted = Buffer.concat([
    cipher.update(plaintextBytes),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, encrypted, authTag]);
  return blob.toString("base64");
}
function decryptField(encryptedBase64, viewingKeyBase64Url) {
  const key = fromBase64Url(viewingKeyBase64Url);
  const blob = Buffer.from(encryptedBase64, "base64");
  if (blob.length < 28) {
    throw new Error("Encrypted blob too short \u2014 invalid format");
  }
  const iv = blob.subarray(0, 12);
  const authTag = blob.subarray(blob.length - 16);
  const ciphertext = blob.subarray(12, blob.length - 16);
  const decipher = (0, import_crypto.createDecipheriv)("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
    // throws if authTag mismatch (tampered!)
  ]);
  return decrypted.toString("utf8");
}
function hashViewingKey(viewingKeyBase64Url) {
  return (0, import_crypto.createHash)("sha256").update(viewingKeyBase64Url, "utf8").digest("hex");
}
function toBase64Url(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(base64url) {
  let b64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) {
    b64 += "=";
  }
  return Buffer.from(b64, "base64");
}

// src/receipt.ts
function generateReceiptId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = (0, import_crypto2.randomBytes)(12);
  let id = "rcpt_";
  for (let i = 0; i < 12; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}
function generateSessionId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = (0, import_crypto2.randomBytes)(8);
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
    this.viewingKey = config.viewingKey || null;
  }
  /**
   * Build and sign a receipt from action input.
   * The raw input/output are hashed — only hashes are stored in the signed payload.
   * 
   * v1.1: If a viewing key is set, also encrypts raw input/output with AES-256-GCM.
   * The encrypted fields are NOT part of the signed payload — they're transport-only.
   * Verification: decrypt(encrypted_input) → SHA-256 must match hashes.input_sha256
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
    let encrypted_input = null;
    let encrypted_output = null;
    if (this.viewingKey) {
      encrypted_input = encryptField(input.input, this.viewingKey);
      encrypted_output = encryptField(input.output, this.viewingKey);
    }
    const receipt = {
      ...payload,
      signature,
      server_received_at: null,
      encrypted_input,
      encrypted_output
    };
    return receipt;
  }
  /**
   * Set or update the viewing key for E2E encryption.
   * Called when starting a new encrypted task.
   */
  setViewingKey(key) {
    this.viewingKey = key;
  }
  /**
   * Check if E2E encryption is active.
   */
  hasViewingKey() {
    return this.viewingKey !== null;
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
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
var DEFAULT_BACKUP_DIR = (0, import_path.join)((0, import_os.homedir)(), ".openclawscan", "receipts");
var LocalBackup = class {
  constructor(backupDir) {
    this.backupDir = backupDir || DEFAULT_BACKUP_DIR;
    this.ensureDir();
  }
  ensureDir() {
    if (!(0, import_fs.existsSync)(this.backupDir)) {
      (0, import_fs.mkdirSync)(this.backupDir, { recursive: true });
    }
  }
  /**
   * Save a receipt to the local backup.
   * Appends as a single JSON line to today's log file.
   */
  save(receipt) {
    try {
      const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const filePath = (0, import_path.join)(this.backupDir, `${date}.jsonl`);
      const line = JSON.stringify(receipt) + "\n";
      (0, import_fs.appendFileSync)(filePath, line, "utf8");
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
   * v1.1: Also sends encrypted_input/encrypted_output if present.
   */
  async submitReceipt(receipt) {
    return this.request("POST", "/receipts", receipt);
  }
  /**
   * Submit multiple receipts in a batch.
   */
  async submitBatch(receipts) {
    return this.request("POST", "/receipts/batch", {
      receipts
    });
  }
  /**
   * Create a new task (group of receipts).
   * v1.1: Can include key_hash for E2E encrypted tasks.
   */
  async createTask(task) {
    return this.request("POST", "/tasks", task);
  }
  /**
   * Complete a task and get the shareable URL.
   * v1.1: Can include encrypted_summary.
   */
  async completeTask(taskId, options) {
    return this.request("PATCH", "/tasks", {
      task_id: taskId,
      status: "completed",
      ...options?.encrypted_summary && {
        encrypted_summary: options.encrypted_summary
      }
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
    this.activeViewingKey = null;
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
   * 
   * v1.1: If an encrypted task is active, raw input/output are also
   * encrypted with AES-256-GCM before being sent to the server.
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
  // ─── Task Management ──────────────────────────────────────
  /**
   * Start a new task (v1.0 — no encryption).
   * All subsequent receipts will be grouped under this task.
   */
  async startTask(task) {
    const info = await this.api.createTask(task);
    this.activeTaskId = info.task_id;
    this.activeViewingKey = null;
    this.builder.setViewingKey(null);
    return info;
  }
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
  async startEncryptedTask(task) {
    const viewingKey = generateViewingKey();
    const keyHash = hashViewingKey(viewingKey);
    const encryptedTask = {
      ...task,
      key_hash: keyHash
    };
    const taskInfo = await this.api.createTask(encryptedTask);
    this.activeTaskId = taskInfo.task_id;
    this.activeViewingKey = viewingKey;
    this.builder.setViewingKey(viewingKey);
    return { taskInfo, viewingKey };
  }
  /**
   * Complete the active task and get a shareable link.
   * v1.1: Can include an encrypted summary of the task results.
   */
  async completeTask(summary) {
    if (!this.activeTaskId) {
      throw new Error("No active task to complete");
    }
    let encrypted_summary;
    if (summary && this.activeViewingKey) {
      encrypted_summary = encryptField(summary, this.activeViewingKey);
    }
    const info = await this.api.completeTask(this.activeTaskId, {
      encrypted_summary
    });
    this.activeTaskId = null;
    this.activeViewingKey = null;
    this.builder.setViewingKey(null);
    return info;
  }
  /**
   * Get the viewing key for the currently active encrypted task.
   * Returns null if no encrypted task is active or if using v1.0 mode.
   * 
   * Use this to build the share URL:
   *   `${taskInfo.share_url}#key=${scanner.getViewingKey()}`
   */
  getViewingKey() {
    return this.activeViewingKey;
  }
  /**
   * Check if E2E encryption is currently active.
   */
  isEncrypted() {
    return this.activeViewingKey !== null;
  }
  // ─── Session Management ───────────────────────────────────
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
  // ─── Static Verification ──────────────────────────────────
  /**
   * Verify a signed receipt (static method — no instance needed).
   * Anyone can verify a receipt without an API key or server.
   */
  static verify(receipt, originalOutput) {
    return verifyReceipt(receipt, originalOutput);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiClient,
  LocalBackup,
  OpenClawScan,
  ReceiptBuilder,
  decryptField,
  deserializeKeyPair,
  encryptField,
  fromBase64Url,
  generateKeyPair,
  generateReceiptId,
  generateSessionId,
  generateViewingKey,
  hashViewingKey,
  publicKeyFromSecret,
  serializeKeyPair,
  sha256,
  toBase64Url,
  verifyHash,
  verifyReceipt,
  verifySignature
});

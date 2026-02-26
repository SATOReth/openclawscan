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
  deserializeKeyPair: () => deserializeKeyPair,
  generateKeyPair: () => generateKeyPair,
  generateReceiptId: () => generateReceiptId,
  generateSessionId: () => generateSessionId,
  publicKeyFromSecret: () => publicKeyFromSecret,
  serializeKeyPair: () => serializeKeyPair,
  sha256: () => sha256,
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
      version: "1.2",
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
      server_received_at: null,
      // E2E encryption fields — populated by server or SDK extension
      encrypted_input: null,
      encrypted_output: null,
      viewing_key_hash: null,
      // Blockchain anchoring — populated after certification
      merkle_proof: null,
      anchor_chain: null,
      anchor_tx_hash: null,
      anchor_block_number: null,
      anchor_batch_id: null
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
  /**
   * Certify a completed task on Base L2.
   * Builds a Merkle tree from all receipt hashes and anchors the root on-chain
   * via ClawVerify.sol. Returns the transaction hash and certification details.
   *
   * @param slug - The task slug to certify
   * @returns Certification result including tx_hash, merkle_root, and basescan_url
   */
  async certify(slug) {
    const body = { slug };
    return this.request("POST", "/tasks/certify", body);
  }
};

// src/index.ts
var OpenClawScan = class {
  constructor(config) {
    this.activeTaskId = null;
    this.activeTaskSlug = null;
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
    this.activeTaskSlug = info.slug;
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
   * Certify a task on Base L2. Builds a Merkle tree from all receipt hashes
   * and anchors the root on-chain via ClawVerify.sol.
   *
   * Can be called with:
   * - No args: certifies the most recently completed task
   * - A slug string: certifies the task with that slug
   *
   * @returns Certification result including tx_hash, merkle_root, basescan_url
   */
  async certify(slug) {
    const targetSlug = slug || this.activeTaskSlug;
    if (!targetSlug) {
      throw new Error(
        "No task to certify. Pass a slug or complete a task first."
      );
    }
    const result = await this.api.certify(targetSlug);
    if (!slug) {
      this.activeTaskSlug = null;
    }
    return result;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});

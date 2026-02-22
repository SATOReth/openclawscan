"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const DEFAULT_API_URL = 'https://openclawscan.xyz/api';
/**
 * HTTP client for the OpenClawScan API.
 * Handles receipt submission, task management, and verification.
 */
class ApiClient {
    constructor(apiUrl, apiKey) {
        this.apiUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
        this.apiKey = apiKey;
    }
    async request(method, path, body) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        const res = await fetch(`${this.apiUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const errorBody = await res.text().catch(() => 'Unknown error');
            throw new Error(`OpenClawScan API error: ${res.status} ${res.statusText} — ${errorBody}`);
        }
        return res.json();
    }
    /**
     * Submit a signed receipt to the server.
     */
    async submitReceipt(receipt) {
        return this.request('POST', '/receipts', receipt);
    }
    /**
     * Submit multiple receipts in a batch.
     */
    async submitBatch(receipts) {
        return this.request('POST', '/receipts/batch', {
            receipts,
        });
    }
    /**
     * Create a new task (group of receipts).
     */
    async createTask(task) {
        return this.request('POST', '/tasks', task);
    }
    /**
     * Complete a task and get the shareable URL.
     */
    async completeTask(taskId) {
        return this.request('PATCH', `/tasks/${taskId}`, {
            status: 'completed',
        });
    }
    /**
     * Get task info.
     */
    async getTask(taskId) {
        return this.request('GET', `/tasks/${taskId}`);
    }
}
exports.ApiClient = ApiClient;

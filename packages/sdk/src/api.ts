import type { SignedReceipt, SubmitReceiptResponse, TaskCreate, TaskInfo } from './types';

const DEFAULT_API_URL = 'https://openclawscan.xyz/api';

/**
 * HTTP client for the OpenClawScan API.
 * Handles receipt submission, task management, and verification.
 */
export class ApiClient {
  private apiUrl: string;
  private apiKey: string | undefined;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
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
      throw new Error(
        `OpenClawScan API error: ${res.status} ${res.statusText} — ${errorBody}`
      );
    }

    return res.json() as Promise<T>;
  }

  /**
   * Submit a signed receipt to the server.
   */
  async submitReceipt(receipt: SignedReceipt): Promise<SubmitReceiptResponse> {
    return this.request<SubmitReceiptResponse>('POST', '/receipts', receipt);
  }
  /**
   * Create a new task (group of receipts).
   */
  async createTask(task: TaskCreate): Promise<TaskInfo> {
    return this.request<TaskInfo>('POST', '/tasks', task);
  }

  /**
   * Complete a task and get the shareable URL.
   */
  async completeTask(taskId: string): Promise<TaskInfo> {
    return this.request<TaskInfo>('PATCH', `/tasks/${taskId}`, {
      status: 'completed',
    });
  }

  /**
   * Get task info.
   */
  async getTask(taskId: string): Promise<TaskInfo> {
    return this.request<TaskInfo>('GET', `/tasks/${taskId}`);
  }
}

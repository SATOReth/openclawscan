import type {
  SignedReceipt,
  EncryptedReceipt,
  SubmitReceiptResponse,
  TaskCreate,
  EncryptedTaskCreate,
  TaskInfo,
} from './types';

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
   * v1.1: Also sends encrypted_input/encrypted_output if present.
   */
  async submitReceipt(receipt: SignedReceipt | EncryptedReceipt): Promise<SubmitReceiptResponse> {
    return this.request<SubmitReceiptResponse>('POST', '/receipts', receipt);
  }

  /**
   * Submit multiple receipts in a batch.
   */
  async submitBatch(
    receipts: (SignedReceipt | EncryptedReceipt)[]
  ): Promise<SubmitReceiptResponse[]> {
    return this.request<SubmitReceiptResponse[]>('POST', '/receipts/batch', {
      receipts,
    });
  }

  /**
   * Create a new task (group of receipts).
   * v1.1: Can include key_hash for E2E encrypted tasks.
   */
  async createTask(task: TaskCreate | EncryptedTaskCreate): Promise<TaskInfo> {
    return this.request<TaskInfo>('POST', '/tasks', task);
  }

  /**
   * Complete a task and get the shareable URL.
   * v1.1: Can include encrypted_summary.
   */
  async completeTask(
    taskId: string,
    options?: { encrypted_summary?: string }
  ): Promise<TaskInfo> {
    return this.request<TaskInfo>('PATCH', '/tasks', {
      task_id: taskId,
      status: 'completed',
      ...(options?.encrypted_summary && {
        encrypted_summary: options.encrypted_summary,
      }),
    });
  }

  /**
   * Get task info.
   */
  async getTask(taskId: string): Promise<TaskInfo> {
    return this.request<TaskInfo>('GET', `/tasks/${taskId}`);
  }
}

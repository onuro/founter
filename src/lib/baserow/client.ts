import type {
  BaserowAuthResponse,
  BaserowDatabase,
  BaserowTable,
  BaserowField,
  BaserowRow,
  BaserowListRowsResponse,
  ListRowsOptions,
} from './types';

export class BaserowClient {
  private host: string;
  private token: string | null = null;

  constructor(host: string) {
    // Remove trailing slash if present
    this.host = host.replace(/\/$/, '');
  }

  /**
   * Authenticate with Baserow using email/password (JWT auth for self-hosted)
   */
  async login(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.host}/api/user/token-auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.detail || 'Authentication failed');
    }

    const data: BaserowAuthResponse = await response.json();
    this.token = data.token;
  }

  /**
   * Set token directly (for API token auth)
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('Not authenticated. Call login() or setToken() first.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `JWT ${this.token}`,
    };
  }

  /**
   * List all databases (applications) the user has access to
   */
  async listDatabases(): Promise<BaserowDatabase[]> {
    const response = await fetch(`${this.host}/api/applications/`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch databases');
    }

    const applications = await response.json();
    // Filter to only database type applications
    return applications.filter((app: BaserowDatabase) => app.type === 'database');
  }

  /**
   * List tables in a database
   */
  async listTables(databaseId: number): Promise<BaserowTable[]> {
    const response = await fetch(
      `${this.host}/api/database/tables/database/${databaseId}/`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tables');
    }

    return response.json();
  }

  /**
   * Get fields for a table
   */
  async getTableFields(tableId: number): Promise<BaserowField[]> {
    const response = await fetch(
      `${this.host}/api/database/fields/table/${tableId}/`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch fields');
    }

    return response.json();
  }

  /**
   * Get a single row by ID
   */
  async getRow(tableId: number, rowId: number): Promise<BaserowRow> {
    const response = await fetch(
      `${this.host}/api/database/rows/table/${tableId}/${rowId}/`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch row');
    }

    return response.json();
  }

  /**
   * List rows in a table with pagination
   */
  async listRows(
    tableId: number,
    options: ListRowsOptions = {}
  ): Promise<BaserowListRowsResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.size) params.set('size', options.size.toString());
    if (options.search) params.set('search', options.search);
    if (options.orderBy) params.set('order_by', options.orderBy);

    const url = `${this.host}/api/database/rows/table/${tableId}/?${params}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error('Failed to fetch rows');
    }

    return response.json();
  }

  /**
   * Update a row
   */
  async updateRow(
    tableId: number,
    rowId: number,
    data: Record<string, unknown>
  ): Promise<BaserowRow> {
    const response = await fetch(
      `${this.host}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.detail || 'Failed to update row');
    }

    return response.json();
  }

  /**
   * Create a new row
   */
  async createRow(
    tableId: number,
    data: Record<string, unknown>
  ): Promise<BaserowRow> {
    const response = await fetch(
      `${this.host}/api/database/rows/table/${tableId}/?user_field_names=true`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.detail || 'Failed to create row');
    }

    return response.json();
  }

  /**
   * Delete a row
   */
  async deleteRow(tableId: number, rowId: number): Promise<void> {
    const response = await fetch(
      `${this.host}/api/database/rows/table/${tableId}/${rowId}/`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete row');
    }
  }

  /**
   * Upload a file to Baserow's file storage
   * Returns the file info needed to attach to a row
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string = 'image/png'
  ): Promise<{ name: string; url: string }> {
    if (!this.token) {
      throw new Error('Not authenticated. Call login() or setToken() first.');
    }

    // Create multipart form data manually
    const boundary = '----BaserowFormBoundary' + Date.now();
    const header = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([header, fileBuffer, footer]);

    const response = await fetch(`${this.host}/api/user-files/upload-file/`, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${this.token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.detail || 'Failed to upload file');
    }

    const data = await response.json();
    return {
      name: data.name,
      url: data.url,
    };
  }
}

/**
 * Create a Baserow client from settings
 */
export async function createBaserowClient(
  host: string,
  username: string,
  password: string
): Promise<BaserowClient> {
  const client = new BaserowClient(host);
  await client.login(username, password);
  return client;
}

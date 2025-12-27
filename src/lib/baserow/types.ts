// Baserow API Types

export interface BaserowAuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface BaserowDatabase {
  id: number;
  name: string;
  type: string;
  group: {
    id: number;
    name: string;
  };
}

export interface BaserowTable {
  id: number;
  name: string;
  order: number;
  database_id: number;
}

export interface BaserowField {
  id: number;
  table_id: number;
  name: string;
  type: string;
  primary: boolean;
  order: number;
}

export interface BaserowRow {
  id: number;
  order: string;
  [key: string]: unknown;
}

export interface BaserowListRowsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BaserowRow[];
}

export interface ListRowsOptions {
  page?: number;
  size?: number;
  search?: string;
  orderBy?: string;
  filters?: Record<string, unknown>;
}

export interface BaserowWebhookPayload {
  table_id: number;
  database_id?: number;
  workspace_id?: number;
  event_id: string;
  event_type: 'rows.created' | 'rows.updated' | 'rows.deleted';
  items?: Array<BaserowRow | Record<string, unknown>>;
  // Legacy fields (keeping for compatibility)
  row_id?: number;
  old_row?: BaserowRow;
  row?: BaserowRow | Record<string, unknown>;
}

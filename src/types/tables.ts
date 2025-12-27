// Field types supported by custom tables
export type FieldType =
  | 'text'
  | 'number'
  | 'url'
  | 'select'
  | 'date'
  | 'boolean'
  | 'longText'
  | 'image';

// Select field choice
export interface SelectChoice {
  id: string;
  label: string;
  color: string; // Tailwind color class like 'red', 'blue', 'green'
}

// Field options by type
export interface SelectFieldOptions {
  choices: SelectChoice[];
  allowMultiple: boolean;
}

export interface NumberFieldOptions {
  precision: number; // 0 for integers, 2 for currency
  format?: 'plain' | 'currency' | 'percent';
}

export interface DateFieldOptions {
  includeTime: boolean;
  format?: string;
}

export interface ImageFieldOptions {
  maxSize?: number; // Max file size in bytes
  aspectRatio?: string; // e.g., '1/1', '16/9'
}

export type FieldOptions =
  | SelectFieldOptions
  | NumberFieldOptions
  | DateFieldOptions
  | ImageFieldOptions
  | null;

// Core models
export interface Field {
  id: string;
  tableId: string;
  name: string;
  type: FieldType;
  options: FieldOptions;
  order: number;
  width: number; // Column width in pixels
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Row {
  id: string;
  tableId: string;
  values: Record<string, unknown>; // { [fieldId]: value }
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomTable {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  fields: Field[];
  rows: Row[];
  createdAt: Date;
  updatedAt: Date;
}

// Table with counts (for list view)
export interface TableSummary {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  fieldCount: number;
  rowCount: number;
}

// API Input types
export interface CreateTableInput {
  name: string;
  icon?: string;
}

export interface UpdateTableInput {
  name?: string;
  icon?: string;
}

export interface CreateFieldInput {
  name: string;
  type: FieldType;
  options?: FieldOptions;
  required?: boolean;
}

export interface UpdateFieldInput {
  name?: string;
  type?: FieldType;
  options?: FieldOptions;
  width?: number;
  required?: boolean;
  cleanupChoiceIds?: string[];
}

export interface CreateRowInput {
  values: Record<string, unknown>;
}

export interface UpdateRowInput {
  values: Record<string, unknown>;
}

// API Response types
export interface TablesResponse {
  success: boolean;
  data: TableSummary[];
}

export interface TableResponse {
  success: boolean;
  data: CustomTable;
}

export interface FieldResponse {
  success: boolean;
  data: Field;
}

export interface RowResponse {
  success: boolean;
  data: Row;
}

export interface RowsResponse {
  success: boolean;
  data: Row[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Field type configuration
export const FIELD_TYPE_CONFIG: Record<FieldType, {
  label: string;
  icon: string;
  defaultValue: unknown;
}> = {
  text: { label: 'Text', icon: 'Type', defaultValue: '' },
  number: { label: 'Number', icon: 'Hash', defaultValue: null },
  url: { label: 'URL', icon: 'Link', defaultValue: '' },
  select: { label: 'Select', icon: 'Tag', defaultValue: [] },
  date: { label: 'Date', icon: 'Calendar', defaultValue: null },
  boolean: { label: 'Checkbox', icon: 'CheckSquare', defaultValue: false },
  longText: { label: 'Long Text', icon: 'AlignLeft', defaultValue: '' },
  image: { label: 'Image', icon: 'Image', defaultValue: null },
};

// Tag colors for select fields
export const TAG_COLORS = [
  {
    name: 'red',
    bg: 'bg-red-900/20',
    text: '[color:color-mix(in_oklch,theme(colors.red.600),white_30%)]',
    border: 'border-red-500/30',
  },
  {
    name: 'orange',
    bg: 'bg-orange-900/20',
    text: '[color:color-mix(in_oklch,theme(colors.orange.600),white_30%)]',
    border: 'border-orange-500/30',
  },
  {
    name: 'yellow',
    bg: 'bg-yellow-900/20',
    text: '[color:color-mix(in_oklch,theme(colors.yellow.600),white_30%)]',
    border: 'border-yellow-500/30',
  },
  {
    name: 'green',
    bg: 'bg-green-900/20',
    text: '[color:color-mix(in_oklch,theme(colors.green.600),white_30%)]',
    border: 'border-green-500/30',
  },
  {
    name: 'blue',
    bg: 'bg-blue-800/20',
    text: '[color:color-mix(in_oklch,theme(colors.blue.600),white_30%)]',
    border: 'border-blue-500/30',
  },
  {
    name: 'purple',
    bg: 'bg-purple-800/20',
    text: '[color:color-mix(in_oklch,theme(colors.purple.600),white_30%)]',
    border: 'border-purple-500/30',
  },
  {
    name: 'pink',
    bg: 'bg-pink-800/20',
    text: '[color:color-mix(in_oklch,theme(colors.pink.600),white_30%)]',
    border: 'border-pink-500/30',
  },
  {
    name: 'cyan',
    bg: 'bg-cyan-500/20',
    text: '[color:color-mix(in_oklch,theme(colors.cyan.600),white_30%)]',
    border: 'border-cyan-500/30',
  },
];

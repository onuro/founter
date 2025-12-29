import type { RowHeight } from './tables';

// View types
export type ViewType = 'grid' | 'card';

// Filter operators
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan';

// Filter configuration
export interface FilterConfig {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value?: unknown;
}

// Sort configuration
export interface SortConfig {
  fieldId: string;
  direction: 'asc' | 'desc';
}

// View settings (stored as JSON in database)
export interface ViewSettings {
  // Common settings
  rowHeight: RowHeight;
  filters?: FilterConfig[];
  sorts?: SortConfig[];

  // Card-specific settings
  cardTitleFieldId?: string;   // Field to use as card title
  cardColumns?: 2 | 3 | 4 | 5; // Number of columns in grid
}

// Default view settings
export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  rowHeight: 'small',
  filters: [],
  sorts: [],
};

export const DEFAULT_CARD_SETTINGS: Partial<ViewSettings> = {
  cardColumns: 3,
};

// TableView model
export interface TableView {
  id: string;
  tableId: string;
  name: string;
  type: ViewType;
  isDefault: boolean;
  order: number;
  settings: ViewSettings;
  createdAt: Date;
  updatedAt: Date;
}

// API Input types
export interface CreateViewInput {
  name: string;
  type: ViewType;
  settings?: Partial<ViewSettings>;
}

export interface UpdateViewInput {
  name?: string;
  type?: ViewType;
  isDefault?: boolean;
  settings?: Partial<ViewSettings>;
}

// API Response types
export interface ViewResponse {
  success: boolean;
  data: TableView;
}

export interface ViewsResponse {
  success: boolean;
  data: TableView[];
}

// View type configuration
export const VIEW_TYPE_CONFIG: Record<ViewType, {
  label: string;
  icon: string;
  description: string;
}> = {
  grid: {
    label: 'Grid',
    icon: 'Table2',
    description: 'Traditional table view with rows and columns'
  },
  card: {
    label: 'Card',
    icon: 'LayoutGrid',
    description: 'Display rows as cards in a grid layout'
  },
};

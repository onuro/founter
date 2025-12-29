/**
 * Table Import/Export Utilities
 *
 * Handles exporting and importing CustomTables with full schema preservation.
 * Supports ID remapping for cross-environment transfers.
 */

import type { FieldType, FieldOptions } from '@/types/tables';

// =============================================================================
// Export Format Types
// =============================================================================

export const EXPORT_VERSION = '1.0' as const;

export interface TableExportField {
  id: string;
  name: string;
  type: FieldType;
  options: FieldOptions;
  order: number;
  width: number;
  required: boolean;
}

export interface TableExportRow {
  values: Record<string, unknown>;
  order: number;
}

export interface TableExport {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  table: {
    name: string;
    icon: string | null;
  };
  fields: TableExportField[];
  rows: TableExportRow[];
  warnings?: string[];
}

// =============================================================================
// Validation
// =============================================================================

const VALID_FIELD_TYPES: FieldType[] = [
  'text', 'number', 'url', 'select', 'date', 'boolean', 'longText', 'image'
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTableExport(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON structure'], warnings: [] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (obj.version !== EXPORT_VERSION) {
    errors.push(`Unsupported export version: ${obj.version}. Expected: ${EXPORT_VERSION}`);
  }

  // Check table metadata
  if (!obj.table || typeof obj.table !== 'object') {
    errors.push('Missing table metadata');
  } else {
    const table = obj.table as Record<string, unknown>;
    if (!table.name || typeof table.name !== 'string' || table.name.trim() === '') {
      errors.push('Table name is required');
    }
  }

  // Check fields
  if (!Array.isArray(obj.fields)) {
    errors.push('Fields must be an array');
  } else {
    const fieldNames = new Set<string>();
    const fieldIds = new Set<string>();

    obj.fields.forEach((field, index) => {
      if (!field || typeof field !== 'object') {
        errors.push(`Field at index ${index} is invalid`);
        return;
      }

      const f = field as Record<string, unknown>;

      // Check required properties
      if (!f.id || typeof f.id !== 'string') {
        errors.push(`Field at index ${index} missing id`);
      } else {
        if (fieldIds.has(f.id)) {
          errors.push(`Duplicate field id: ${f.id}`);
        }
        fieldIds.add(f.id);
      }

      if (!f.name || typeof f.name !== 'string') {
        errors.push(`Field at index ${index} missing name`);
      } else {
        if (fieldNames.has(f.name.toLowerCase())) {
          errors.push(`Duplicate field name: ${f.name}`);
        }
        fieldNames.add(f.name.toLowerCase());
      }

      if (!f.type || !VALID_FIELD_TYPES.includes(f.type as FieldType)) {
        errors.push(`Field "${f.name || index}" has invalid type: ${f.type}`);
      }

      if (typeof f.order !== 'number') {
        errors.push(`Field "${f.name || index}" missing order`);
      }
    });
  }

  // Check rows
  if (!Array.isArray(obj.rows)) {
    errors.push('Rows must be an array');
  } else {
    const fieldIds = new Set(
      (obj.fields as Array<{ id: string }> || []).map(f => f.id)
    );

    obj.rows.forEach((row, index) => {
      if (!row || typeof row !== 'object') {
        errors.push(`Row at index ${index} is invalid`);
        return;
      }

      const r = row as Record<string, unknown>;

      if (typeof r.order !== 'number') {
        warnings.push(`Row at index ${index} missing order, will use index`);
      }

      if (!r.values || typeof r.values !== 'object') {
        errors.push(`Row at index ${index} missing values`);
      } else {
        // Check that all value keys reference valid field IDs
        Object.keys(r.values as Record<string, unknown>).forEach(key => {
          if (!fieldIds.has(key)) {
            warnings.push(`Row ${index} has value for unknown field: ${key}`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// ID Remapping
// =============================================================================

export type FieldIdMap = Map<string, string>;

/**
 * Remaps field IDs in row values from old IDs to new IDs
 */
export function remapRowValues(
  values: Record<string, unknown>,
  fieldIdMap: FieldIdMap
): Record<string, unknown> {
  const remapped: Record<string, unknown> = {};

  for (const [oldId, value] of Object.entries(values)) {
    const newId = fieldIdMap.get(oldId);
    if (newId) {
      remapped[newId] = value;
    }
    // Skip values for fields that don't exist in the mapping
  }

  return remapped;
}

// =============================================================================
// Image Field Handling
// =============================================================================

/**
 * Checks if a value looks like a local file path (not a URL)
 */
export function isLocalPath(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  // Local paths typically start with / or contain backslashes
  // and don't start with http:// or https://
  return (
    (value.startsWith('/') || value.includes('\\')) &&
    !value.startsWith('http://') &&
    !value.startsWith('https://')
  );
}

/**
 * Scans export data for image fields with local paths
 * Returns warnings for each detected local path
 */
export function scanForLocalImagePaths(
  fields: TableExportField[],
  rows: TableExportRow[]
): string[] {
  const warnings: string[] = [];
  const imageFieldIds = new Set(
    fields.filter(f => f.type === 'image').map(f => f.id)
  );

  if (imageFieldIds.size === 0) return warnings;

  let localPathCount = 0;
  for (const row of rows) {
    for (const fieldId of imageFieldIds) {
      const value = row.values[fieldId];
      if (isLocalPath(value)) {
        localPathCount++;
      }
    }
  }

  if (localPathCount > 0) {
    warnings.push(
      `${localPathCount} image field${localPathCount > 1 ? 's have' : ' has'} local file paths that won't be available after import`
    );
  }

  return warnings;
}

/**
 * Nullifies local image paths in row values for export
 */
export function nullifyLocalImagePaths(
  rows: TableExportRow[],
  imageFieldIds: Set<string>
): TableExportRow[] {
  return rows.map(row => ({
    ...row,
    values: Object.fromEntries(
      Object.entries(row.values).map(([fieldId, value]) => {
        if (imageFieldIds.has(fieldId) && isLocalPath(value)) {
          return [fieldId, null];
        }
        return [fieldId, value];
      })
    ),
  }));
}

// =============================================================================
// Export Preview Info
// =============================================================================

export interface ExportPreview {
  tableName: string;
  tableIcon: string | null;
  fieldCount: number;
  rowCount: number;
  hasImageFields: boolean;
  localImagePathCount: number;
  warnings: string[];
}

export function getExportPreview(data: TableExport): ExportPreview {
  const imageFieldIds = new Set(
    data.fields.filter(f => f.type === 'image').map(f => f.id)
  );

  let localImagePathCount = 0;
  for (const row of data.rows) {
    for (const fieldId of imageFieldIds) {
      if (isLocalPath(row.values[fieldId])) {
        localImagePathCount++;
      }
    }
  }

  const warnings = [...(data.warnings || [])];
  if (localImagePathCount > 0) {
    warnings.push(
      `${localImagePathCount} image${localImagePathCount > 1 ? 's have' : ' has'} local paths that will be cleared on import`
    );
  }

  return {
    tableName: data.table.name,
    tableIcon: data.table.icon,
    fieldCount: data.fields.length,
    rowCount: data.rows.length,
    hasImageFields: imageFieldIds.size > 0,
    localImagePathCount,
    warnings,
  };
}

// =============================================================================
// NDJSON Streaming (for large tables)
// =============================================================================

export interface TableExportHeader {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  table: {
    name: string;
    icon: string | null;
  };
  fields: TableExportField[];
  rowCount: number;
}

/**
 * Creates NDJSON format for streaming large tables
 * First line: header with table + fields
 * Subsequent lines: one row per line
 */
export function* generateNDJSON(data: TableExport): Generator<string> {
  const header: TableExportHeader = {
    version: data.version,
    exportedAt: data.exportedAt,
    table: data.table,
    fields: data.fields,
    rowCount: data.rows.length,
  };

  yield JSON.stringify(header);

  for (const row of data.rows) {
    yield JSON.stringify(row);
  }
}

/**
 * Parses NDJSON format back to TableExport
 */
export function parseNDJSON(lines: string[]): TableExport {
  if (lines.length === 0) {
    throw new Error('Empty NDJSON file');
  }

  const header = JSON.parse(lines[0]) as TableExportHeader;
  const rows: TableExportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      rows.push(JSON.parse(lines[i]) as TableExportRow);
    }
  }

  return {
    version: header.version,
    exportedAt: header.exportedAt,
    table: header.table,
    fields: header.fields,
    rows,
  };
}

/**
 * Determines if export should use NDJSON based on row count
 */
export const NDJSON_THRESHOLD = 10000;

export function shouldUseNDJSON(rowCount: number): boolean {
  return rowCount >= NDJSON_THRESHOLD;
}

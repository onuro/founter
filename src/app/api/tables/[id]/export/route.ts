import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  EXPORT_VERSION,
  nullifyLocalImagePaths,
  scanForLocalImagePaths,
  shouldUseNDJSON,
  generateNDJSON,
  type TableExport,
  type TableExportField,
  type TableExportRow,
} from '@/lib/table-import-export';
import type { FieldType, FieldOptions } from '@/types/tables';

// GET /api/tables/[id]/export - Export a table as JSON
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch table with all fields and rows
    const table = await prisma.customTable.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        rows: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Transform fields to export format
    const fields: TableExportField[] = table.fields.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type as FieldType,
      options: f.options as FieldOptions,
      order: f.order,
      width: f.width,
      required: f.required,
    }));

    // Get image field IDs for path handling
    const imageFieldIds = new Set(
      fields.filter((f) => f.type === 'image').map((f) => f.id)
    );

    // Transform rows to export format
    let rows: TableExportRow[] = table.rows.map((r) => ({
      values: r.values as Record<string, unknown>,
      order: r.order,
    }));

    // Scan for and handle local image paths
    const warnings = scanForLocalImagePaths(fields, rows);

    // Nullify local image paths (they won't work on import)
    if (imageFieldIds.size > 0) {
      rows = nullifyLocalImagePaths(rows, imageFieldIds);
    }

    // Create export data
    const exportData: TableExport = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      table: {
        name: table.name,
        icon: table.icon,
      },
      fields,
      rows,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    // Determine format based on row count
    const useNDJSON = shouldUseNDJSON(rows.length);
    const filename = `${table.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export`;

    if (useNDJSON) {
      // Stream NDJSON for large tables
      const lines = Array.from(generateNDJSON(exportData));
      const ndjsonContent = lines.join('\n');

      return new NextResponse(ndjsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Content-Disposition': `attachment; filename="${filename}.ndjson"`,
        },
      });
    }

    // Regular JSON for smaller tables
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  } catch (error) {
    console.error('Failed to export table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export table' },
      { status: 500 }
    );
  }
}

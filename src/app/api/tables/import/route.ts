import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validateTableExport,
  remapRowValues,
  parseNDJSON,
  type TableExport,
  type FieldIdMap,
} from '@/lib/table-import-export';

interface ImportRequest {
  data: TableExport;
  tableName?: string; // Optional override for table name
}

// POST /api/tables/import - Import a table from JSON
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let importData: TableExport;
    let tableName: string | undefined;

    // Handle different content types
    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      tableName = formData.get('tableName') as string | null || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      const text = await file.text();

      // Check if it's NDJSON (multiple lines with JSON objects)
      const lines = text.trim().split('\n');
      if (lines.length > 1 && lines[0].startsWith('{') && !text.startsWith('{\n  "version"')) {
        // Likely NDJSON format
        try {
          importData = parseNDJSON(lines);
        } catch {
          return NextResponse.json(
            { success: false, error: 'Invalid NDJSON format' },
            { status: 400 }
          );
        }
      } else {
        // Regular JSON
        try {
          importData = JSON.parse(text);
        } catch {
          return NextResponse.json(
            { success: false, error: 'Invalid JSON format' },
            { status: 400 }
          );
        }
      }
    } else {
      // JSON body
      const body = (await request.json()) as ImportRequest;
      importData = body.data;
      tableName = body.tableName;
    }

    // Validate the import data
    const validation = validateTableExport(importData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid import data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Use provided table name or fallback to original
    const finalTableName = tableName?.trim() || importData.table.name;

    // Get max order for positioning the new table
    const maxOrderResult = await prisma.customTable.aggregate({
      _max: { order: true },
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    // Create the table and all data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the table
      const newTable = await tx.customTable.create({
        data: {
          name: finalTableName,
          icon: importData.table.icon,
          order: nextOrder,
        },
      });

      // 2. Create fields and build ID mapping
      const fieldIdMap: FieldIdMap = new Map();

      for (const field of importData.fields) {
        const newField = await tx.field.create({
          data: {
            tableId: newTable.id,
            name: field.name,
            type: field.type,
            options: field.options as object ?? undefined,
            order: field.order,
            width: field.width,
            required: field.required,
          },
        });
        fieldIdMap.set(field.id, newField.id);
      }

      // 3. Create rows with remapped field IDs
      const rowsToCreate = importData.rows.map((row, index) => ({
        tableId: newTable.id,
        values: remapRowValues(row.values, fieldIdMap) as object,
        order: typeof row.order === 'number' ? row.order : index,
      }));

      // Batch create rows for performance
      if (rowsToCreate.length > 0) {
        await tx.row.createMany({
          data: rowsToCreate,
        });
      }

      // Fetch the complete table with all data
      const completeTable = await tx.customTable.findUnique({
        where: { id: newTable.id },
        include: {
          fields: { orderBy: { order: 'asc' } },
          rows: { orderBy: { order: 'asc' } },
        },
      });

      return {
        table: completeTable,
        fieldIdMap: Object.fromEntries(fieldIdMap),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        tableId: result.table?.id,
        tableName: result.table?.name,
        fieldCount: importData.fields.length,
        rowCount: importData.rows.length,
        fieldIdMapping: result.fieldIdMap,
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    console.error('Failed to import table:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import table',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/tables/import/preview - Validate and preview import without creating
export async function PUT(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let importData: TableExport;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      const text = await file.text();
      const lines = text.trim().split('\n');

      if (lines.length > 1 && lines[0].startsWith('{') && !text.startsWith('{\n  "version"')) {
        try {
          importData = parseNDJSON(lines);
        } catch {
          return NextResponse.json(
            { success: false, error: 'Invalid NDJSON format' },
            { status: 400 }
          );
        }
      } else {
        try {
          importData = JSON.parse(text);
        } catch {
          return NextResponse.json(
            { success: false, error: 'Invalid JSON format' },
            { status: 400 }
          );
        }
      }
    } else {
      const body = await request.json();
      importData = body.data || body;
    }

    // Validate
    const validation = validateTableExport(importData);

    // Count image fields with local paths
    const imageFieldIds = new Set(
      importData.fields?.filter((f) => f.type === 'image').map((f) => f.id) || []
    );
    let localImageCount = 0;
    if (importData.rows) {
      for (const row of importData.rows) {
        for (const fieldId of imageFieldIds) {
          const value = row.values?.[fieldId];
          if (
            typeof value === 'string' &&
            (value.startsWith('/') || value.includes('\\')) &&
            !value.startsWith('http')
          ) {
            localImageCount++;
          }
        }
      }
    }

    const warnings = [...validation.warnings];
    if (localImageCount > 0) {
      warnings.push(
        `${localImageCount} image${localImageCount > 1 ? 's have' : ' has'} local paths that will be cleared on import`
      );
    }

    return NextResponse.json({
      success: validation.valid,
      preview: {
        tableName: importData.table?.name || 'Unknown',
        tableIcon: importData.table?.icon || null,
        fieldCount: importData.fields?.length || 0,
        rowCount: importData.rows?.length || 0,
        hasImageFields: imageFieldIds.size > 0,
        localImageCount,
      },
      errors: validation.errors,
      warnings,
    });
  } catch (error) {
    console.error('Failed to preview import:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse import file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

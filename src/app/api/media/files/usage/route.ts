import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TableUsage {
  id: string;
  name: string;
  rowCount: number;
}

interface PathUsage {
  count: number;
  tables: TableUsage[];
}

// POST /api/media/files/usage - Check if file paths are used in any table rows
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paths } = body;

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { success: false, error: 'paths array is required' },
        { status: 400 }
      );
    }

    // Get all image fields
    const imageFields = await prisma.field.findMany({
      where: { type: 'image' },
      select: { id: true, tableId: true },
    });
    const imageFieldIds = new Set(imageFields.map((f) => f.id));

    // Get all tables for name lookup
    const tables = await prisma.customTable.findMany({
      select: { id: true, name: true },
    });
    const tableMap = new Map(tables.map((t) => [t.id, t.name]));

    // Get all rows
    const rows = await prisma.row.findMany({
      select: { id: true, tableId: true, values: true },
    });

    // Build usage map for each path
    const usageMap: Record<string, PathUsage> = {};

    // Initialize usage map for all requested paths
    for (const path of paths) {
      usageMap[path] = { count: 0, tables: [] };
    }

    // Track usage per table per path
    const tableUsageMap: Record<string, Record<string, number>> = {};
    for (const path of paths) {
      tableUsageMap[path] = {};
    }

    // Scan all rows for image path matches
    for (const row of rows) {
      const values = row.values as Record<string, unknown>;

      for (const [fieldId, value] of Object.entries(values)) {
        if (imageFieldIds.has(fieldId) && typeof value === 'string') {
          // Check if this value matches any of the requested paths
          if (paths.includes(value)) {
            usageMap[value].count++;

            // Track per-table usage
            if (!tableUsageMap[value][row.tableId]) {
              tableUsageMap[value][row.tableId] = 0;
            }
            tableUsageMap[value][row.tableId]++;
          }
        }
      }
    }

    // Convert table usage map to array format
    for (const path of paths) {
      const tableUsage = tableUsageMap[path];
      usageMap[path].tables = Object.entries(tableUsage).map(([tableId, rowCount]) => ({
        id: tableId,
        name: tableMap.get(tableId) || 'Unknown Table',
        rowCount,
      }));
    }

    return NextResponse.json({
      success: true,
      data: usageMap,
    });
  } catch (error) {
    console.error('Failed to check file usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check file usage' },
      { status: 500 }
    );
  }
}

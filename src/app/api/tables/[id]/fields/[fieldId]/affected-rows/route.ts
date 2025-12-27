import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tables/[id]/fields/[fieldId]/affected-rows?choiceIds=id1,id2
// Returns count of rows that use any of the specified choice IDs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id: tableId, fieldId } = await params;
    const { searchParams } = new URL(request.url);
    const choiceIdsParam = searchParams.get('choiceIds');

    if (!choiceIdsParam) {
      return NextResponse.json(
        { success: false, error: 'choiceIds query parameter is required' },
        { status: 400 }
      );
    }

    const choiceIds = choiceIdsParam.split(',').filter(Boolean);

    if (choiceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { total: 0, breakdown: {} },
      });
    }

    // Verify field exists and belongs to table
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.tableId !== tableId) {
      return NextResponse.json(
        { success: false, error: 'Field not found' },
        { status: 404 }
      );
    }

    // Get all rows for this table
    const rows = await prisma.row.findMany({
      where: { tableId },
    });

    // Count rows affected by each choice ID
    const breakdown: Record<string, number> = {};
    let total = 0;
    const countedRows = new Set<string>();

    for (const choiceId of choiceIds) {
      breakdown[choiceId] = 0;
    }

    for (const row of rows) {
      const values = row.values as Record<string, unknown>;
      const fieldValue = values[fieldId];

      if (fieldValue === null || fieldValue === undefined) continue;

      const valueArray = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

      for (const choiceId of choiceIds) {
        if (valueArray.includes(choiceId)) {
          breakdown[choiceId]++;
          if (!countedRows.has(row.id)) {
            countedRows.add(row.id);
            total++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { total, breakdown },
    });
  } catch (error) {
    console.error('Failed to count affected rows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to count affected rows' },
      { status: 500 }
    );
  }
}

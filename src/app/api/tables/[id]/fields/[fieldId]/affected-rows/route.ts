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

    // Process rows in batches to avoid memory issues with large tables
    const BATCH_SIZE = 1000;
    const breakdown: Record<string, number> = {};
    let total = 0;
    const countedRows = new Set<string>();
    let cursor: string | undefined;

    // Initialize breakdown
    for (const choiceId of choiceIds) {
      breakdown[choiceId] = 0;
    }

    // Process in batches using cursor pagination
    while (true) {
      const rows = await prisma.row.findMany({
        where: { tableId },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, values: true },
      });

      if (rows.length === 0) break;

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

      cursor = rows[rows.length - 1].id;

      // If we got fewer rows than batch size, we're done
      if (rows.length < BATCH_SIZE) break;
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

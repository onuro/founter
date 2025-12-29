import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VIEW_SETTINGS } from '@/types/views';

// POST /api/tables/migrate-views - Add default views to existing tables
export async function POST() {
  try {
    // Find all tables without views
    const tablesWithoutViews = await prisma.customTable.findMany({
      where: {
        views: {
          none: {},
        },
      },
      select: { id: true, name: true },
    });

    if (tablesWithoutViews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All tables already have views',
        migratedCount: 0,
      });
    }

    // Create default Grid view for each table without views
    const createOperations = tablesWithoutViews.map((table) =>
      prisma.tableView.create({
        data: {
          tableId: table.id,
          name: 'Grid',
          type: 'grid',
          isDefault: true,
          order: 0,
          settings: DEFAULT_VIEW_SETTINGS as object,
        },
      })
    );

    await prisma.$transaction(createOperations);

    return NextResponse.json({
      success: true,
      message: `Created default views for ${tablesWithoutViews.length} tables`,
      migratedCount: tablesWithoutViews.length,
      migratedTables: tablesWithoutViews.map((t) => t.name),
    });
  } catch (error) {
    console.error('Error migrating views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate views' },
      { status: 500 }
    );
  }
}

// GET /api/tables/migrate-views - Check migration status
export async function GET() {
  try {
    const tablesWithoutViews = await prisma.customTable.count({
      where: {
        views: {
          none: {},
        },
      },
    });

    const tablesWithViews = await prisma.customTable.count({
      where: {
        views: {
          some: {},
        },
      },
    });

    return NextResponse.json({
      success: true,
      tablesWithoutViews,
      tablesWithViews,
      needsMigration: tablesWithoutViews > 0,
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}

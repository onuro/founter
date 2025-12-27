import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaserowClient } from '@/lib/baserow/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const databaseId = parseInt(id, 10);

    if (isNaN(databaseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid database ID' },
        { status: 400 }
      );
    }

    // Get Baserow credentials from settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings?.baserowHost || !settings?.baserowUsername || !settings?.baserowPassword) {
      return NextResponse.json(
        { success: false, error: 'Baserow credentials not configured' },
        { status: 400 }
      );
    }

    // Create client and authenticate
    const client = new BaserowClient(settings.baserowHost);
    await client.login(settings.baserowUsername, settings.baserowPassword);

    // Fetch tables
    const tables = await client.listTables(databaseId);

    return NextResponse.json({
      success: true,
      data: tables.map((t) => ({
        id: t.id,
        name: t.name,
        order: t.order,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch Baserow tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tables',
      },
      { status: 500 }
    );
  }
}

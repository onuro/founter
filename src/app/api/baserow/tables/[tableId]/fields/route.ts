import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaserowClient } from '@/lib/baserow/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId: tableIdStr } = await params;
    const tableId = parseInt(tableIdStr, 10);

    if (isNaN(tableId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid table ID' },
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

    // Fetch fields
    const fields = await client.getTableFields(tableId);

    return NextResponse.json({
      success: true,
      data: fields.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        primary: f.primary,
        order: f.order,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch Baserow fields:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch fields',
      },
      { status: 500 }
    );
  }
}

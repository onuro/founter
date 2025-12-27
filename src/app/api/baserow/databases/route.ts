import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaserowClient } from '@/lib/baserow/client';

export async function GET() {
  try {
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

    // Fetch databases
    const databases = await client.listDatabases();

    return NextResponse.json({
      success: true,
      data: databases.map((db) => ({
        id: db.id,
        name: db.name,
        group: db.group?.name || 'Unknown',
      })),
    });
  } catch (error) {
    console.error('Failed to fetch Baserow databases:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch databases',
      },
      { status: 500 }
    );
  }
}

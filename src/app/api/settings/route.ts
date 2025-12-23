import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return '••••••••' + key.slice(-4);
}

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default' },
      });
    }

    // Mask sensitive keys for display (show last 4 chars only)
    return NextResponse.json({
      success: true,
      data: {
        baserowToken: settings.baserowToken ? maskKey(settings.baserowToken) : '',
        openaiKey: settings.openaiKey ? maskKey(settings.openaiKey) : '',
        anthropicKey: settings.anthropicKey ? maskKey(settings.anthropicKey) : '',
        glmKey: settings.glmKey ? maskKey(settings.glmKey) : '',
      },
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { baserowToken, openaiKey, anthropicKey, glmKey } = body;

    // Build update data - only update fields that are provided and not masked
    const updateData: Record<string, string | null> = {};

    if (baserowToken !== undefined && !baserowToken.startsWith('••••')) {
      updateData.baserowToken = baserowToken || null;
    }
    if (openaiKey !== undefined && !openaiKey.startsWith('••••')) {
      updateData.openaiKey = openaiKey || null;
    }
    if (anthropicKey !== undefined && !anthropicKey.startsWith('••••')) {
      updateData.anthropicKey = anthropicKey || null;
    }
    if (glmKey !== undefined && !glmKey.startsWith('••••')) {
      updateData.glmKey = glmKey || null;
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      },
    });

    // Return masked values
    return NextResponse.json({
      success: true,
      data: {
        baserowToken: settings.baserowToken ? maskKey(settings.baserowToken) : '',
        openaiKey: settings.openaiKey ? maskKey(settings.openaiKey) : '',
        anthropicKey: settings.anthropicKey ? maskKey(settings.anthropicKey) : '',
        glmKey: settings.glmKey ? maskKey(settings.glmKey) : '',
      },
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

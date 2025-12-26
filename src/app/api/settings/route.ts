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
        baserowTokenDescription: settings.baserowTokenDescription || '',
        openaiKey: settings.openaiKey ? maskKey(settings.openaiKey) : '',
        openaiKeyDescription: settings.openaiKeyDescription || '',
        anthropicKey: settings.anthropicKey ? maskKey(settings.anthropicKey) : '',
        anthropicKeyDescription: settings.anthropicKeyDescription || '',
        glmKey: settings.glmKey ? maskKey(settings.glmKey) : '',
        glmKeyDescription: settings.glmKeyDescription || '',
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
    const {
      baserowToken,
      baserowTokenDescription,
      openaiKey,
      openaiKeyDescription,
      anthropicKey,
      anthropicKeyDescription,
      glmKey,
      glmKeyDescription,
    } = body;

    // Build update data - only update fields that are provided and not masked
    const updateData: Record<string, string | null> = {};

    // API keys - only update if not masked
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

    // Descriptions - always update if provided
    if (baserowTokenDescription !== undefined) {
      updateData.baserowTokenDescription = baserowTokenDescription || null;
    }
    if (openaiKeyDescription !== undefined) {
      updateData.openaiKeyDescription = openaiKeyDescription || null;
    }
    if (anthropicKeyDescription !== undefined) {
      updateData.anthropicKeyDescription = anthropicKeyDescription || null;
    }
    if (glmKeyDescription !== undefined) {
      updateData.glmKeyDescription = glmKeyDescription || null;
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      },
    });

    // Return masked values and descriptions
    return NextResponse.json({
      success: true,
      data: {
        baserowToken: settings.baserowToken ? maskKey(settings.baserowToken) : '',
        baserowTokenDescription: settings.baserowTokenDescription || '',
        openaiKey: settings.openaiKey ? maskKey(settings.openaiKey) : '',
        openaiKeyDescription: settings.openaiKeyDescription || '',
        anthropicKey: settings.anthropicKey ? maskKey(settings.anthropicKey) : '',
        anthropicKeyDescription: settings.anthropicKeyDescription || '',
        glmKey: settings.glmKey ? maskKey(settings.glmKey) : '',
        glmKeyDescription: settings.glmKeyDescription || '',
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

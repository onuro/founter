import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_FIELDS = [
  'baserowToken',
  'baserowPassword',
  'openaiKey',
  'anthropicKey',
  'glmKey',
  'deepseekKey',
  'holyshotToken',
] as const;

type AllowedField = typeof ALLOWED_FIELDS[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { field } = body as { field: string };

    // Validate the field is one of the allowed sensitive fields
    if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
      return NextResponse.json(
        { success: false, error: 'Invalid field' },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings not found' },
        { status: 404 }
      );
    }

    const value = settings[field as AllowedField] || '';

    return NextResponse.json({
      success: true,
      value,
    });
  } catch (error) {
    console.error('Failed to reveal key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reveal key' },
      { status: 500 }
    );
  }
}

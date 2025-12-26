import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Field, FieldType, FieldOptions } from '@/types/tables';

const VALID_FIELD_TYPES = ['text', 'number', 'url', 'select', 'date', 'boolean', 'longText', 'image'];

function transformField(dbField: {
  id: string;
  tableId: string;
  name: string;
  type: string;
  options: unknown;
  order: number;
  width: number;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Field {
  return {
    id: dbField.id,
    tableId: dbField.tableId,
    name: dbField.name,
    type: dbField.type as FieldType,
    options: dbField.options as FieldOptions,
    order: dbField.order,
    width: dbField.width,
    required: dbField.required,
    createdAt: dbField.createdAt,
    updatedAt: dbField.updatedAt,
  };
}

// GET /api/tables/[id]/fields - List all fields for a table
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if table exists
    const table = await prisma.customTable.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    const fields = await prisma.field.findMany({
      where: { tableId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: fields.map(transformField),
    });
  } catch (error) {
    console.error('Failed to fetch fields:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}

// POST /api/tables/[id]/fields - Create a new field
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, options, required } = body;

    // Check if table exists
    const table = await prisma.customTable.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!type || !VALID_FIELD_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid field type. Must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the highest order value to place new field at the end
    const maxOrderField = await prisma.field.findFirst({
      where: { tableId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const newOrder = (maxOrderField?.order ?? -1) + 1;

    // Create field
    const field = await prisma.field.create({
      data: {
        tableId: id,
        name: name.trim(),
        type,
        options: options || null,
        order: newOrder,
        required: required ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformField(field),
    });
  } catch (error) {
    console.error('Failed to create field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create field' },
      { status: 500 }
    );
  }
}

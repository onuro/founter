import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Field, FieldType, FieldOptions, SelectChoice, SelectFieldOptions } from '@/types/tables';
import { TAG_COLORS } from '@/types/tables';

const VALID_FIELD_TYPES = ['text', 'number', 'url', 'select', 'date', 'boolean', 'longText', 'image'];

// Convert field values when type changes
async function convertFieldValues(
  tableId: string,
  fieldId: string,
  oldType: string,
  newType: string,
  existingOptions: SelectFieldOptions | null
): Promise<{ options?: SelectFieldOptions }> {
  const rows = await prisma.row.findMany({ where: { tableId } });

  // Converting TO select - create choices from existing values
  if (newType === 'select' && oldType !== 'select') {
    const uniqueValues = new Set<string>();

    // Collect unique values from all rows
    for (const row of rows) {
      const values = row.values as Record<string, unknown>;
      const fieldValue = values[fieldId];
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        const stringValue = String(fieldValue);
        if (stringValue.trim()) {
          uniqueValues.add(stringValue.trim());
        }
      }
    }

    // Create choices from unique values
    const choices: SelectChoice[] = Array.from(uniqueValues).map((value, index) => ({
      id: crypto.randomUUID(),
      label: value,
      color: TAG_COLORS[index % TAG_COLORS.length].name,
    }));

    // Create a mapping from old values to new choice IDs
    const valueToChoiceId = new Map<string, string>();
    for (const choice of choices) {
      valueToChoiceId.set(choice.label, choice.id);
    }

    // Update all rows with new choice IDs
    await prisma.$transaction(
      rows.map((row) => {
        const values = row.values as Record<string, unknown>;
        const fieldValue = values[fieldId];
        let newValue: string | string[] | null = null;

        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
          const stringValue = String(fieldValue).trim();
          const choiceId = valueToChoiceId.get(stringValue);
          if (choiceId) {
            newValue = [choiceId]; // Store as array for multi-select compatibility
          }
        }

        return prisma.row.update({
          where: { id: row.id },
          data: {
            values: {
              ...values,
              [fieldId]: newValue,
            } as object,
          },
        });
      })
    );

    return {
      options: {
        choices,
        allowMultiple: true,
      },
    };
  }

  // Converting FROM select to text/longText - convert choice IDs to labels
  if (oldType === 'select' && (newType === 'text' || newType === 'longText')) {
    const existingChoices = existingOptions?.choices || [];
    const choiceIdToLabel = new Map<string, string>();
    for (const choice of existingChoices) {
      choiceIdToLabel.set(choice.id, choice.label);
    }

    await prisma.$transaction(
      rows.map((row) => {
        const values = row.values as Record<string, unknown>;
        const fieldValue = values[fieldId];
        let newValue: string | null = null;

        if (fieldValue) {
          const ids = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
          const labels = ids
            .map((id) => choiceIdToLabel.get(String(id)) || String(id))
            .filter(Boolean);
          newValue = labels.join(', ');
        }

        return prisma.row.update({
          where: { id: row.id },
          data: {
            values: {
              ...values,
              [fieldId]: newValue,
            } as object,
          },
        });
      })
    );
  }

  return {};
}

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

// PUT /api/tables/[id]/fields/[fieldId] - Update a field
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;
    const body = await request.json();
    const { name, type, options, width, required } = body;

    // Check if field exists and belongs to table
    const existing = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!existing || existing.tableId !== id) {
      return NextResponse.json(
        { success: false, error: 'Field not found' },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type && !VALID_FIELD_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid field type. Must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle type conversion if type is changing
    let finalOptions = options;
    if (type && type !== existing.type) {
      const conversionResult = await convertFieldValues(
        id,
        fieldId,
        existing.type,
        type,
        existing.options as SelectFieldOptions | null
      );

      // If converting to select, use auto-generated options if none provided
      if (conversionResult.options && !options?.choices?.length) {
        finalOptions = conversionResult.options;
      }
    }

    // Update field
    const field = await prisma.field.update({
      where: { id: fieldId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type }),
        ...(finalOptions !== undefined && { options: finalOptions }),
        ...(width !== undefined && { width }),
        ...(required !== undefined && { required }),
      },
    });

    return NextResponse.json({
      success: true,
      data: transformField(field),
    });
  } catch (error) {
    console.error('Failed to update field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update field' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id]/fields/[fieldId] - Delete a field
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;

    // Check if field exists and belongs to table
    const existing = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!existing || existing.tableId !== id) {
      return NextResponse.json(
        { success: false, error: 'Field not found' },
        { status: 404 }
      );
    }

    // Delete field
    await prisma.field.delete({
      where: { id: fieldId },
    });

    // Also remove this field from all row values
    const rows = await prisma.row.findMany({
      where: { tableId: id },
    });

    // Update each row to remove the deleted field from values
    await prisma.$transaction(
      rows.map((row) => {
        const values = row.values as Record<string, unknown>;
        const { [fieldId]: _, ...remainingValues } = values;
        return prisma.row.update({
          where: { id: row.id },
          data: { values: remainingValues as object },
        });
      })
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete field' },
      { status: 500 }
    );
  }
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTables } from '@/hooks/useTables';
import { useTable } from '@/hooks/useTable';
import { TablesSidebar } from './TablesSidebar';
import { TableView } from './TableView';
import { RowDetailSheet } from './RowDetailSheet';
import { CreateTableDialog } from './CreateTableDialog';
import { AddFieldDialog } from './AddFieldDialog';
import type { Field, Row, CreateFieldInput } from '@/types/tables';

export function TablesLayout() {
  const router = useRouter();
  const params = useParams();
  const tableId = params?.id as string | undefined;

  // State
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isRowSheetOpen, setIsRowSheetOpen] = useState(false);
  const [isNewRow, setIsNewRow] = useState(false);

  // Hooks
  const {
    tables,
    isLoading: isLoadingTables,
    createTable,
    updateTable,
    deleteTable,
    reorderTables,
  } = useTables();

  const {
    table,
    isLoading: isLoadingTable,
    isLoadingMore,
    refetch: refetchTable,
    totalRows,
    hasMore,
    loadMoreRows,
    createField,
    updateField,
    deleteField,
    reorderFields,
    createRow,
    updateRow,
    deleteRow,
  } = useTable(tableId || null, { paginate: true, pageSize: 100 });

  // Auto-select first table if none selected
  useEffect(() => {
    if (!tableId && tables.length > 0 && !isLoadingTables) {
      router.push(`/tables/${tables[0].id}`);
    }
  }, [tableId, tables, isLoadingTables, router]);

  // Handlers
  const handleSelectTable = useCallback(
    (id: string) => {
      router.push(`/tables/${id}`);
    },
    [router]
  );

  const handleCreateTable = useCallback(
    async (name: string) => {
      try {
        const newTable = await createTable({ name });
        toast.success('Table created');
        router.push(`/tables/${newTable.id}`);
      } catch (error) {
        toast.error('Failed to create table');
        throw error;
      }
    },
    [createTable, router]
  );

  const handleDeleteTable = useCallback(
    async (id: string) => {
      try {
        await deleteTable(id);
        toast.success('Table deleted');
        // Navigate to first remaining table or home
        const remaining = tables.filter((t) => t.id !== id);
        if (remaining.length > 0) {
          router.push(`/tables/${remaining[0].id}`);
        } else {
          router.push('/tables');
        }
      } catch (error) {
        toast.error('Failed to delete table');
      }
    },
    [deleteTable, tables, router]
  );

  const handleRenameTable = useCallback(
    async (id: string, name: string) => {
      try {
        await updateTable(id, { name });
        toast.success('Table renamed');
      } catch (error) {
        toast.error('Failed to rename table');
      }
    },
    [updateTable]
  );

  const handleReorderTables = useCallback(
    async (orderedIds: string[]) => {
      try {
        await reorderTables(orderedIds);
      } catch (error) {
        toast.error('Failed to reorder tables');
      }
    },
    [reorderTables]
  );

  const handleAddField = useCallback(async () => {
    setEditingField(null);
    setIsAddFieldOpen(true);
  }, []);

  const handleEditField = useCallback((field: Field) => {
    setEditingField(field);
    setIsAddFieldOpen(true);
  }, []);

  const handleDeleteField = useCallback(
    async (fieldId: string) => {
      try {
        await deleteField(fieldId);
        toast.success('Field deleted');
      } catch (error) {
        toast.error('Failed to delete field');
      }
    },
    [deleteField]
  );

  const handleReorderFields = useCallback(
    async (orderedIds: string[]) => {
      try {
        await reorderFields(orderedIds);
      } catch (error) {
        toast.error('Failed to reorder fields');
      }
    },
    [reorderFields]
  );

  const handleResizeField = useCallback(
    async (fieldId: string, width: number) => {
      try {
        await updateField(fieldId, { width });
      } catch (error) {
        toast.error('Failed to resize column');
      }
    },
    [updateField]
  );

  const handleSaveField = useCallback(
    async (input: CreateFieldInput, cleanupChoiceIds?: string[]) => {
      try {
        if (editingField) {
          await updateField(editingField.id, { ...input, cleanupChoiceIds });
          // Refetch table if rows were cleaned up to update row state
          if (cleanupChoiceIds && cleanupChoiceIds.length > 0) {
            await refetchTable();
          }
          toast.success('Field updated');
        } else {
          await createField(input);
          toast.success('Field added');
        }
      } catch (error) {
        toast.error(editingField ? 'Failed to update field' : 'Failed to add field');
        throw error;
      }
    },
    [editingField, createField, updateField, refetchTable]
  );

  const handleAddRow = useCallback(() => {
    setSelectedRowId(null);
    setIsNewRow(true);
    setIsRowSheetOpen(true);
  }, []);

  const handleSelectRow = useCallback((rowId: string) => {
    setSelectedRowId(rowId);
    setIsNewRow(false);
    setIsRowSheetOpen(true);
  }, []);

  const handleSaveRow = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        if (isNewRow) {
          await createRow({ values });
          toast.success('Row added');
        } else if (selectedRowId) {
          await updateRow(selectedRowId, { values });
          toast.success('Row updated');
        }
      } catch (error) {
        toast.error(isNewRow ? 'Failed to add row' : 'Failed to update row');
        throw error;
      }
    },
    [isNewRow, selectedRowId, createRow, updateRow]
  );

  const handleDeleteRow = useCallback(
    async (rowId: string) => {
      try {
        await deleteRow(rowId);
        toast.success('Row deleted');
      } catch (error) {
        toast.error('Failed to delete row');
        throw error;
      }
    },
    [deleteRow]
  );

  const selectedRow = table?.rows.find((r) => r.id === selectedRowId) || null;

  return (
    <div className="grid grid-cols-[260px_1fr] h-[calc(100vh-5.8rem)] ml-2.5 mr-5 rounded-md overflow-hidden">
      {/* Sidebar */}
      <div className="border-r border-border">
        <TablesSidebar
          tables={tables}
          selectedTableId={tableId || null}
          onSelectTable={handleSelectTable}
          onCreateTable={() => setIsCreateTableOpen(true)}
          onDeleteTable={handleDeleteTable}
          onRenameTable={handleRenameTable}
          onReorderTables={handleReorderTables}
          isLoading={isLoadingTables}
        />
      </div>

      {/* Main content */}
      <div className="bg-background overflow-auto">
        <TableView
          table={table}
          selectedRowId={selectedRowId}
          onRowSelect={handleSelectRow}
          onAddField={handleAddField}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
          onReorderFields={handleReorderFields}
          onResizeField={handleResizeField}
          onAddRow={handleAddRow}
          isLoading={isLoadingTable}
          totalRows={totalRows}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreRows}
        />
      </div>

      {/* Dialogs */}
      <CreateTableDialog
        open={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
        onCreate={handleCreateTable}
      />

      <AddFieldDialog
        open={isAddFieldOpen}
        onOpenChange={setIsAddFieldOpen}
        onAdd={handleSaveField}
        existingField={editingField}
        tableId={tableId}
      />

      <RowDetailSheet
        open={isRowSheetOpen}
        onOpenChange={setIsRowSheetOpen}
        row={isNewRow ? null : selectedRow}
        fields={table?.fields || []}
        tableId={tableId || ''}
        onSave={handleSaveRow}
        onDelete={handleDeleteRow}
        isNew={isNewRow}
      />
    </div>
  );
}

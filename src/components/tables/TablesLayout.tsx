'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTablesContext } from '@/contexts/TablesContext';
import { useTable } from '@/hooks/useTable';
import { TablesSidebar } from './TablesSidebar';
import { TableView } from './TableView';
import { RowDetailSheet } from './RowDetailSheet';
import { CreateTableDialog } from './CreateTableDialog';
import { AddFieldDialog } from './AddFieldDialog';
import { ImportTableDialog } from './ImportTableDialog';
import type { Field, CreateFieldInput, RowHeight, CellPosition } from '@/types/tables';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [rowHeight, setRowHeight] = useState<RowHeight>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('tables-row-height') as RowHeight) || 'small';
    }
    return 'small';
  });

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImportTableOpen, setIsImportTableOpen] = useState(false);

  // Inline editing state
  const [focusedCell, setFocusedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);

  // Hooks
  const {
    tables,
    isLoading: isLoadingTables,
    createTable,
    updateTable,
    deleteTable,
    reorderTables,
  } = useTablesContext();

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
    deleteRows,
  } = useTable(tableId || null, { paginate: true, pageSize: 100 });

  // Auto-select first table if none selected
  useEffect(() => {
    if (!tableId && tables.length > 0 && !isLoadingTables) {
      router.push(`/tables/${tables[0].id}`);
    }
  }, [tableId, tables, isLoadingTables, router]);

  // Clear selection and cell focus when table changes
  useEffect(() => {
    setSelectedRowIds(new Set());
    setFocusedCell(null);
    setEditingCell(null);
  }, [tableId]);

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

  const handleExportTable = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tables/${id}/export`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'table-export.json';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Table exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export table');
    }
  }, []);

  const handleImportTable = useCallback(
    async (file: File, tableName: string) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tableName', tableName);

        const response = await fetch('/api/tables/import', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Import failed');
        }

        toast.success(`Imported "${result.data.tableName}" with ${result.data.rowCount} rows`);

        // Navigate to the new table
        if (result.data.tableId) {
          router.push(`/tables/${result.data.tableId}`);
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import table');
        throw error;
      }
    },
    [router]
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

  const handleRowHeightChange = useCallback((height: RowHeight) => {
    setRowHeight(height);
    localStorage.setItem('tables-row-height', height);
  }, []);

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

  // Inline editing handlers
  const handleCellFocus = useCallback((position: CellPosition | null) => {
    setFocusedCell(position);
    if (!position) {
      setEditingCell(null);
    }
  }, []);

  const handleCellEdit = useCallback((position: CellPosition | null) => {
    setEditingCell(position);
    if (position) {
      setFocusedCell(position);
    }
  }, []);

  const handleInlineSave = useCallback(
    async (rowId: string, fieldId: string, value: unknown) => {
      try {
        const row = table?.rows.find((r) => r.id === rowId);
        if (!row) return;

        const newValues = { ...row.values, [fieldId]: value };
        await updateRow(rowId, { values: newValues });
        // Silent success for fluid UX
      } catch (error) {
        toast.error('Failed to save');
      }
    },
    [table?.rows, updateRow]
  );

  const handleOpenSheetForRow = useCallback((rowId: string) => {
    setSelectedRowId(rowId);
    setIsNewRow(false);
    setIsRowSheetOpen(true);
    setFocusedCell(null);
    setEditingCell(null);
  }, []);

  const handleDeleteSelectedRows = useCallback(async () => {
    if (selectedRowIds.size === 0) return;

    setIsDeleting(true);
    try {
      const rowIds = Array.from(selectedRowIds);
      const deletedCount = await deleteRows(rowIds);
      toast.success(`Deleted ${deletedCount} row${deletedCount !== 1 ? 's' : ''}`);
      setSelectedRowIds(new Set());
    } catch (error) {
      toast.error('Failed to delete rows');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedRowIds, deleteRows]);

  const selectedRow = table?.rows.find((r) => r.id === selectedRowId) || null;

  return (
    <div className="grid grid-cols-[260px_1fr] h-[calc(100vh-5.8rem)] ml-0 mr-3.5 rounded-md overflow-hidden">
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
          onExportTable={handleExportTable}
          onImportTable={() => setIsImportTableOpen(true)}
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
          rowHeight={rowHeight}
          onRowHeightChange={handleRowHeightChange}
          totalRows={totalRows}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreRows}
          selectedRowIds={selectedRowIds}
          onSelectionChange={setSelectedRowIds}
          onDeleteSelected={() => setShowDeleteConfirm(true)}
          isDeleting={isDeleting}
          // Inline editing props
          focusedCell={focusedCell}
          editingCell={editingCell}
          onCellFocus={handleCellFocus}
          onCellEdit={handleCellEdit}
          onInlineSave={handleInlineSave}
          onOpenSheet={handleOpenSheetForRow}
        />
      </div>

      {/* Dialogs */}
      <CreateTableDialog
        open={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
        onCreate={handleCreateTable}
      />

      <ImportTableDialog
        open={isImportTableOpen}
        onOpenChange={setIsImportTableOpen}
        onImport={handleImportTable}
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

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedRowIds.size} row{selectedRowIds.size !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected rows. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelectedRows}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

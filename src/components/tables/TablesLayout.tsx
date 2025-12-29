'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTablesContext } from '@/contexts/TablesContext';
import { useTable } from '@/hooks/useTable';
import { useViews } from '@/hooks/useViews';
import { TablesSidebar } from './TablesSidebar';
import { TableView } from './TableView';
import { CardView } from './CardView';
import { RowDetailSheet } from './RowDetailSheet';
import { CreateTableDialog } from './CreateTableDialog';
import { AddFieldDialog } from './AddFieldDialog';
import { ImportTableDialog } from './ImportTableDialog';
import { ViewSwitcher } from './ViewSwitcher';
import { ViewSettingsDialog } from './ViewSettingsDialog';
import type { Field, CreateFieldInput, CellPosition } from '@/types/tables';
import type { ViewType, ViewSettings } from '@/types/views';
import { DEFAULT_VIEW_SETTINGS } from '@/types/views';
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
  const hasMigrated = useRef(false);

  // State
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isRowSheetOpen, setIsRowSheetOpen] = useState(false);
  const [isNewRow, setIsNewRow] = useState(false);
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);
  const [settingsViewId, setSettingsViewId] = useState<string | null>(null);

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImportTableOpen, setIsImportTableOpen] = useState(false);

  // Inline editing state (for Grid view only)
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
    setTable,
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

  // Views hook
  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    setViewsFromTable,
    createView,
    updateView,
    updateViewSettings,
    deleteView,
    setDefaultView,
  } = useViews(tableId || null, table?.views || [], {
    onViewsChange: (newViews) => {
      // Update table state with new views
      if (table) {
        setTable({ ...table, views: newViews });
      }
    },
  });

  // Sync views when table changes
  useEffect(() => {
    if (table?.views) {
      setViewsFromTable(table.views);
    }
  }, [table?.id, table?.views, setViewsFromTable]);

  // Migrate tables without views on first load
  useEffect(() => {
    if (!hasMigrated.current && !isLoadingTables) {
      hasMigrated.current = true;
      // Check if migration is needed
      fetch('/api/tables/migrate-views', { method: 'GET' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.needsMigration) {
            // Run migration silently
            fetch('/api/tables/migrate-views', { method: 'POST' })
              .then((res) => res.json())
              .then((result) => {
                if (result.success && result.migratedCount > 0) {
                  console.log(`Migrated ${result.migratedCount} tables to have default views`);
                  // Refetch current table if it was migrated
                  if (table && table.views.length === 0) {
                    refetchTable();
                  }
                }
              })
              .catch(console.error);
          }
        })
        .catch(console.error);
    }
  }, [isLoadingTables, table, refetchTable]);

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

  // Get current view settings
  const currentViewSettings = activeView?.settings || DEFAULT_VIEW_SETTINGS;
  const isCardView = activeView?.type === 'card';

  // View handlers
  const handleCreateView = useCallback(
    async (name: string, type: ViewType) => {
      try {
        await createView({ name, type });
        toast.success('View created');
      } catch (error) {
        toast.error('Failed to create view');
        throw error;
      }
    },
    [createView]
  );

  const handleRenameView = useCallback(
    async (viewId: string, name: string) => {
      try {
        await updateView(viewId, { name });
        toast.success('View renamed');
      } catch (error) {
        toast.error('Failed to rename view');
        throw error;
      }
    },
    [updateView]
  );

  const handleDeleteView = useCallback(
    async (viewId: string) => {
      try {
        await deleteView(viewId);
        toast.success('View deleted');
      } catch (error) {
        toast.error('Failed to delete view');
        throw error;
      }
    },
    [deleteView]
  );

  const handleSetDefaultView = useCallback(
    async (viewId: string) => {
      try {
        await setDefaultView(viewId);
        toast.success('Default view updated');
      } catch (error) {
        toast.error('Failed to set default view');
        throw error;
      }
    },
    [setDefaultView]
  );

  const handleOpenViewSettings = useCallback((viewId: string) => {
    setSettingsViewId(viewId);
    setIsViewSettingsOpen(true);
  }, []);

  const handleSaveViewSettings = useCallback(
    async (viewId: string, settings: Partial<ViewSettings>) => {
      try {
        await updateViewSettings(viewId, settings);
        toast.success('View settings saved');
      } catch (error) {
        toast.error('Failed to save view settings');
        throw error;
      }
    },
    [updateViewSettings]
  );

  // Row height change (now updates view settings)
  const handleRowHeightChange = useCallback(
    async (height: 'small' | 'medium' | 'large') => {
      if (!activeViewId) return;
      try {
        await updateViewSettings(activeViewId, { rowHeight: height });
      } catch (error) {
        toast.error('Failed to update row height');
      }
    },
    [activeViewId, updateViewSettings]
  );

  // Table handlers
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

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'table-export.json';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

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

  // Field handlers
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

  // Row handlers
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

  // Inline editing handlers (Grid view only)
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
  const settingsView = views.find((v) => v.id === settingsViewId) || null;

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
      <div className="bg-background overflow-auto flex flex-col">
        {/* View switcher header */}
        {table && views.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface shrink-0">
            <ViewSwitcher
              views={views}
              activeViewId={activeViewId}
              onViewChange={setActiveViewId}
              onCreateView={handleCreateView}
              onRenameView={handleRenameView}
              onDeleteView={handleDeleteView}
              onSetDefault={handleSetDefaultView}
              onOpenSettings={handleOpenViewSettings}
              disabled={isLoadingTable}
            />
          </div>
        )}

        {/* View content */}
        <div className="flex-1 min-h-0">
          {isCardView ? (
            <CardView
              table={table}
              viewSettings={currentViewSettings}
              onRowSelect={handleSelectRow}
              onAddRow={handleAddRow}
              isLoading={isLoadingTable}
              totalRows={totalRows}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMoreRows}
              selectedRowIds={selectedRowIds}
              onSelectionChange={setSelectedRowIds}
              onDeleteSelected={() => setShowDeleteConfirm(true)}
              isDeleting={isDeleting}
            />
          ) : (
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
              rowHeight={currentViewSettings.rowHeight}
              onRowHeightChange={handleRowHeightChange}
              totalRows={totalRows}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMoreRows}
              selectedRowIds={selectedRowIds}
              onSelectionChange={setSelectedRowIds}
              onDeleteSelected={() => setShowDeleteConfirm(true)}
              isDeleting={isDeleting}
              focusedCell={focusedCell}
              editingCell={editingCell}
              onCellFocus={handleCellFocus}
              onCellEdit={handleCellEdit}
              onInlineSave={handleInlineSave}
              onOpenSheet={handleOpenSheetForRow}
            />
          )}
        </div>
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

      <ViewSettingsDialog
        open={isViewSettingsOpen}
        onOpenChange={setIsViewSettingsOpen}
        view={settingsView}
        fields={table?.fields || []}
        onSave={handleSaveViewSettings}
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

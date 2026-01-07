'use client';

import { AlertTriangle, Table2, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface TableUsage {
  id: string;
  name: string;
  rowCount: number;
}

interface UsageInfo {
  count: number;
  tables: TableUsage[];
}

interface DeleteMediaConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileCount: number;
  usage: UsageInfo | null;
  isLoading?: boolean;
  onCancel: () => void;
  onDeleteWithCascade: () => void;
  onDeleteWithoutCascade: () => void;
}

export function DeleteMediaConfirmDialog({
  open,
  onOpenChange,
  fileCount,
  usage,
  isLoading = false,
  onCancel,
  onDeleteWithCascade,
  onDeleteWithoutCascade,
}: DeleteMediaConfirmDialogProps) {
  const hasUsage = usage && usage.count > 0;
  const fileLabel = fileCount === 1 ? 'file' : 'files';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasUsage ? (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Image{fileCount > 1 ? 's' : ''} in Use
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 text-destructive" />
                Delete {fileCount} {fileLabel}?
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : hasUsage ? (
                <>
                  <p>
                    {fileCount === 1 ? 'This image is' : 'These images are'} referenced in{' '}
                    <strong>{usage.count} row{usage.count !== 1 ? 's' : ''}</strong> across{' '}
                    <strong>{usage.tables.length} table{usage.tables.length !== 1 ? 's' : ''}</strong>.
                  </p>

                  {/* Table breakdown */}
                  <div className="bg-secondary rounded-md p-3 space-y-1.5">
                    {usage.tables.map((table) => (
                      <div key={table.id} className="flex items-center gap-2 text-sm">
                        <Table2 className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{table.name}</span>
                        <span className="text-muted-foreground">
                          {table.rowCount} row{table.rowCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Choose how to handle the table references:
                  </p>
                </>
              ) : (
                <p>
                  This will permanently delete {fileCount === 1 ? 'this file' : `these ${fileCount} files`}.
                  This action cannot be undone.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className={hasUsage ? 'flex-col gap-2 sm:flex-col' : ''}>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>

          {hasUsage ? (
            <>
              <Button
                variant="default"
                onClick={onDeleteWithCascade}
                className="w-full sm:w-auto"
              >
                Delete & Clear References
              </Button>
              <Button
                variant="destructive"
                onClick={onDeleteWithoutCascade}
                className="w-full sm:w-auto"
              >
                Delete Anyway (leave broken)
              </Button>
            </>
          ) : (
            <AlertDialogAction
              onClick={onDeleteWithoutCascade}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

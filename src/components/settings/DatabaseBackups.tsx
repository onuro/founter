'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Download,
  Upload,
  Trash2,
  HardDrive,
  Clock,
  AlertTriangle,
} from 'lucide-react';
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

interface BackupInfo {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  sizeFormatted: string;
}

export function DatabaseBackups() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Confirmation dialogs
  const [restoreConfirm, setRestoreConfirm] = useState<BackupInfo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BackupInfo | null>(null);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/db/backups');
      const data = await response.json();
      if (data.success) {
        setBackups(data.data);
      } else {
        setError(data.error || 'Failed to load backups');
      }
    } catch {
      setError('Failed to load backups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBackup = async () => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/db/backups', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Backup created successfully');
        await fetchBackups();
      } else {
        setError(data.error || 'Failed to create backup');
      }
    } catch {
      setError('Failed to create backup');
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (backup: BackupInfo) => {
    setRestoringId(backup.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/db/restore/${backup.id}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(
          'Database restored successfully. A pre-restore backup was created automatically.'
        );
        await fetchBackups();
      } else {
        setError(data.error || 'Failed to restore backup');
      }
    } catch {
      setError('Failed to restore backup');
    } finally {
      setRestoringId(null);
      setRestoreConfirm(null);
    }
  };

  const deleteBackup = async (backup: BackupInfo) => {
    setDeletingId(backup.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/db/backups/${backup.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Backup deleted successfully');
        await fetchBackups();
      } else {
        setError(data.error || 'Failed to delete backup');
      }
    } catch {
      setError('Failed to delete backup');
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Database Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a full backup of your SQLite database. Backups are stored locally
            in the <code className="text-xs bg-muted px-1 py-0.5 rounded">backups/</code> directory.
          </p>
          <Button
            onClick={createBackup}
            disabled={isCreating}
            className="w-full cursor-pointer"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Create Backup Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-sm bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-500">{successMessage}</p>
        </div>
      )}

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Available Backups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No backups yet. Create your first backup above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{backup.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(backup.createdAt)} • {backup.sizeFormatted}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreConfirm(backup)}
                      disabled={restoringId === backup.id}
                      className="cursor-pointer"
                    >
                      {restoringId === backup.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline ml-1">Restore</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(backup)}
                      disabled={deletingId === backup.id}
                      className="cursor-pointer text-destructive hover:text-destructive"
                    >
                      {deletingId === backup.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={!!restoreConfirm}
        onOpenChange={() => setRestoreConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Restore Database?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to restore the database from backup:{' '}
                <strong>{restoreConfirm?.filename}</strong>
              </p>
              <p>
                This will replace your current database. A pre-restore backup
                will be created automatically before restoring.
              </p>
              <p className="text-amber-500 font-medium">
                You may need to refresh the page after restoration.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreConfirm && restoreBackup(restoreConfirm)}
              className="bg-amber-600 hover:bg-amber-700 cursor-pointer"
            >
              Yes, Restore Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Backup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                Are you sure you want to delete backup:{' '}
                <strong>{deleteConfirm?.filename}</strong>?
              </p>
              <p className="mt-2">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteBackup(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              Yes, Delete Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

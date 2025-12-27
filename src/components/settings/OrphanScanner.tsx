'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Search,
  Trash2,
  FolderX,
  FileX,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
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
import type { ScanResult, OrphanFile, OrphanDirectory } from '@/app/api/tools/orphan-scan/route';

export function OrphanScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedDirectories, setSelectedDirectories] = useState<Set<string>>(new Set());

  // Collapsible sections
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [directoriesExpanded, setDirectoriesExpanded] = useState(true);

  // Confirmation dialog
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setSuccessMessage(null);
    setScanResult(null);
    setSelectedFiles(new Set());
    setSelectedDirectories(new Set());

    try {
      const response = await fetch('/api/tools/orphan-scan');
      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
      } else {
        setError(data.error || 'Failed to scan for orphan data');
      }
    } catch {
      setError('Failed to scan for orphan data');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const runCleanup = async () => {
    if (selectedFiles.size === 0 && selectedDirectories.size === 0) {
      setError('Please select files or directories to clean up');
      return;
    }

    setIsCleaning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/tools/orphan-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: Array.from(selectedFiles),
          directories: Array.from(selectedDirectories),
          confirmed: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { movedFiles, movedDirectories, errors } = data.data;
        let message = `Moved ${movedFiles} file(s) and ${movedDirectories} directory(s) to trash.`;
        if (errors && errors.length > 0) {
          message += ` ${errors.length} error(s) occurred.`;
        }
        setSuccessMessage(message);

        // Re-scan after cleanup
        await runScan();
      } else {
        setError(data.error || 'Failed to clean up orphan data');
      }
    } catch {
      setError('Failed to clean up orphan data');
    } finally {
      setIsCleaning(false);
      setShowCleanupConfirm(false);
    }
  };

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const toggleDirectorySelection = (dirPath: string) => {
    setSelectedDirectories((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return next;
    });
  };

  const selectAllFiles = () => {
    if (scanResult?.orphanFiles) {
      setSelectedFiles(new Set(scanResult.orphanFiles.map((f) => f.path)));
    }
  };

  const selectAllDirectories = () => {
    if (scanResult?.orphanDirectories) {
      setSelectedDirectories(new Set(scanResult.orphanDirectories.map((d) => d.path)));
    }
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
    setSelectedDirectories(new Set());
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

  const hasOrphans = scanResult && (scanResult.orphanFiles.length > 0 || scanResult.orphanDirectories.length > 0);
  const hasSelection = selectedFiles.size > 0 || selectedDirectories.size > 0;

  return (
    <div className="space-y-6">
      {/* Scan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Orphan Data Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan for unused files and directories in the Tables feature. This includes image files
            that are no longer referenced by any table row, and directories for deleted tables.
          </p>
          <Button
            onClick={runScan}
            disabled={isScanning}
            className="w-full cursor-pointer"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scan Now
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

      {/* Scan Results */}
      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {hasOrphans ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                Scan Results
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {formatDate(scanResult.scannedAt)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-md bg-muted/50">
                <div className="text-muted-foreground">Files Scanned</div>
                <div className="text-lg font-semibold">{scanResult.stats.totalFilesScanned}</div>
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <div className="text-muted-foreground">Referenced Files</div>
                <div className="text-lg font-semibold">{scanResult.stats.totalReferencedFiles}</div>
              </div>
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <div className="text-amber-600 dark:text-amber-400">Orphan Files</div>
                <div className="text-lg font-semibold">
                  {scanResult.stats.orphanFilesCount}
                  <span className="text-sm font-normal ml-2">
                    ({scanResult.stats.orphanFilesSizeFormatted})
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <div className="text-amber-600 dark:text-amber-400">Orphan Directories</div>
                <div className="text-lg font-semibold">{scanResult.stats.orphanDirectoriesCount}</div>
              </div>
            </div>

            {!hasOrphans && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>No orphan data found. Your storage is clean!</p>
              </div>
            )}

            {/* Orphan Files Section */}
            {scanResult.orphanFiles.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setFilesExpanded(!filesExpanded)}
                  className="flex items-center gap-2 w-full text-left font-medium cursor-pointer hover:text-foreground/80"
                >
                  {filesExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <FileX className="w-4 h-4 text-amber-500" />
                  Orphan Files ({scanResult.orphanFiles.length})
                  <span className="text-sm font-normal text-muted-foreground ml-auto">
                    {scanResult.stats.orphanFilesSizeFormatted}
                  </span>
                </button>

                {filesExpanded && (
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllFiles}
                        className="text-xs cursor-pointer"
                      >
                        Select All
                      </Button>
                    </div>
                    {scanResult.orphanFiles.map((file) => (
                      <OrphanFileItem
                        key={file.path}
                        file={file}
                        selected={selectedFiles.has(file.path)}
                        onToggle={() => toggleFileSelection(file.path)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orphan Directories Section */}
            {scanResult.orphanDirectories.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setDirectoriesExpanded(!directoriesExpanded)}
                  className="flex items-center gap-2 w-full text-left font-medium cursor-pointer hover:text-foreground/80"
                >
                  {directoriesExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <FolderX className="w-4 h-4 text-amber-500" />
                  Orphan Directories ({scanResult.orphanDirectories.length})
                </button>

                {directoriesExpanded && (
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllDirectories}
                        className="text-xs cursor-pointer"
                      >
                        Select All
                      </Button>
                    </div>
                    {scanResult.orphanDirectories.map((dir) => (
                      <OrphanDirectoryItem
                        key={dir.path}
                        directory={dir}
                        selected={selectedDirectories.has(dir.path)}
                        onToggle={() => toggleDirectorySelection(dir.path)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cleanup Actions */}
            {hasOrphans && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {hasSelection
                    ? `${selectedFiles.size} file(s), ${selectedDirectories.size} directory(s) selected`
                    : 'Select items to clean up'}
                </div>
                <div className="flex items-center gap-2">
                  {hasSelection && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      className="cursor-pointer"
                    >
                      Deselect All
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCleanupConfirm(true)}
                    disabled={!hasSelection || isCleaning}
                    className="cursor-pointer"
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Move to Trash
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={showCleanupConfirm} onOpenChange={setShowCleanupConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Move to Trash?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>
                  You are about to move {selectedFiles.size} file(s) and{' '}
                  {selectedDirectories.size} directory(s) to the trash folder.
                </p>
                <p>
                  Files will be moved to <code className="text-xs bg-muted px-1 py-0.5 rounded">uploads/trash/</code> and can be manually recovered if needed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runCleanup}
              className="bg-amber-600 hover:bg-amber-700 cursor-pointer"
            >
              Yes, Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-components

function OrphanFileItem({
  file,
  selected,
  onToggle,
}: {
  file: OrphanFile;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 rounded border-border"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.filename}</p>
        <p className="text-xs text-muted-foreground truncate">
          {file.tableName} <span className="opacity-60">({file.tableId})</span>
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {file.sizeFormatted}
      </span>
    </label>
  );
}

function OrphanDirectoryItem({
  directory,
  selected,
  onToggle,
}: {
  directory: OrphanDirectory;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 rounded border-border"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{directory.tableId}</p>
        <p className="text-xs text-muted-foreground">
          {directory.fileCount} file(s) - {directory.totalSizeFormatted}
        </p>
      </div>
    </label>
  );
}

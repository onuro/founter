'use client';

import { useState, useRef } from 'react';
import { Upload, FileJson, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImportPreview {
  tableName: string;
  tableIcon: string | null;
  fieldCount: number;
  rowCount: number;
  hasImageFields: boolean;
  localImageCount: number;
}

interface ImportTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, tableName: string) => Promise<void>;
}

export function ImportTableDialog({
  open,
  onOpenChange,
  onImport,
}: ImportTableDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [tableName, setTableName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setTableName('');
    setErrors([]);
    setWarnings([]);
    setIsValidating(false);
    setIsImporting(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const validateFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsValidating(true);
    setErrors([]);
    setWarnings([]);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/tables/import', {
        method: 'PUT', // PUT is for preview/validation
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.preview) {
        setPreview(result.preview);
        setTableName(result.preview.tableName);
        setWarnings(result.warnings || []);
      } else {
        setErrors(result.errors || [result.error || 'Invalid file format']);
      }
    } catch (error) {
      setErrors(['Failed to validate file']);
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.json') || droppedFile.name.endsWith('.ndjson'))) {
      validateFile(droppedFile);
    } else {
      setErrors(['Please drop a .json or .ndjson file']);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleImport = async () => {
    if (!file || !tableName.trim()) return;

    setIsImporting(true);
    try {
      await onImport(file, tableName.trim());
      handleOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      setErrors(['Failed to import table']);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-muted-foreground" />
            Import Table
          </DialogTitle>
          <DialogDescription>
            Import a table from a JSON export file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          {!preview && !isValidating && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileJson className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Drop a JSON file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground/70">
                Supports .json and .ndjson formats
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.ndjson"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Validating State */}
          {isValidating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Validating file...</span>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Validation Failed</p>
                  <ul className="mt-1 text-sm text-destructive/80 list-disc list-inside">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={resetState}
                  >
                    Try another file
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !errors.length && (
            <div className="space-y-4">
              {/* Success indicator */}
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>Valid export file</span>
              </div>

              {/* File info */}
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fields</span>
                  <span className="font-medium">{preview.fieldCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rows</span>
                  <span className="font-medium">{preview.rowCount.toLocaleString()}</span>
                </div>
                {preview.hasImageFields && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Image Fields</span>
                    <span className="font-medium">Yes</span>
                  </div>
                )}
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <ul className="text-sm text-yellow-500/90 list-disc list-inside">
                      {warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Table name input */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table Name
                </Label>
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="bg-secondary"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || !tableName.trim() || isImporting || errors.length > 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Table'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

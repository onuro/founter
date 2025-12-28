'use client';

import { useState, useEffect } from 'react';
import { ArrowDownToDot, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { SaveProgress } from '@/hooks/useImageFetcherSaved';

interface SaveFetchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageCount: number;
  url: string;
  onSave: (label: string) => Promise<void>;
  saveProgress?: SaveProgress | null;
}

export function SaveFetchDialog({
  open,
  onOpenChange,
  imageCount,
  url,
  onSave,
  saveProgress,
}: SaveFetchDialogProps) {
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if download is in progress
  const isDownloading = saveProgress?.status === 'downloading';
  const isComplete = saveProgress?.status === 'complete';
  const isFailed = saveProgress?.status === 'failed';

  // Calculate progress percentage
  const progressPercent = saveProgress
    ? Math.round(((saveProgress.downloadedCount + saveProgress.failedCount) / saveProgress.imageCount) * 100)
    : 0;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLabel('');
      setError(null);
    }
  }, [open]);

  // Auto-close after completion
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onOpenChange]);

  const handleSave = async () => {
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(label.trim());
      // Don't close dialog - it will close automatically when download completes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDownloading) {
      e.preventDefault();
      handleSave();
    }
  };

  // Prevent closing during download
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDownloading) {
      return; // Don't allow closing during download
    }
    onOpenChange(newOpen);
  };

  // Extract hostname for display
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : isFailed ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : (
              <ArrowDownToDot className="w-5 h-5 text-muted-foreground" />
            )}
            {isComplete ? 'Save Complete' : isFailed ? 'Save Failed' : 'Save Images'}
          </DialogTitle>
          <DialogDescription>
            {isDownloading
              ? `Downloading images from ${hostname}...`
              : isComplete
                ? `Successfully saved ${saveProgress?.downloadedCount} images`
                : isFailed
                  ? 'Download failed. Please try again.'
                  : `Save ${imageCount} images from ${hostname}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress UI - shown during/after download */}
        {saveProgress && (
          <div className="space-y-3 py-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {saveProgress.downloadedCount} / {saveProgress.imageCount} images
              </span>
              {saveProgress.failedCount > 0 && (
                <span className="text-yellow-600">
                  {saveProgress.failedCount} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Label input - hidden during download */}
        {!saveProgress && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Label
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Apple Products Q4 2024"
                className="bg-secondary"
                autoFocus
                disabled={isSaving}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {isComplete ? (
            <Button onClick={() => onOpenChange(false)} className="cursor-pointer">
              Done
            </Button>
          ) : isFailed ? (
            <Button onClick={() => onOpenChange(false)} className="cursor-pointer">
              Close
            </Button>
          ) : isDownloading ? (
            <Button disabled className="cursor-not-allowed">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Downloading...
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!label.trim() || isSaving}
                className="cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

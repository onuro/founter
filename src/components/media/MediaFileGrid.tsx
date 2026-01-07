'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { ImageIcon, LayoutGrid, Trash2, Pencil, Tag, Copy, Check, ExternalLink, Download, FolderInput, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  COLUMN_OPTIONS,
  GAP_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  DEFAULT_COLUMNS,
  DEFAULT_GAP,
  DEFAULT_ASPECT_RATIO,
  type AspectRatioValue,
} from '@/lib/grid-options';
import type { MediaFile, MediaTag as MediaTagType, MediaFolder } from '@/types/media';

interface MediaFileGridProps {
  files: MediaFile[];
  folders?: MediaFolder[];
  tags?: MediaTagType[];
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onSelect?: (file: MediaFile) => void;
  onMoveToFolder?: (fileId: string, folderId: string | null) => void;
  onAddTag?: (fileId: string, tagId: string) => void;
  onRemoveTag?: (fileId: string, tagId: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  selectionMode?: boolean;
  onSelectionModeChange?: (mode: boolean) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function MediaFileGrid({
  files,
  folders = [],
  tags = [],
  onDelete,
  onRename,
  onSelect,
  onMoveToFolder,
  onAddTag,
  onRemoveTag,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  selectionMode = false,
  onSelectionModeChange,
}: MediaFileGridProps) {
  const [columns, setColumns] = useState<number>(DEFAULT_COLUMNS);
  const [gap, setGap] = useState<string>(DEFAULT_GAP);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioValue>(DEFAULT_ASPECT_RATIO);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    selectedImage,
    isOpen,
    openLightbox,
    setOpen,
    images: lightboxImages,
    currentIndex,
    navigateTo,
  } = useLightbox();

  // Convert files to LightboxImage format
  const allLightboxImages = useMemo(
    () => files.map(file => ({ src: file.path, alt: file.originalFilename })),
    [files]
  );

  const handleImageError = useCallback((path: string) => {
    setFailedImages(prev => new Set(prev).add(path));
  }, []);

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim() && onRename) {
      onRename(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleCopyUrl = useCallback(async (file: MediaFile) => {
    const fullUrl = `${window.location.origin}${file.path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleDownload = useCallback((file: MediaFile) => {
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleOpenInNewTab = useCallback((file: MediaFile) => {
    window.open(file.path, '_blank');
  }, []);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">No files yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload images to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {files.length} file{files.length !== 1 ? 's' : ''}
              {selectionMode && selectedIds && selectedIds.size > 0 && (
                <span className="text-primary">
                  ({selectedIds.size} selected)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Selection mode toggle */}
              {onSelectionModeChange && (
                <Button
                  variant={selectionMode ? 'default' : 'outline'}
                  size="sm"
                  className="cursor-pointer gap-2"
                  onClick={() => {
                    onSelectionModeChange(!selectionMode);
                    if (selectionMode && onDeselectAll) {
                      onDeselectAll();
                    }
                  }}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectionMode ? 'bg-primary-foreground border-primary-foreground' : 'border-current'}`}>
                    {selectionMode && <Check className="w-3 h-3 text-primary" />}
                  </div>
                  <span className="hidden sm:inline">Select</span>
                </Button>
              )}
              {/* Select all / Deselect all */}
              {selectionMode && selectedIds && (
                <>
                  {selectedIds.size < files.length && onSelectAll && (
                    <Button variant="outline" size="sm" onClick={onSelectAll}>
                      Select All
                    </Button>
                  )}
                  {selectedIds.size > 0 && onDeselectAll && (
                    <Button variant="outline" size="sm" onClick={onDeselectAll}>
                      Deselect
                    </Button>
                  )}
                </>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="cursor-pointer gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Grid Options</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Columns</h4>
                      <div className="flex flex-wrap gap-1">
                        {COLUMN_OPTIONS.map((col) => (
                          <Button
                            key={col}
                            variant={columns === col ? 'default' : 'outline'}
                            size="sm"
                            className="w-9 h-8 cursor-pointer"
                            onClick={() => setColumns(col)}
                          >
                            {col}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Gap</h4>
                      <div className="flex flex-wrap gap-1">
                        {GAP_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant={gap === option.value ? 'default' : 'outline'}
                            size="sm"
                            className="w-9 h-8 cursor-pointer"
                            onClick={() => setGap(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Aspect Ratio</h4>
                      <div className="grid grid-cols-3 gap-1">
                        {ASPECT_RATIO_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant={aspectRatio === option.value ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 text-xs cursor-pointer"
                            onClick={() => setAspectRatio(option.value)}
                            title={option.description}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid auto-rows-fr"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}
          >
            {files.map((file, index) => {
              const isFailed = failedImages.has(file.path);
              const isSelected = selectedIds?.has(file.id);
              const isRenaming = renamingId === file.id;
              const isCopied = copiedId === file.id;

              return (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger asChild disabled={selectionMode}>
                    <div className="bg-secondary p-1 rounded-lg">
                      <div
                        className="group relative overflow-hidden rounded-sm"
                        style={{ aspectRatio }}
                      >
                        {/* Thumbnail */}
                        <button
                          onClick={() => {
                            if (selectionMode && onToggleSelect) {
                              onToggleSelect(file.id);
                            } else {
                              openLightbox(
                                { src: file.path, alt: file.originalFilename },
                                allLightboxImages,
                                index
                              );
                            }
                          }}
                          className="w-full h-full cursor-pointer"
                        >
                        {isFailed ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-neutral-900">
                            <ImageIcon className="w-8 h-8 opacity-50" />
                          </div>
                        ) : (
                          <Image
                            src={file.path}
                            alt={file.alt || file.originalFilename}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover object-top transition-transform group-hover:scale-105 ease-out duration-500"
                            onError={() => handleImageError(file.path)}
                          />
                        )}
                      </button>

                      {/* Selection checkbox */}
                      {selectionMode && (
                        <div
                          className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-white/50 bg-black/30 hover:border-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleSelect) onToggleSelect(file.id);
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      )}

                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              {isRenaming ? (
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onBlur={() => handleRenameSubmit(file.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit(file.id);
                                    if (e.key === 'Escape') {
                                      setRenamingId(null);
                                      setRenameValue('');
                                    }
                                  }}
                                  className="w-full bg-black/50 border border-white/30 rounded px-2 py-0.5 text-xs text-white pointer-events-auto"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <p className="text-xs text-white truncate">{file.originalFilename}</p>
                              )}
                              <p className="text-[10px] text-white/70">{formatSize(file.size)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {file.tags.length > 0 && (
                          <div className="absolute top-2 right-2 flex gap-1 flex-wrap max-w-[80%] justify-end">
                            {file.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 bg-black/50 text-white border-0"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {file.tags.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 bg-black/50 text-white border-0"
                              >
                                +{file.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ContextMenuTrigger>

                  {/* Context Menu */}
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={() => openLightbox(
                        { src: file.path, alt: file.originalFilename },
                        allLightboxImages,
                        index
                      )}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleOpenInNewTab(file)}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleCopyUrl(file)}>
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </>
                      )}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDownload(file)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => {
                        setRenamingId(file.id);
                        setRenameValue(file.originalFilename);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </ContextMenuItem>

                    {/* Tags submenu */}
                    {tags.length > 0 && onAddTag && (
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <Tag className="w-4 h-4 mr-2" />
                          Tags
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-40">
                          {tags.map((tag) => {
                            const hasTag = file.tags.some(t => t.id === tag.id);
                            return (
                              <ContextMenuItem
                                key={tag.id}
                                onClick={() => {
                                  if (hasTag && onRemoveTag) {
                                    onRemoveTag(file.id, tag.id);
                                  } else if (onAddTag) {
                                    onAddTag(file.id, tag.id);
                                  }
                                }}
                              >
                                <div className={`w-3 h-3 rounded-full mr-2 bg-${tag.color}-500`} />
                                <span className="flex-1">{tag.name}</span>
                                {hasTag && <Check className="w-4 h-4 ml-2" />}
                              </ContextMenuItem>
                            );
                          })}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )}

                    {/* Move to folder submenu */}
                    {folders.length > 0 && onMoveToFolder && (
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <FolderInput className="w-4 h-4 mr-2" />
                          Move to Folder
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-40">
                          <ContextMenuItem
                            onClick={() => onMoveToFolder(file.id, null)}
                          >
                            <span className="text-muted-foreground">Root (no folder)</span>
                            {!file.folderId && <Check className="w-4 h-4 ml-2" />}
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          {folders.map((folder) => (
                            <ContextMenuItem
                              key={folder.id}
                              onClick={() => onMoveToFolder(file.id, folder.id)}
                            >
                              {folder.name}
                              {file.folderId === folder.id && <Check className="w-4 h-4 ml-2" />}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )}

                    <ContextMenuSeparator />
                    {onDelete && (
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => onDelete(file.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Lightbox
        image={selectedImage}
        open={isOpen}
        onOpenChange={setOpen}
        images={lightboxImages}
        currentIndex={currentIndex}
        onNavigate={navigateTo}
      />
    </>
  );
}

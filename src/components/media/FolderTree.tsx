'use client';

import { useState, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MediaFolderTree } from '@/types/media';

interface FolderTreeProps {
  folders: MediaFolderTree[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: () => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

interface FolderNodeProps {
  folder: MediaFolderTree;
  depth: number;
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectFolder: (id: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
}

function FolderNode({
  folder,
  depth,
  selectedFolderId,
  expandedIds,
  onToggleExpand,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
}: FolderNodeProps) {
  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedIds.has(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;
  const isRenaming = renamingId === folder.id;

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRenameFolder(folder.id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-sm cursor-pointer transition-colors group',
          isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-secondary',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        {/* Expand/Collapse button */}
        <button
          className={cn(
            'p-0.5 rounded-sm hover:bg-white/10 transition-transform',
            !hasChildren && 'opacity-0 pointer-events-none',
            isExpanded && 'rotate-90',
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(folder.id);
          }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0" />
        )}

        {/* Folder name */}
        {isRenaming ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setRenamingId(null);
                setRenameValue('');
              }
            }}
            className="h-6 py-0 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">
            {folder.name}
          </span>
        )}

        {/* File count */}
        <span className="text-xs text-muted-foreground mr-1">
          {folder.fileCount}
        </span>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-sm">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setRenamingId(folder.id);
                setRenameValue(folder.name);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="w-6 h-6"
          onClick={onCreateFolder}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* All files option */}
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-sm cursor-pointer transition-colors',
          selectedFolderId === null ? 'bg-primary/20 text-primary' : 'hover:bg-secondary',
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="text-sm">All Files</span>
      </div>

      {/* Folder tree */}
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          selectedFolderId={selectedFolderId}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onSelectFolder={onSelectFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
        />
      ))}

      {/* Empty state */}
      {folders.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No folders yet
        </p>
      )}
    </div>
  );
}

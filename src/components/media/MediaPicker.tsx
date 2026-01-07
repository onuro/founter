'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, FolderOpen, ImageIcon, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MediaProject, MediaFile, MediaFolderTree } from '@/types/media';

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFile) => void;
}

export function MediaPicker({ open, onOpenChange, onSelect }: MediaPickerProps) {
  const [projects, setProjects] = useState<MediaProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [folders, setFolders] = useState<MediaFolderTree[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects
  useEffect(() => {
    if (!open) return;
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/media/projects');
        const result = await response.json();
        if (result.success) {
          setProjects(result.data);
          if (result.data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(result.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, [open, selectedProjectId]);

  // Fetch folders when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setFolders([]);
      return;
    }
    const fetchFolders = async () => {
      try {
        const response = await fetch(`/api/media/projects/${selectedProjectId}/folders`);
        const result = await response.json();
        if (result.success) {
          setFolders(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };
    fetchFolders();
    setSelectedFolderId(null);
  }, [selectedProjectId]);

  // Fetch files
  useEffect(() => {
    if (!selectedProjectId) {
      setFiles([]);
      return;
    }
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (selectedFolderId) {
          params.set('folderId', selectedFolderId);
        }
        const response = await fetch(`/api/media/projects/${selectedProjectId}/files?${params}`);
        const result = await response.json();
        if (result.success) {
          setFiles(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, [selectedProjectId, selectedFolderId]);

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file =>
      file.originalFilename.toLowerCase().includes(query) ||
      file.alt?.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // Flatten folders for display
  const flatFolders = useMemo(() => {
    const result: Array<{ id: string; name: string; depth: number }> = [];
    const flatten = (items: MediaFolderTree[], depth = 0) => {
      for (const item of items) {
        result.push({ id: item.id, name: item.name, depth });
        if (item.children?.length) {
          flatten(item.children, depth + 1);
        }
      }
    };
    flatten(folders);
    return result;
  }, [folders]);

  const handleSelect = useCallback((file: MediaFile) => {
    onSelect(file);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Select from Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-52 border-r border-border flex flex-col overflow-hidden">
            {/* Projects */}
            <div className="p-2 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                Projects
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {projects.map(project => (
                  <button
                    key={project.id}
                    className={cn(
                      'w-full text-left px-2 py-1.5 rounded-sm text-sm transition-colors cursor-pointer',
                      selectedProjectId === project.id
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-secondary'
                    )}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    {project.icon && <span className="mr-2">{project.icon}</span>}
                    {project.name}
                  </button>
                ))}
              </div>

              {/* Folders */}
              {flatFolders.length > 0 && (
                <>
                  <div className="px-2 pt-4 pb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Folders
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-sm text-sm transition-colors flex items-center gap-2 cursor-pointer',
                        selectedFolderId === null
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-secondary'
                      )}
                      onClick={() => setSelectedFolderId(null)}
                    >
                      <FolderOpen className="w-4 h-4" />
                      All Files
                    </button>
                    {flatFolders.map(folder => (
                      <button
                        key={folder.id}
                        className={cn(
                          'w-full text-left py-1.5 rounded-sm text-sm transition-colors flex items-center gap-2 cursor-pointer',
                          selectedFolderId === folder.id
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-secondary'
                        )}
                        style={{ paddingLeft: `${8 + folder.depth * 16}px` }}
                        onClick={() => setSelectedFolderId(folder.id)}
                      >
                        <FolderOpen className="w-4 h-4" />
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </ScrollArea>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Files grid */}
            <ScrollArea className="flex-1 p-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p>No files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {filteredFiles.map(file => (
                    <button
                      key={file.id}
                      className="relative aspect-square bg-secondary rounded-md overflow-hidden group cursor-pointer"
                      onClick={() => handleSelect(file)}
                    >
                      <Image
                        src={file.path}
                        alt={file.alt || file.originalFilename}
                        fill
                        sizes="150px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{file.originalFilename}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

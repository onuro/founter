'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Upload, Tag as TagIcon } from 'lucide-react';
import { useMediaProjects } from '@/hooks/useMediaProjects';
import { useMediaFiles } from '@/hooks/useMediaFiles';
import { useMediaFolders } from '@/hooks/useMediaFolders';
import { useMediaTags } from '@/hooks/useMediaTags';
import { ProjectsSidebar } from './ProjectsSidebar';
import { CreateProjectDialog } from './CreateProjectDialog';
import { CreateFolderDialog } from './CreateFolderDialog';
import { TagManagerDialog } from './TagManagerDialog';
import { MediaFileGrid } from './MediaFileGrid';
import { FolderTree } from './FolderTree';
import { BulkActionsBar } from './BulkActionsBar';
import { DeleteMediaConfirmDialog } from './DeleteMediaConfirmDialog';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { Button } from '@/components/ui/button';
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
import type { MediaFolder } from '@/types/media';

interface UsageInfo {
  count: number;
  tables: { id: string; name: string; rowCount: number }[];
}

export function MediaManagerLayout() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Selection mode for bulk operations
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Delete confirmation state (single file and bulk)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<UsageInfo | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const {
    projects,
    isLoading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
  } = useMediaProjects();

  const {
    files,
    isLoading: filesLoading,
    uploadFiles,
    updateFile,
    refreshFiles,
  } = useMediaFiles({
    projectId: selectedProjectId,
    folderId: selectedFolderId,
  });

  const {
    folders,
    isLoading: foldersLoading,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useMediaFolders();

  const {
    tags,
    createTag,
    updateTag,
    deleteTag,
    addTagsToFiles,
    removeTagsFromFiles,
  } = useMediaTags();

  // Flatten folder tree for context menu
  const flatFolders = useMemo(() => {
    const result: MediaFolder[] = [];
    const flatten = (items: typeof folders) => {
      for (const item of items) {
        result.push({
          id: item.id,
          projectId: item.projectId,
          parentId: item.parentId,
          name: item.name,
          order: item.order,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
        if (item.children?.length) {
          flatten(item.children);
        }
      }
    };
    flatten(folders);
    return result;
  }, [folders]);

  // Auto-select first project
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0 && !projectsLoading) {
      setSelectedProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects, projectsLoading]);

  // Fetch folders when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchFolders(selectedProjectId);
      setSelectedFolderId(null);
    }
  }, [selectedProjectId, fetchFolders]);

  // Handle project selection
  const handleSelectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    setSelectionMode(false);
    setSelectedFileIds(new Set());
  }, []);

  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    const project = await createProject({ name, description });
    setSelectedProjectId(project.id);
    toast.success('Project created');
  }, [createProject]);

  const handleRenameProject = useCallback(async (id: string, name: string) => {
    try {
      await updateProject(id, { name });
      toast.success('Project renamed');
    } catch {
      toast.error('Failed to rename project');
    }
  }, [updateProject]);

  const handleDeleteProject = useCallback(async () => {
    if (!deleteProjectId) return;
    try {
      await deleteProject(deleteProjectId);
      if (selectedProjectId === deleteProjectId) {
        setSelectedProjectId(projects.find(p => p.id !== deleteProjectId)?.id || null);
      }
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleteProjectId(null);
    }
  }, [deleteProjectId, deleteProject, selectedProjectId, projects]);

  // Folder handlers
  const handleCreateFolder = useCallback(async (name: string) => {
    if (!selectedProjectId) return;
    const folder = await createFolder(selectedProjectId, { name, parentId: selectedFolderId });
    if (folder) {
      toast.success('Folder created');
    }
  }, [selectedProjectId, selectedFolderId, createFolder]);

  const handleRenameFolder = useCallback(async (id: string, name: string) => {
    if (!selectedProjectId) return;
    const folder = await updateFolder(selectedProjectId, id, { name });
    if (folder) {
      toast.success('Folder renamed');
    }
  }, [selectedProjectId, updateFolder]);

  const handleDeleteFolder = useCallback(async () => {
    if (!deleteFolderId || !selectedProjectId) return;
    const success = await deleteFolder(selectedProjectId, deleteFolderId);
    if (success) {
      if (selectedFolderId === deleteFolderId) {
        setSelectedFolderId(null);
      }
      toast.success('Folder deleted');
    }
    setDeleteFolderId(null);
  }, [deleteFolderId, selectedProjectId, selectedFolderId, deleteFolder]);

  // File handlers
  const handleUpload = useCallback(async (fileList: FileList) => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFiles(fileList, selectedFolderId);
      if (result.errors?.length) {
        result.errors.forEach(err => toast.error(err));
      }
      if (result.files.length > 0) {
        toast.success(`Uploaded ${result.files.length} file${result.files.length > 1 ? 's' : ''}`);
      }
    } catch {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  }, [selectedProjectId, selectedFolderId, uploadFiles]);

  const handleRenameFile = useCallback(async (id: string, name: string) => {
    try {
      await updateFile(id, { originalFilename: name });
      toast.success('File renamed');
    } catch {
      toast.error('Failed to rename file');
    }
  }, [updateFile]);

  const handleDeleteFile = useCallback(async (id: string) => {
    // Check usage first
    setDeleteFileId(id);
    setIsBulkDelete(false);
    setIsCheckingUsage(true);
    setDeleteConfirmOpen(true);

    try {
      const response = await fetch(`/api/media/files/${id}?checkUsage=true`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setDeleteUsage(result.usage);
      } else {
        toast.error(result.error || 'Failed to check file usage');
        setDeleteConfirmOpen(false);
      }
    } catch {
      toast.error('Failed to check file usage');
      setDeleteConfirmOpen(false);
    } finally {
      setIsCheckingUsage(false);
    }
  }, []);

  const handleMoveToFolder = useCallback(async (fileId: string, folderId: string | null) => {
    try {
      await updateFile(fileId, { folderId });
      toast.success('File moved');
    } catch {
      toast.error('Failed to move file');
    }
  }, [updateFile]);

  const handleAddTag = useCallback(async (fileId: string, tagId: string) => {
    const success = await addTagsToFiles([fileId], [tagId]);
    if (success) {
      await refreshFiles();
      toast.success('Tag added');
    }
  }, [addTagsToFiles, refreshFiles]);

  const handleRemoveTag = useCallback(async (fileId: string, tagId: string) => {
    const success = await removeTagsFromFiles([fileId], [tagId]);
    if (success) {
      await refreshFiles();
      toast.success('Tag removed');
    }
  }, [removeTagsFromFiles, refreshFiles]);

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFileIds(new Set(files.map(f => f.id)));
  }, [files]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  // Bulk operation handlers
  const handleBulkDeleteStart = useCallback(async () => {
    // Check usage first
    setIsBulkDelete(true);
    setDeleteFileId(null);
    setIsCheckingUsage(true);
    setDeleteConfirmOpen(true);

    try {
      const response = await fetch('/api/media/files/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          fileIds: Array.from(selectedFileIds),
          checkUsage: true,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setDeleteUsage(result.data.totals);
      } else {
        toast.error(result.error || 'Failed to check file usage');
        setDeleteConfirmOpen(false);
      }
    } catch {
      toast.error('Failed to check file usage');
      setDeleteConfirmOpen(false);
    } finally {
      setIsCheckingUsage(false);
    }
  }, [selectedFileIds]);

  // Confirm delete handlers
  const handleConfirmDelete = useCallback(async (cascade: boolean) => {
    try {
      if (isBulkDelete) {
        // Bulk delete
        const response = await fetch('/api/media/files/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            fileIds: Array.from(selectedFileIds),
            cascadeNullify: cascade,
          }),
        });
        const result = await response.json();
        if (result.success) {
          const clearedMsg = cascade && result.clearedReferences > 0
            ? ` (cleared ${result.clearedReferences} table reference${result.clearedReferences !== 1 ? 's' : ''})`
            : '';
          toast.success(`Deleted ${result.deletedCount} file${result.deletedCount !== 1 ? 's' : ''}${clearedMsg}`);
          setSelectedFileIds(new Set());
          setSelectionMode(false);
          await refreshFiles();
        } else {
          toast.error(result.error || 'Failed to delete files');
        }
      } else if (deleteFileId) {
        // Single file delete
        const url = cascade
          ? `/api/media/files/${deleteFileId}?cascadeNullify=true`
          : `/api/media/files/${deleteFileId}`;
        const response = await fetch(url, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          const clearedMsg = cascade && result.clearedReferences > 0
            ? ` (cleared ${result.clearedReferences} table reference${result.clearedReferences !== 1 ? 's' : ''})`
            : '';
          toast.success(`File deleted${clearedMsg}`);
          await refreshFiles();
        } else {
          toast.error(result.error || 'Failed to delete file');
        }
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteFileId(null);
      setDeleteUsage(null);
    }
  }, [isBulkDelete, selectedFileIds, deleteFileId, refreshFiles]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setDeleteFileId(null);
    setDeleteUsage(null);
  }, []);

  const handleBulkMoveToFolder = useCallback(async (folderId: string | null) => {
    try {
      const response = await fetch('/api/media/files/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          fileIds: Array.from(selectedFileIds),
          folderId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Moved ${result.movedCount} file${result.movedCount !== 1 ? 's' : ''}`);
        setSelectedFileIds(new Set());
        setSelectionMode(false);
        await refreshFiles();
      } else {
        toast.error(result.error || 'Failed to move files');
      }
    } catch {
      toast.error('Failed to move files');
    }
  }, [selectedFileIds, refreshFiles]);

  const handleBulkAddTags = useCallback(async (tagIds: string[]) => {
    const success = await addTagsToFiles(Array.from(selectedFileIds), tagIds);
    if (success) {
      toast.success('Tags added');
      await refreshFiles();
    }
  }, [selectedFileIds, addTagsToFiles, refreshFiles]);

  const handleBulkMoveToProject = useCallback(async (projectId: string) => {
    try {
      const response = await fetch('/api/media/files/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move-project',
          fileIds: Array.from(selectedFileIds),
          projectId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Moved ${result.movedCount} file${result.movedCount !== 1 ? 's' : ''} to project`);
        setSelectedFileIds(new Set());
        setSelectionMode(false);
        await refreshFiles();
      } else {
        toast.error(result.error || 'Failed to move files');
      }
    } catch {
      toast.error('Failed to move files');
    }
  }, [selectedFileIds, refreshFiles]);

  // Tag management handlers
  const handleCreateTag = useCallback(async (name: string, color: string) => {
    const tag = await createTag({ name, color });
    if (tag) {
      toast.success('Tag created');
    }
  }, [createTag]);

  const handleUpdateTag = useCallback(async (id: string, name: string, color: string) => {
    const tag = await updateTag(id, { name, color });
    if (tag) {
      toast.success('Tag updated');
    }
  }, [updateTag]);

  const handleDeleteTag = useCallback(async (id: string) => {
    const success = await deleteTag(id);
    if (success) {
      toast.success('Tag deleted');
    }
  }, [deleteTag]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="grid grid-cols-[260px_1fr] h-[calc(100vh-5.8rem)] rounded-lg overflow-clip overflow-y-auto">
      {/* Projects Sidebar */}
      <div className="flex flex-col border-r border-border overflow-hidden">
        <ProjectsSidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setCreateProjectDialogOpen(true)}
          onDeleteProject={setDeleteProjectId}
          onRenameProject={handleRenameProject}
          onReorderProjects={reorderProjects}
          isLoading={projectsLoading}
        />

        {/* Folders section */}
        {selectedProjectId && (
          <div className="border-t border-border flex-1 overflow-y-auto">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={() => setCreateFolderDialogOpen(true)}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={setDeleteFolderId}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col overflow-hidden">
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setTagManagerOpen(true)}
              >
                <TagIcon className="w-4 h-4" />
                Manage Tags
              </Button>
            </div>

            {/* Upload Zone */}
            <FileDropzone
              onFilesSelected={handleUpload}
              accept="image/*"
              multiple
              isLoading={isUploading}
              icon={<Upload className="h-5 w-5 text-primary" />}
              title="Drop, paste, or click to upload"
              description="PNG, JPG, WebP, GIF up to 50MB each"
              loadingText="Uploading..."
            />

            {/* Files Grid */}
            {filesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MediaFileGrid
                files={files}
                folders={flatFolders}
                tags={tags}
                onDelete={handleDeleteFile}
                onRename={handleRenameFile}
                onMoveToFolder={handleMoveToFolder}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                selectedIds={selectedFileIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                selectionMode={selectionMode}
                onSelectionModeChange={setSelectionMode}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                {projectsLoading ? 'Loading...' : 'Select or create a project to get started'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedProjectId && (
        <BulkActionsBar
          selectedCount={selectedFileIds.size}
          onCancel={() => {
            setSelectionMode(false);
            setSelectedFileIds(new Set());
          }}
          onDelete={handleBulkDeleteStart}
          folders={flatFolders}
          tags={tags}
          projects={projects}
          currentProjectId={selectedProjectId}
          onMoveToFolder={handleBulkMoveToFolder}
          onAddTags={handleBulkAddTags}
          onMoveToProject={handleBulkMoveToProject}
        />
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        onCreate={handleCreateProject}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        onCreate={handleCreateFolder}
      />

      {/* Tag Manager Dialog */}
      <TagManagerDialog
        open={tagManagerOpen}
        onOpenChange={setTagManagerOpen}
        tags={tags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />

      {/* Delete Project Confirmation */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={() => setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder. Files in this folder will be moved to the root.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog (single file or bulk) */}
      <DeleteMediaConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        fileCount={isBulkDelete ? selectedFileIds.size : 1}
        usage={deleteUsage}
        isLoading={isCheckingUsage}
        onCancel={handleCancelDelete}
        onDeleteWithCascade={() => handleConfirmDelete(true)}
        onDeleteWithoutCascade={() => handleConfirmDelete(false)}
      />
    </div>
  );
}

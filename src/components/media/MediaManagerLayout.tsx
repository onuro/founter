'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { useMediaProjects } from '@/hooks/useMediaProjects';
import { useMediaFiles } from '@/hooks/useMediaFiles';
import { ProjectsSidebar } from './ProjectsSidebar';
import { CreateProjectDialog } from './CreateProjectDialog';
import { MediaFileGrid } from './MediaFileGrid';
import { FileDropzone } from '@/components/ui/file-dropzone';
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

export function MediaManagerLayout() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    deleteFile,
  } = useMediaFiles({
    projectId: selectedProjectId,
  });

  // Auto-select first project
  if (!selectedProjectId && projects.length > 0 && !projectsLoading) {
    setSelectedProjectId(projects[0].id);
  }

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

  const handleUpload = useCallback(async (fileList: FileList) => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFiles(fileList);
      if (result.errors?.length) {
        result.errors.forEach(err => toast.error(err));
      }
      if (result.files.length > 0) {
        toast.success(`Uploaded ${result.files.length} file${result.files.length > 1 ? 's' : ''}`);
      }
    } catch (err) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  }, [selectedProjectId, uploadFiles]);

  const handleRenameFile = useCallback(async (id: string, name: string) => {
    try {
      await updateFile(id, { originalFilename: name });
      toast.success('File renamed');
    } catch {
      toast.error('Failed to rename file');
    }
  }, [updateFile]);

  const handleDeleteFile = useCallback(async (id: string) => {
    try {
      await deleteFile(id);
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  }, [deleteFile]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="grid grid-cols-[260px_1fr] h-[calc(100vh-5.8rem)]">
      {/* Projects Sidebar */}
      <ProjectsSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={() => setCreateDialogOpen(true)}
        onDeleteProject={setDeleteProjectId}
        onRenameProject={handleRenameProject}
        onReorderProjects={reorderProjects}
        isLoading={projectsLoading}
      />

      {/* Main Content */}
      <div className="flex flex-col overflow-hidden">
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Upload Zone */}
            <FileDropzone
              onFilesSelected={handleUpload}
              accept="image/*"
              multiple
              isLoading={isUploading}
              icon={<Upload className="h-5 w-5 text-primary" />}
              title="Drop images or click to upload"
              description="PNG, JPG, WebP, GIF up to 10MB each"
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
                onDelete={handleDeleteFile}
                onRename={handleRenameFile}
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

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateProject}
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
    </div>
  );
}

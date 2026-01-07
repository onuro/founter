'use client';

import { X, Trash2, FolderInput, Tag, MoveHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MediaFolder, MediaTagWithCount, MediaProject } from '@/types/media';

interface BulkActionsBarProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  folders: MediaFolder[];
  tags: MediaTagWithCount[];
  projects: MediaProject[];
  currentProjectId: string;
  onMoveToFolder: (folderId: string | null) => void;
  onAddTags: (tagIds: string[]) => void;
  onMoveToProject: (projectId: string) => void;
}

export function BulkActionsBar({
  selectedCount,
  onCancel,
  onDelete,
  folders,
  tags,
  projects,
  currentProjectId,
  onMoveToFolder,
  onAddTags,
  onMoveToProject,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const otherProjects = projects.filter(p => p.id !== currentProjectId);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-neutral-900 border border-border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <Button
            variant="ghost"
            size="icon-sm"
            className="w-6 h-6"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
        </div>

        {/* Move to folder */}
        {folders.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderInput className="w-4 h-4" />
                Move to Folder
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
                Root (no folder)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onMoveToFolder(folder.id)}
                >
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Add tags */}
        {tags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="w-4 h-4" />
                Add Tags
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {tags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => onAddTags([tag.id])}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor: tag.color.startsWith('#')
                        ? tag.color
                        : `var(--${tag.color}-500, ${tag.color})`,
                    }}
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Move to project */}
        {otherProjects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoveHorizontal className="w-4 h-4" />
                Move to Project
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {otherProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onMoveToProject(project.id)}
                >
                  {project.icon && <span className="mr-2">{project.icon}</span>}
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

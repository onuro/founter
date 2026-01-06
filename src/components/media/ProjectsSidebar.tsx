'use client';

import { useState } from 'react';
import { Plus, FolderOpen, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MediaProjectSummary } from '@/types/media';

interface ProjectsSidebarProps {
  projects: MediaProjectSummary[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onReorderProjects: (orderedIds: string[]) => void;
  isLoading?: boolean;
}

interface SortableProjectItemProps {
  project: MediaProjectSummary;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function SortableProjectItem({
  project,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: SortableProjectItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRename = () => {
    if (newName.trim() && newName !== project.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-sm transition-colors cursor-pointer',
        isSelected ? 'bg-neutral-800/50' : 'hover:bg-neutral-900',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <button
        className="shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Project icon & name */}
      <div className="flex-1 flex items-center gap-2 min-w-0 text-left">
        <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-sm">{project.name}</span>
        )}
      </div>

      {/* File count & size */}
      <div className="text-xs text-muted-foreground shrink-0 flex flex-col items-end">
        <span>{project.fileCount}</span>
        {project.totalSize > 0 && (
          <span className="text-[10px]">{formatSize(project.totalSize)}</span>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ProjectsSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onReorderProjects,
  isLoading,
}: ProjectsSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      const newOrder = arrayMove(projects, oldIndex, newIndex);
      onReorderProjects(newOrder.map((p) => p.id));
    }
  };

  return (
    <div className="flex flex-col h-full sticky top-0 bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-r border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6"
          onClick={onCreateProject}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto p-2 border-r border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateProject}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create project
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {projects.map((project) => (
                  <SortableProjectItem
                    key={project.id}
                    project={project}
                    isSelected={selectedProjectId === project.id}
                    onSelect={() => onSelectProject(project.id)}
                    onDelete={() => onDeleteProject(project.id)}
                    onRename={(name) => onRenameProject(project.id, name)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

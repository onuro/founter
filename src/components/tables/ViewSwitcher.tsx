'use client';

import { useState } from 'react';
import {
  Check,
  ChevronDown,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  Star,
  Table2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TableView, ViewType } from '@/types/views';
import { VIEW_TYPE_CONFIG } from '@/types/views';

interface ViewSwitcherProps {
  views: TableView[];
  activeViewId: string | null;
  onViewChange: (viewId: string) => void;
  onCreateView: (name: string, type: ViewType) => Promise<void>;
  onRenameView: (viewId: string, name: string) => Promise<void>;
  onDeleteView: (viewId: string) => Promise<void>;
  onSetDefault: (viewId: string) => Promise<void>;
  onOpenSettings: (viewId: string) => void;
  disabled?: boolean;
}

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  grid: <Table2 className="w-4 h-4" />,
  card: <LayoutGrid className="w-4 h-4" />,
};

export function ViewSwitcher({
  views,
  activeViewId,
  onViewChange,
  onCreateView,
  onRenameView,
  onDeleteView,
  onSetDefault,
  onOpenSettings,
  disabled = false,
}: ViewSwitcherProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<TableView | null>(null);
  const [newViewName, setNewViewName] = useState('');
  const [newViewType, setNewViewType] = useState<ViewType>('grid');
  const [isLoading, setIsLoading] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId) || views[0];

  const handleCreateView = async () => {
    if (!newViewName.trim()) return;
    setIsLoading(true);
    try {
      await onCreateView(newViewName.trim(), newViewType);
      setIsCreateOpen(false);
      setNewViewName('');
      setNewViewType('grid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameView = async () => {
    if (!selectedView || !newViewName.trim()) return;
    setIsLoading(true);
    try {
      await onRenameView(selectedView.id, newViewName.trim());
      setIsRenameOpen(false);
      setSelectedView(null);
      setNewViewName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteView = async () => {
    if (!selectedView) return;
    setIsLoading(true);
    try {
      await onDeleteView(selectedView.id);
      setIsDeleteOpen(false);
      setSelectedView(null);
    } finally {
      setIsLoading(false);
    }
  };

  const openRenameDialog = (view: TableView) => {
    setSelectedView(view);
    setNewViewName(view.name);
    setIsRenameOpen(true);
  };

  const openDeleteDialog = (view: TableView) => {
    setSelectedView(view);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Main view switcher dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 gap-1.5 px-2 font-normal"
            >
              {activeView && VIEW_ICONS[activeView.type]}
              <span className="max-w-[120px] truncate">
                {activeView?.name || 'Select view'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {/* View list */}
            {views.map((view) => (
              <div key={view.id} className="flex items-center group">
                <DropdownMenuItem
                  onClick={() => onViewChange(view.id)}
                  className="flex-1 gap-2"
                >
                  {VIEW_ICONS[view.type]}
                  <span className="flex-1 truncate">{view.name}</span>
                  {view.isDefault && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  )}
                  {view.id === activeViewId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </DropdownMenuItem>

                {/* View actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => onOpenSettings(view.id)}
                      className="gap-2"
                    >
                      <Settings2 className="w-4 h-4" />
                      View settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openRenameDialog(view)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Rename
                    </DropdownMenuItem>
                    {!view.isDefault && (
                      <DropdownMenuItem
                        onClick={() => onSetDefault(view.id)}
                        className="gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Set as default
                      </DropdownMenuItem>
                    )}
                    {views.length > 1 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(view)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete view
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            <DropdownMenuSeparator />

            {/* Add new view */}
            <DropdownMenuItem
              onClick={() => setIsCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create view dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new view</DialogTitle>
            <DialogDescription>
              Add a new view to display your data differently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">View name</Label>
              <Input
                id="view-name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Enter view name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newViewName.trim()) {
                    handleCreateView();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>View type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(VIEW_TYPE_CONFIG) as [ViewType, typeof VIEW_TYPE_CONFIG['grid']][]).map(
                  ([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewViewType(type)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                        newViewType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {VIEW_ICONS[type]}
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {config.description}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateView}
              disabled={!newViewName.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create view'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename view dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-view">View name</Label>
            <Input
              id="rename-view"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Enter view name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newViewName.trim()) {
                  handleRenameView();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameView}
              disabled={!newViewName.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete view dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete view</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedView?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteView}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

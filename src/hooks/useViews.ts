'use client';

import { useState, useCallback } from 'react';
import type { TableView, ViewSettings, CreateViewInput, UpdateViewInput } from '@/types/views';

interface UseViewsOptions {
  onViewsChange?: (views: TableView[]) => void;
}

export function useViews(
  tableId: string | null,
  initialViews: TableView[] = [],
  options: UseViewsOptions = {}
) {
  const { onViewsChange } = options;
  const [views, setViews] = useState<TableView[]>(initialViews);
  const [activeViewId, setActiveViewId] = useState<string | null>(() => {
    const defaultView = initialViews.find((v) => v.isDefault);
    return defaultView?.id || initialViews[0]?.id || null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get active view
  const activeView = views.find((v) => v.id === activeViewId) || views[0] || null;

  // Update views and notify parent
  const updateViews = useCallback(
    (newViews: TableView[]) => {
      setViews(newViews);
      onViewsChange?.(newViews);
    },
    [onViewsChange]
  );

  // Set views from parent (when table data changes)
  const setViewsFromTable = useCallback(
    (newViews: TableView[]) => {
      setViews(newViews);
      // Auto-select default view if current selection is invalid
      const currentViewExists = newViews.some((v) => v.id === activeViewId);
      if (!currentViewExists && newViews.length > 0) {
        const defaultView = newViews.find((v) => v.isDefault);
        setActiveViewId(defaultView?.id || newViews[0]?.id || null);
      }
    },
    [activeViewId]
  );

  // Create a new view
  const createView = useCallback(
    async (input: CreateViewInput): Promise<TableView> => {
      if (!tableId) throw new Error('No table selected');
      setIsLoading(true);

      try {
        const res = await fetch(`/api/tables/${tableId}/views`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();

        if (data.success) {
          const newView = data.data as TableView;
          updateViews([...views, newView]);
          setActiveViewId(newView.id);
          return newView;
        }
        throw new Error(data.error || 'Failed to create view');
      } finally {
        setIsLoading(false);
      }
    },
    [tableId, views, updateViews]
  );

  // Update a view
  const updateView = useCallback(
    async (viewId: string, input: UpdateViewInput): Promise<TableView> => {
      if (!tableId) throw new Error('No table selected');

      // Optimistic update for settings changes
      if (input.settings) {
        setViews((prev) =>
          prev.map((v) =>
            v.id === viewId
              ? { ...v, settings: { ...v.settings, ...input.settings } }
              : v
          )
        );
      }

      try {
        const res = await fetch(`/api/tables/${tableId}/views/${viewId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();

        if (data.success) {
          const updatedView = data.data as TableView;
          // If this view is now default, unset other defaults in local state
          const newViews = views.map((v) => {
            if (v.id === viewId) return updatedView;
            if (input.isDefault && v.isDefault) return { ...v, isDefault: false };
            return v;
          });
          updateViews(newViews);
          return updatedView;
        }
        throw new Error(data.error || 'Failed to update view');
      } catch (error) {
        // Revert optimistic update on error
        setViews(views);
        throw error;
      }
    },
    [tableId, views, updateViews]
  );

  // Update view settings (convenience method)
  const updateViewSettings = useCallback(
    async (viewId: string, settings: Partial<ViewSettings>): Promise<TableView> => {
      return updateView(viewId, { settings });
    },
    [updateView]
  );

  // Delete a view
  const deleteView = useCallback(
    async (viewId: string): Promise<void> => {
      if (!tableId) throw new Error('No table selected');

      const res = await fetch(`/api/tables/${tableId}/views/${viewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        const newViews = views.filter((v) => v.id !== viewId);
        updateViews(newViews);

        // If deleted view was active, switch to first view
        if (activeViewId === viewId && newViews.length > 0) {
          const defaultView = newViews.find((v) => v.isDefault);
          setActiveViewId(defaultView?.id || newViews[0]?.id || null);
        }
      } else {
        throw new Error(data.error || 'Failed to delete view');
      }
    },
    [tableId, views, activeViewId, updateViews]
  );

  // Reorder views
  const reorderViews = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      if (!tableId) throw new Error('No table selected');

      // Optimistic update
      const reorderedViews = orderedIds
        .map((id) => views.find((v) => v.id === id))
        .filter((v): v is TableView => v !== undefined);
      setViews(reorderedViews);

      try {
        const res = await fetch(`/api/tables/${tableId}/views/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });
        const data = await res.json();

        if (!data.success) {
          setViews(views);
          throw new Error(data.error || 'Failed to reorder views');
        }
      } catch (error) {
        setViews(views);
        throw error;
      }
    },
    [tableId, views]
  );

  // Set as default view
  const setDefaultView = useCallback(
    async (viewId: string): Promise<void> => {
      await updateView(viewId, { isDefault: true });
    },
    [updateView]
  );

  return {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    setViewsFromTable,
    isLoading,
    // CRUD operations
    createView,
    updateView,
    updateViewSettings,
    deleteView,
    reorderViews,
    setDefaultView,
  };
}

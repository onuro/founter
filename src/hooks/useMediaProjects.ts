'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MediaProjectSummary, CreateProjectInput, UpdateProjectInput } from '@/types/media';

export function useMediaProjects() {
  const [projects, setProjects] = useState<MediaProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/media/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new project
  const createProject = useCallback(async (input: CreateProjectInput) => {
    const res = await fetch('/api/media/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create project');
    }
    // Refetch to get updated counts
    await fetchProjects();
    return data.data;
  }, [fetchProjects]);

  // Update a project
  const updateProject = useCallback(async (id: string, input: UpdateProjectInput) => {
    const res = await fetch(`/api/media/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update project');
    }
    // Update local state
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data.data } : p))
    );
    return data.data;
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/media/projects/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete project');
    }
    // Update local state
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Reorder projects
  const reorderProjects = useCallback(async (orderedIds: string[]) => {
    // Optimistic update
    const newOrder = orderedIds.map((id, index) => {
      const project = projects.find((p) => p.id === id);
      return project ? { ...project, order: index } : null;
    }).filter(Boolean) as MediaProjectSummary[];
    setProjects(newOrder);

    try {
      const res = await fetch('/api/media/projects/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on error
        await fetchProjects();
        throw new Error(data.error || 'Failed to reorder projects');
      }
    } catch (err) {
      // Revert on error
      await fetchProjects();
      throw err;
    }
  }, [projects, fetchProjects]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
  };
}

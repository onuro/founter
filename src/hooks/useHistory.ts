'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface HistoryItem {
  id: string;
  label: string;
  url: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface UseHistoryOptions {
  /** localStorage key for persistence */
  key: string;
  /** Maximum number of items to keep. Default: 20 */
  maxItems?: number;
}

export function useHistory({ key, maxItems = 20 }: UseHistoryOptions) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load history from localStorage:', err);
    }
    setIsLoaded(true);
  }, [key]);

  // Debounce ref to avoid blocking main thread with rapid localStorage writes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage whenever items change (after initial load) - debounced
  useEffect(() => {
    if (isLoaded) {
      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce localStorage write by 500ms
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(items));
        } catch (err) {
          console.error('Failed to save history to localStorage:', err);
        }
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [items, key, isLoaded]);

  const addItem = useCallback((url: string, label?: string, metadata?: Record<string, unknown>) => {
    setItems((prev) => {
      // Remove duplicate if exists (move to top)
      const filtered = prev.filter((item) => item.url !== url);

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        label: label || url,
        url,
        timestamp: Date.now(),
        metadata,
      };

      // Add to beginning, limit to maxItems
      return [newItem, ...filtered].slice(0, maxItems);
    });
  }, [maxItems]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    isLoaded,
    addItem,
    removeItem,
    clearAll,
  };
}

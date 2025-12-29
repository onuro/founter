'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { RowHeight } from '@/types/tables';

interface InlineLongTextEditorProps {
  value: string | null;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  rowHeight?: RowHeight;
}

export function InlineLongTextEditor({ value, onSave, onCancel, rowHeight = 'small' }: InlineLongTextEditorProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate min height based on row height
  const getMinHeight = () => {
    switch (rowHeight) {
      case 'large':
        return 120;
      case 'medium':
        return 100;
      default:
        return 120;
    }
  };

  // Update position based on anchor element
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Initial position and scroll listener
  useEffect(() => {
    updatePosition();

    // Listen to scroll events on any scrollable parent
    const handleScroll = () => {
      updatePosition();
    };

    // Add scroll listener to window and any scrollable ancestors
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updatePosition]);

  useEffect(() => {
    if (position) {
      textareaRef.current?.focus();
      // Move cursor to end
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }
  }, [position]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    // Enter adds newline (natural textarea behavior)
  };

  const handleBlur = () => {
    // Small delay to allow click events to register first
    setTimeout(() => {
      onSave(localValue);
      onCancel(); // Close after save
    }, 100);
  };

  return (
    <>
      {/* Invisible anchor to get position */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Portal the editor to body to escape overflow constraints */}
      {position && createPortal(
        <div
          className="fixed bg-neutral-950 border border-primary rounded shadow-lg"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 9999,
          }}
        >
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 resize-y focus:outline-none"
            style={{ minHeight: getMinHeight() }}
          />
        </div>,
        document.body
      )}
    </>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, X } from 'lucide-react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  onClear: () => void;
  isLoading: boolean;
  hasResults: boolean;
}

export function URLInput({ onSubmit, onClear, isLoading, hasResults }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    onSubmit(trimmedUrl);
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    onClear();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter URL to crawl (e.g., https://example.com)"
                disabled={isLoading}
                className="pr-10"
              />
              {url && !isLoading && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !url.trim()} className="cursor-pointer">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Crawling...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Fetch Images</span>
                </>
              )}
            </Button>
            {hasResults && !isLoading && (
              <Button type="button" variant="outline" onClick={handleClear} className="cursor-pointer">
                Clear
              </Button>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

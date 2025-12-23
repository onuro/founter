'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ExportControlsProps {
  onExportPng: () => void;
  onExportWebp: (quality: number) => void;
  isExporting: boolean;
  disabled?: boolean;
  error?: string | null;
}

export function ExportControls({
  onExportPng,
  onExportWebp,
  isExporting,
  disabled,
  error,
}: ExportControlsProps) {
  const [format, setFormat] = useState<'png' | 'webp'>('png');
  const [quality, setQuality] = useState(0.9);

  const handleExport = () => {
    if (format === 'png') {
      onExportPng();
    } else {
      onExportWebp(quality);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="flex gap-2">
          <Button
            variant={format === 'png' ? 'default' : 'outline'}
            onClick={() => setFormat('png')}
            className={cn(
              'flex-1',
              format === 'png' && 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
            )}
          >
            PNG
          </Button>
          <Button
            variant={format === 'webp' ? 'default' : 'outline'}
            onClick={() => setFormat('webp')}
            className={cn(
              'flex-1',
              format === 'webp' && 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
            )}
          >
            WebP
          </Button>
        </div>

        {/* Quality Slider (WebP only) */}
        {format === 'webp' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Quality</span>
              <span className="text-neutral-100">{Math.round(quality * 100)}%</span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={([v]) => setQuality(v)}
              min={0.1}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Download Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleExport}
          disabled={disabled || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download {format.toUpperCase()}
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <p className="text-xs text-neutral-500 text-center">
          Output: 1440 x 900px @ 2x resolution
        </p>
      </CardContent>
    </Card>
  );
}

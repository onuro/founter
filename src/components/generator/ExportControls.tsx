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
      <CardHeader>
        <Download className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setFormat('png')}
            className={cn(
              "flex-1",
              format === 'png' && "bg-white text-black hover:bg-white/90"
            )}
          >
            PNG
          </Button>
          <Button
            variant="secondary"
            onClick={() => setFormat('webp')}
            className={cn(
              "flex-1",
              format === 'webp' && "bg-white text-black hover:bg-white/90"
            )}
          >
            WebP
          </Button>
        </div>

        {/* Quality Slider (WebP only) */}
        {format === 'webp' && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quality</span>
              <span className="font-mono text-foreground">{Math.round(quality * 100)}%</span>
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
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download {format.toUpperCase()}
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Output: 1440 x 900px @ 2x resolution
        </p>
      </CardContent>
    </Card>
  );
}

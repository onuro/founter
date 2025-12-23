'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExportControlsProps {
  onExportPng: (filename: string, pixelRatio: number) => void;
  onExportWebp: (quality: number, filename: string, pixelRatio: number) => void;
  isExporting: boolean;
  disabled?: boolean;
  error?: string | null;
  filename?: string;
}

export function ExportControls({
  onExportPng,
  onExportWebp,
  isExporting,
  disabled,
  error,
  filename = 'newsletter-image',
}: ExportControlsProps) {
  const [format, setFormat] = useState<'png' | 'webp'>('png');
  const [quality, setQuality] = useState(0.9);
  const [is2x, setIs2x] = useState(false);

  const pixelRatio = is2x ? 2 : 1;
  const outputWidth = 1440 * pixelRatio;
  const outputHeight = 900 * pixelRatio;

  const handleExport = () => {
    if (format === 'png') {
      onExportPng(filename, pixelRatio);
    } else {
      onExportWebp(quality, filename, pixelRatio);
    }
  };

  return (
    <Card>
      <CardHeader>
        <Download className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <Tabs value={format} onValueChange={(v) => setFormat(v as 'png' | 'webp')}>
          <TabsList>
            <TabsTrigger value="png">PNG</TabsTrigger>
            <TabsTrigger value="webp">WebP</TabsTrigger>
          </TabsList>
        </Tabs>

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

        {/* Resolution Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Resolution</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${!is2x ? 'text-foreground' : 'text-muted-foreground'}`}>1x</span>
            <Switch checked={is2x} onCheckedChange={setIs2x} />
            <span className={`text-sm font-mono ${is2x ? 'text-foreground' : 'text-muted-foreground'}`}>2x</span>
          </div>
        </div>

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
          Output: {outputWidth} x {outputHeight}px
        </p>
      </CardContent>
    </Card>
  );
}

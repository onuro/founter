'use client';

import { useRef, useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { MonitorFrame } from './MonitorFrame';
import { MonitorFramePreview } from './MonitorFramePreview';
import { ColorPicker } from './ColorPicker';
import { ExportControls } from './ExportControls';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useImageExport } from '@/hooks/useImageExport';
import { Header } from '@/components/shared/Header';

export function GeneratorLayout() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [backgroundColor, setBackgroundColor] = useState('#735AC2');

  const { image, isLoading, error: uploadError, handleFileSelect, clearImage } = useImageUpload();
  const { exportAsPng, exportAsWebp, isExporting, exportProgress, error: exportError } = useImageExport(exportRef);

  // Extract filename without extension from the uploaded image
  const getFilenameWithoutExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  };

  const exportFilename = image?.file.name
    ? getFilenameWithoutExtension(image.file.name)
    : 'newsletter-image';

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      {/* Hidden Export Target - fixed 1440x900, wrapped in overflow-hidden container */}
      <div className="fixed top-0 left-0 w-px h-px overflow-hidden" aria-hidden="true">
        <div
          ref={exportRef}
          className="w-[1440px] h-[900px]"
          style={{ backgroundColor }}
        >
          <MonitorFrame screenshotUrl={image?.dataUrl} />
        </div>
      </div>

      {/* Header */}
      <Header />


      {/* Main Content */}
      <main className="max-w-[1750px] mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">

          {/* Controls Sidebar */}
          <div className="space-y-4">
            <ImageUploader
              onUpload={handleFileSelect}
              image={image}
              onClear={clearImage}
              isLoading={isLoading}
              error={uploadError}
            />

            <ColorPicker
              selected={backgroundColor}
              onChange={setBackgroundColor}
            />

            <ExportControls
              onExportPng={(filename, pixelRatio) => exportAsPng(filename, pixelRatio)}
              onExportWebp={(quality, filename, pixelRatio) => exportAsWebp(quality, filename, pixelRatio)}
              isExporting={isExporting}
              exportProgress={exportProgress}
              disabled={!image}
              error={exportError}
              filename={exportFilename}
            />
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="w-full aspect-[1440/900] bg-card rounded-md overflow-hidden">
              <div
                className="w-full h-full transition-colors duration-300"
                style={{ backgroundColor }}
              >
                <MonitorFramePreview screenshotUrl={image?.dataUrl} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Preview
              </span>
              <span className="text-xs text-muted-foreground">
                Base: 1440x900
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

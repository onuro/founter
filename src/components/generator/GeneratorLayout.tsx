'use client';

import { useRef, useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { MonitorFrame } from './MonitorFrame';
import { ColorPicker } from './ColorPicker';
import { ExportControls } from './ExportControls';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useImageExport } from '@/hooks/useImageExport';

export function GeneratorLayout() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [backgroundColor, setBackgroundColor] = useState('#735AC2');

  const { image, isLoading, error: uploadError, handleFileSelect, clearImage } = useImageUpload();
  const { exportAsPng, exportAsWebp, isExporting, error: exportError } = useImageExport(previewRef);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Newsletter Image Generator</h1>
          <p className="text-neutral-400">
            Create beautiful mockups for your Fountn.design newsletter
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Preview Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
              Preview
            </h2>
            <div className="overflow-auto bg-neutral-900/50 rounded-xl border border-neutral-800">
              <div className="p-4 min-w-fit">
                {/* Export Target - Fixed dimensions */}
                <div
                  ref={previewRef}
                  className="w-[1440px] h-[900px] overflow-hidden transition-colors duration-300"
                  style={{ backgroundColor }}
                >
                  <MonitorFrame screenshotUrl={image?.dataUrl} />
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 text-center">
              Scroll to see the full preview. Export will be 1440x900px.
            </p>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-6">
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
              onExportPng={() => exportAsPng()}
              onExportWebp={(quality) => exportAsWebp(quality)}
              isExporting={isExporting}
              disabled={!image}
              error={exportError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

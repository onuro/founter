'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploader } from './ImageUploader';
import { MonitorFrame } from './MonitorFrame';
import { MonitorFramePreview } from './MonitorFramePreview';
import { ColorPicker } from './ColorPicker';
import { ExportControls } from './ExportControls';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useImageExport } from '@/hooks/useImageExport';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function GeneratorLayout() {
  const router = useRouter();
  const exportRef = useRef<HTMLDivElement>(null);
  const [backgroundColor, setBackgroundColor] = useState('#735AC2');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const { image, isLoading, error: uploadError, handleFileSelect, clearImage } = useImageUpload();
  const { exportAsPng, exportAsWebp, isExporting, error: exportError } = useImageExport(exportRef);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative">
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

      {/* Visible Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="absolute right-0 top-0 text-neutral-400 hover:text-neutral-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </Button>
          <h1 className="text-4xl font-bold mb-2">Newsletter Image Generator</h1>
          <p className="text-neutral-400">
            Create beautiful mockups for your Fountn.design newsletter
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Preview Section - Fully Responsive */}
          <div className="space-y-4">
            <div className="w-full aspect-[1440/900] bg-neutral-900/50 rounded-xl border border-neutral-800 overflow-hidden">
              <div
                className="w-full h-full transition-colors duration-300"
                style={{ backgroundColor }}
              >
                <MonitorFramePreview screenshotUrl={image?.dataUrl} />
              </div>
            </div>
            <p className="text-xs text-neutral-500 text-center">
              Export will be 1440x900px at 2x resolution.
            </p>
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
              Preview
            </h2>
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

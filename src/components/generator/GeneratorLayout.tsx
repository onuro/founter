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
    <div className="min-h-screen bg-background text-foreground">
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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1750px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">FOUNTER</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              Newsletter Generator
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1750px] mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
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
                Export: 1440x900 @ 2x
              </span>
            </div>
          </div>

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
              onExportPng={() => exportAsPng()}
              onExportWebp={(quality) => exportAsWebp(quality)}
              isExporting={isExporting}
              disabled={!image}
              error={exportError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';

interface MonitorFrameProps {
  screenshotUrl?: string;
  className?: string;
}

export function MonitorFrame({ screenshotUrl, className }: MonitorFrameProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Wrapper with 108px padding on top, left, right */}
      <div className="pt-[100px] px-[108px]">
        {/* Monitor Container */}
        <div className="relative flex flex-col items-center">
          {/* Monitor Body */}
          <div className="relative z-4 bg-zinc-900 rounded-sm p-3 shadow-2xl shadow-black/50">
            {/* Screen Bezel */}
            {/* Screen Area - sized to fit within 1224px available width */}
            <div className="relative bg-zinc-950 rounded-xs overflow-hidden w-[1200px] h-[675px]">
              {screenshotUrl ? (
                <img
                  src={screenshotUrl}
                  alt="Screenshot"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600">
                  <span className="text-lg">Upload a screenshot</span>
                </div>
              )}
              {/* Subtle screen reflection */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Pro Display XDR Stand */}
          <div
            className="relative z-10 -mt-[1px] pointer-events-none select-none"
            style={{
              width: '240px',
              height: '120px',
              background: 'linear-gradient(180deg, #C1C1C3 0%, #D9D9DB 100%)',
              boxShadow: '0px 13px 20px -10px rgba(0, 0, 0, 0.3) inset',
            }}
          />
        </div>
      </div>
    </div>
  );
}

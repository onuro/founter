'use client';

import { cn } from '@/lib/utils';

interface MonitorFramePreviewProps {
  screenshotUrl?: string;
  className?: string;
}

/**
 * Responsive version of MonitorFrame for preview display.
 * Uses absolute positioning with percentages to maintain exact proportions.
 *
 * Based on 1440x900 canvas:
 * - Top padding: 100px = 11.11%
 * - Side padding: 108px = 7.5%
 * - Screen: 1200x675 = 83.33% x 75%
 * - Monitor body (with bezel): ~1224x699
 * - Stand: 240x120 = 16.67% x 13.33%
 */
export function MonitorFramePreview({ screenshotUrl, className }: MonitorFramePreviewProps) {
  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Monitor Body - positioned absolutely */}
      <div
        className="absolute z-12 bg-zinc-950 rounded-sm shadow-2xl shadow-black/50"
        style={{
          top: '11.11%',
          left: '7.5%',
          right: '7.5%',
          height: '77.67%', // (699/900) monitor body height
          padding: '0.83%',
        }}
      >
        {/* Screen Area */}
        <div className="relative z-10 bg-zinc-800 rounded-xs overflow-hidden w-full h-full">
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="Screenshot"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <span className="text-sm md:text-base lg:text-lg">Upload a screenshot</span>
            </div>
          )}
          {/* Subtle screen reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Pro Display XDR Stand - positioned absolutely */}
      <div
        className="absolute z-0 left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          top: '86.67%', // After monitor body (11.11% + 77.67% - small overlap)
          width: '22%',
          height: '13.33%',
          background: 'linear-gradient(180deg, #999 30%, #D9D9DB 100%)',
          boxShadow: '0px 13px 20px -10px rgba(0, 0, 0, 0.3) inset',
        }}
      />
    </div>
  );
}

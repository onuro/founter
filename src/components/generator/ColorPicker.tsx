'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PREDEFINED_COLORS, isValidHex, normalizeHex } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selected: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ selected, onChange }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState('');
  const [hexError, setHexError] = useState<string | null>(null);

  const handleCustomHexApply = () => {
    const normalized = normalizeHex(customHex);
    if (isValidHex(normalized)) {
      onChange(normalized);
      setHexError(null);
    } else {
      setHexError('Invalid hex color');
    }
  };

  const handleCustomHexChange = (value: string) => {
    setCustomHex(value);
    setHexError(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Background Color
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-0">
            <div className="grid grid-cols-6 gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => onChange(color.hex)}
                  className={cn(
                    'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110',
                    selected === color.hex
                      ? 'border-white ring-2 ring-white/30'
                      : 'border-transparent hover:border-neutral-500'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-0 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="#735AC2"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomHexApply()}
                className="flex-1"
              />
              <Button onClick={handleCustomHexApply}>Apply</Button>
            </div>
            {hexError && (
              <p className="text-sm text-red-400">{hexError}</p>
            )}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border border-neutral-700"
                style={{ backgroundColor: isValidHex(normalizeHex(customHex)) ? normalizeHex(customHex) : selected }}
              />
              <span className="text-sm text-neutral-400">
                Current: {selected}
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

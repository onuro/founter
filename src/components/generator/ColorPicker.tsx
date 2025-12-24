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
      <CardHeader>
        <Palette className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Background</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-0">
            <div className="grid grid-cols-8 gap-3">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => onChange(color.hex)}
                  className={cn(
                    'aspect-square rounded-sm transition-all hover:scale-110',
                    selected === color.hex
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-105'
                      : 'hover:ring-1 hover:ring-muted-foreground/30'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-0 space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="#FFEA00"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomHexApply()}
                className="flex-1 font-mono"
              />
              <Button onClick={handleCustomHexApply}>Apply</Button>
            </div>
            {hexError && (
              <p className="text-sm text-destructive">{hexError}</p>
            )}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-sm"
                style={{ backgroundColor: isValidHex(normalizeHex(customHex)) ? normalizeHex(customHex) : selected }}
              />
              <div className="text-sm">
                <p className="text-muted-foreground">Current</p>
                <p className="font-mono">{selected}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

import { ColorOption } from '@/types/generator';

export const PREDEFINED_COLORS: ColorOption[] = [
  { name: 'Royal Purple', hex: '#735AC2' },
  { name: 'Teal Green', hex: '#75B09C' },
  { name: 'Warm Brown', hex: '#816F63' },
  { name: 'Ocean Blue', hex: '#4A90D9' },
  { name: 'Coral', hex: '#E57373' },
  { name: 'Sunset Orange', hex: '#F5A623' },
  { name: 'Soft Lavender', hex: '#C4B5FD' },
  { name: 'Mint', hex: '#A7F3D0' },
  { name: 'Sky Blue', hex: '#BAE6FD' },
  { name: 'Zinc Dark', hex: '#27272A' },
  { name: 'Zinc Light', hex: '#A1A1AA' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function normalizeHex(hex: string): string {
  let normalized = hex.trim();
  if (!normalized.startsWith('#')) {
    normalized = '#' + normalized;
  }
  return normalized.toUpperCase();
}

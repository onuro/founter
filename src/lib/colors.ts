import { ColorOption } from '@/types/generator';

export const PREDEFINED_COLORS: ColorOption[] = [
  { name: 'Artificial Intelligence', hex: '#6E494F' },
  { name: 'Career & Freelancing', hex: '#929B6B' },
  { name: 'Coding', hex: '#59843A' },
  { name: 'Communities', hex: '#374A55' },
  { name: 'Design Systems', hex: '#515155' },
  { name: 'Figma', hex: '#475A51' },
  { name: 'Fonts', hex: '#304474' },
  { name: 'Framer', hex: '#545074' },
  { name: 'Icons', hex: '#B13F3F' },
  { name: 'Inspiration', hex: '#9A978D' },
  { name: 'Learning', hex: '#816F63' },
  { name: 'Marketing & Business', hex: '#27453C' },
  { name: 'Nice Finds', hex: '#334B44' },
  { name: 'Podcasts', hex: '#9B7B6B' },
  { name: 'Repositories', hex: '#537388' },
  { name: 'Tutorials', hex: '#3B3E4A' },
  { name: 'UI & Visual Design', hex: '#496878' },
  { name: 'UX Design', hex: '#8B6CA5' },
  { name: 'Web3', hex: '#80843A' },
  { name: 'Dark Zinc', hex: '#17171A' },
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

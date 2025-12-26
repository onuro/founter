// Shared grid option constants for ImageGrid and PresetFormDialog

export const COLUMN_OPTIONS = [2, 3, 4, 5, 6, 8] as const;

export const GAP_OPTIONS = [
  { label: '2', value: '0.5rem' },
  { label: '3', value: '0.75rem' },
  { label: '4', value: '1rem' },
  { label: '5', value: '1.25rem' },
  { label: '6', value: '1.5rem' },
] as const;

export const ASPECT_RATIO_OPTIONS = [
  { label: '1:1', value: '1/1', description: 'Square' },
  { label: '16:9', value: '16/9', description: 'Landscape HD' },
  { label: '9:16', value: '9/16', description: 'Portrait HD' },
  { label: '4:3', value: '4/3', description: 'Classic' },
  { label: '3:4', value: '3/4', description: 'Portrait' },
  { label: '3:2', value: '3/2', description: 'Photo' },
  { label: '2:3', value: '2/3', description: 'Portrait Photo' },
  { label: '21:9', value: '21/9', description: 'Ultra Wide' },
  { label: '4:5', value: '4/5', description: 'Instagram' },
  { label: '5:4', value: '5/4', description: 'Large Format' },
  { label: '2:1', value: '2/1', description: 'Panorama' },
] as const;

// Type for aspect ratio values
export type AspectRatioValue = typeof ASPECT_RATIO_OPTIONS[number]['value'];

// Default values
export const DEFAULT_COLUMNS = 5;
export const DEFAULT_GAP = '1rem';
export const DEFAULT_ASPECT_RATIO: AspectRatioValue = '1/1';

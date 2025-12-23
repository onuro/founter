export interface UploadedImage {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ExportOptions {
  format: 'png' | 'webp';
  quality: number;
  filename: string;
}

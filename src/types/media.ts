// ==========================================
// Media Manager Types
// ==========================================

// Core types
export interface MediaProject {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaProjectSummary extends MediaProject {
  fileCount: number;
  folderCount: number;
  totalSize: number;
}

export interface MediaFolder {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFolderTree extends MediaFolder {
  children: MediaFolderTree[];
  fileCount: number;
}

export interface MediaFile {
  id: string;
  projectId: string;
  folderId: string | null;
  filename: string;
  originalFilename: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  metadata: Record<string, unknown> | null;
  order: number;
  tags: MediaTag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaTag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaTagWithCount extends MediaTag {
  fileCount: number;
}

export interface MediaFileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  filename: string;
  path: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

// Input types
export interface CreateProjectInput {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
}

export interface UpdateFileInput {
  originalFilename?: string;
  alt?: string | null;
  metadata?: Record<string, unknown> | null;
  folderId?: string | null;
  projectId?: string;
  tagIds?: string[];
}

export interface CreateTagInput {
  name: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

// Search params
export interface SearchFilesParams {
  q?: string;
  projectId?: string;
  folderId?: string;
  tags?: string[];
  mimeType?: string;
  minSize?: number;
  maxSize?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// API Response types
export interface MediaProjectsResponse {
  success: boolean;
  data: MediaProjectSummary[];
  error?: string;
}

export interface MediaProjectResponse {
  success: boolean;
  data: MediaProject;
  error?: string;
}

export interface MediaFilesResponse {
  success: boolean;
  data: MediaFile[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface MediaFileResponse {
  success: boolean;
  data: MediaFile;
  error?: string;
}

export interface MediaFoldersResponse {
  success: boolean;
  data: MediaFolderTree[];
  error?: string;
}

export interface MediaTagsResponse {
  success: boolean;
  data: MediaTagWithCount[];
  error?: string;
}

// Tag colors (matching tables select field pattern)
export const MEDIA_TAG_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'cyan',
] as const;

export type MediaTagColor = typeof MEDIA_TAG_COLORS[number];

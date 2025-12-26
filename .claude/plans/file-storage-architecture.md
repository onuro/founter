# Image/File Storage Architecture Reference

> **Purpose**: Reference document for implementing file storage in Founter when needed.
> **Status**: Planning reference (not for immediate implementation)

---

## Overview

Store images on **filesystem** with metadata in **database**. This approach is optimal for the dedicated server setup (Ryzen 9, 130GB RAM, 2x877GB NVMe).

---

## Database Schema

Add to `prisma/schema.prisma`:

```prisma
model StoredFile {
  id            String    @id @default(cuid())

  // File metadata
  filename      String                    // Original filename
  storagePath   String    @unique         // "2025/12/26/clx1abc.jpg"
  mimeType      String                    // "image/jpeg", "image/png", "image/webp"
  size          Int                       // Bytes

  // Image dimensions (nullable for future non-image support)
  width         Int?
  height        Int?

  // Thumbnail (self-relation)
  thumbnailId   String?   @unique
  thumbnail     StoredFile? @relation("ThumbnailOf", fields: [thumbnailId], references: [id], onDelete: SetNull)
  originalFile  StoredFile? @relation("ThumbnailOf")

  // Source tracking
  sourceType    String                    // "CRAWL" | "UPLOAD" | "GENERATED"
  sourceUrl     String?                   // Original URL if crawled
  sourcePresetId String?                  // SitePreset reference if from crawl

  // Deduplication
  hash          String?                   // SHA-256 hash

  // Timestamps & soft delete
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?                 // Soft delete for cleanup queue

  @@index([sourceType])
  @@index([sourcePresetId])
  @@index([hash])
  @@index([deletedAt])
}
```

---

## Filesystem Structure

```
founter/
├── storage/                      # Outside public/ for access control
│   ├── images/
│   │   ├── originals/
│   │   │   └── YYYY/MM/DD/       # Date-based folders (prevents bloat)
│   │   │       └── {cuid}.{ext}
│   │   └── thumbnails/
│   │       └── YYYY/MM/DD/
│   │           └── {cuid}_thumb.webp
│   └── .gitkeep
```

**Why outside `public/`**: Enables access control, prevents direct URL guessing.

---

## Environment Variables

```env
STORAGE_PATH=/path/to/founter/storage
STORAGE_BASE_URL=/api/files
THUMBNAIL_SIZE=400
# Future: STORAGE_PROVIDER=bunny
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/files/upload` | POST | Upload single file (FormData) |
| `/api/files/[...path]` | GET | Serve file by storage path |
| `/api/files/[id]` | DELETE | Soft delete file |
| `/api/files/save-crawled` | POST | Bulk save crawled images |
| `/api/files/cleanup` | POST | Hard delete old soft-deleted files |

---

## Storage Abstraction (for CDN migration)

```typescript
// src/lib/storage/types.ts
interface StorageProvider {
  uploadFile(input: UploadInput): Promise<UploadResult>;
  uploadFromUrl(url: string, options?: DownloadOptions): Promise<UploadResult>;
  getFileBuffer(storagePath: string): Promise<Buffer>;
  deleteFile(storagePath: string): Promise<void>;
  getPublicUrl(storagePath: string): string;
}
```

Start with `LocalStorageProvider`, swap to `BunnyStorageProvider` later via env var.

---

## Key Dependencies

```json
{
  "sharp": "^0.33.0"  // Image processing, thumbnails, metadata
}
```

---

## Use Cases Covered

1. **Crawled images** - Save from Fetcher with `sourceType: "CRAWL"`
2. **User uploads** - Save screenshots with `sourceType: "UPLOAD"`
3. **Generated exports** - Save mockups with `sourceType: "GENERATED"`

---

## Deduplication

- Hash files with SHA-256 before storing
- Check for existing hash in DB
- Return existing record if duplicate found

---

## Cleanup Flow

1. Delete sets `deletedAt` timestamp (soft delete)
2. Cleanup cron finds files with `deletedAt` > 7 days old
3. Deletes from filesystem, then hard deletes DB record

---

## Migration to Bunny.net CDN

When needed:
1. Create `BunnyStorageProvider` implementing same interface
2. Migration script: copy files to Bunny, keep same paths
3. Set `STORAGE_PROVIDER=bunny` in env
4. `getPublicUrl()` returns CDN URL instead of API route

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add StoredFile model |
| `src/lib/storage/types.ts` | Storage interface |
| `src/lib/storage/local-storage.ts` | Local filesystem impl |
| `src/lib/storage/index.ts` | Factory/export |
| `src/lib/storage/thumbnail.ts` | Thumbnail generation |
| `src/app/api/files/upload/route.ts` | Upload endpoint |
| `src/app/api/files/[...path]/route.ts` | Serve endpoint |
| `src/app/api/files/[id]/route.ts` | Delete endpoint |
| `src/app/api/files/save-crawled/route.ts` | Bulk crawl save |
| `src/hooks/useStoredFiles.ts` | Client-side hook |

---

## Summary

**Store files on disk, metadata in DB, serve via API route, abstract for future CDN.**

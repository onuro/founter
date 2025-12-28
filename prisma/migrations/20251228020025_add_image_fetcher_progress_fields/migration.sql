-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImageFetcherSaved" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageCount" INTEGER NOT NULL,
    "options" JSONB,
    "status" TEXT NOT NULL DEFAULT 'downloading',
    "downloadedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ImageFetcherSaved" ("createdAt", "id", "imageCount", "label", "options", "updatedAt", "url") SELECT "createdAt", "id", "imageCount", "label", "options", "updatedAt", "url" FROM "ImageFetcherSaved";
DROP TABLE "ImageFetcherSaved";
ALTER TABLE "new_ImageFetcherSaved" RENAME TO "ImageFetcherSaved";
CREATE INDEX "ImageFetcherSaved_createdAt_idx" ON "ImageFetcherSaved"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

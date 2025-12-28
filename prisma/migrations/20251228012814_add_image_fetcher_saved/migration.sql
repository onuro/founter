-- CreateTable
CREATE TABLE "ImageFetcherSaved" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageCount" INTEGER NOT NULL,
    "options" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageFetcherSavedImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "savedId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "width" INTEGER,
    "alt" TEXT,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImageFetcherSavedImage_savedId_fkey" FOREIGN KEY ("savedId") REFERENCES "ImageFetcherSaved" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ImageFetcherSaved_createdAt_idx" ON "ImageFetcherSaved"("createdAt");

-- CreateIndex
CREATE INDEX "ImageFetcherSavedImage_savedId_idx" ON "ImageFetcherSavedImage"("savedId");

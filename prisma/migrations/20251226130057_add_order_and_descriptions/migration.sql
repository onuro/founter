-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "anthropicKeyDescription" TEXT;
ALTER TABLE "Settings" ADD COLUMN "baserowTokenDescription" TEXT;
ALTER TABLE "Settings" ADD COLUMN "glmKeyDescription" TEXT;
ALTER TABLE "Settings" ADD COLUMN "openaiKeyDescription" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SitePreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "crawlOptions" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SitePreset" ("crawlOptions", "createdAt", "id", "label", "type", "updatedAt", "url") SELECT "crawlOptions", "createdAt", "id", "label", "type", "updatedAt", "url" FROM "SitePreset";
DROP TABLE "SitePreset";
ALTER TABLE "new_SitePreset" RENAME TO "SitePreset";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

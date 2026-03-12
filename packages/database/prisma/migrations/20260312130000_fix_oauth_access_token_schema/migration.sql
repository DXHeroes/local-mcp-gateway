-- DropTable
DROP TABLE IF EXISTS "oauth_authorization_code";

-- AlterTable: oauth_access_token
-- Drop old columns
ALTER TABLE "oauth_access_token" DROP COLUMN IF EXISTS "token";
ALTER TABLE "oauth_access_token" DROP COLUMN IF EXISTS "scope";
ALTER TABLE "oauth_access_token" DROP COLUMN IF EXISTS "expires_at";

-- Add new columns
ALTER TABLE "oauth_access_token" ADD COLUMN "access_token" TEXT NOT NULL DEFAULT '';
ALTER TABLE "oauth_access_token" ADD COLUMN "refresh_token" TEXT NOT NULL DEFAULT '';
ALTER TABLE "oauth_access_token" ADD COLUMN "access_token_expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "oauth_access_token" ADD COLUMN "refresh_token_expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "oauth_access_token" ADD COLUMN "scopes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "oauth_access_token" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "oauth_access_token" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Remove defaults (they were only for migration)
ALTER TABLE "oauth_access_token" ALTER COLUMN "access_token" DROP DEFAULT;
ALTER TABLE "oauth_access_token" ALTER COLUMN "refresh_token" DROP DEFAULT;
ALTER TABLE "oauth_access_token" ALTER COLUMN "access_token_expires_at" DROP DEFAULT;
ALTER TABLE "oauth_access_token" ALTER COLUMN "refresh_token_expires_at" DROP DEFAULT;
ALTER TABLE "oauth_access_token" ALTER COLUMN "scopes" DROP DEFAULT;

-- Add unique constraints
CREATE UNIQUE INDEX "oauth_access_token_access_token_key" ON "oauth_access_token"("access_token");
CREATE UNIQUE INDEX "oauth_access_token_refresh_token_key" ON "oauth_access_token"("refresh_token");

-- AlterTable: oauth_consent
-- Rename scope -> scopes
ALTER TABLE "oauth_consent" RENAME COLUMN "scope" TO "scopes";

-- Add updated_at
ALTER TABLE "oauth_consent" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

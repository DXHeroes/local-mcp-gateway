-- AlterTable
ALTER TABLE "oauth_access_token" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "oauth_consent" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "organization_domains" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_domains_domain_idx" ON "organization_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "organization_domains_organization_id_domain_key" ON "organization_domains"("organization_id", "domain");

-- AddForeignKey
ALTER TABLE "organization_domains" ADD CONSTRAINT "organization_domains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

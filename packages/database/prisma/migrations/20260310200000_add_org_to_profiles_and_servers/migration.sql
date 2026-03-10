-- AlterTable: Add organizationId to profiles
ALTER TABLE "profiles" ADD COLUMN "organization_id" TEXT;

-- AlterTable: Add organizationId to mcp_servers
ALTER TABLE "mcp_servers" ADD COLUMN "organization_id" TEXT;

-- Drop the old unique constraint on profiles.name
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_name_key";

-- CreateIndex: unique constraint on (organization_id, name) for profiles
CREATE UNIQUE INDEX "profiles_organization_id_name_key" ON "profiles"("organization_id", "name");

-- AddForeignKey: profiles.organization_id -> organization.id
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: mcp_servers.organization_id -> organization.id
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

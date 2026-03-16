-- Per-user MCP servers migration
-- Removes organizationId from McpServer, adds presetId, makes userId non-nullable

-- Step 1: Delete system servers (userId IS NULL AND organization_id IS NULL)
-- These are auto-seeded builtin servers that will now come from presets
DELETE FROM "profile_mcp_servers" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL AND "organization_id" IS NULL
);
DELETE FROM "mcp_server_tools_cache" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL AND "organization_id" IS NULL
);
DELETE FROM "oauth_tokens" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL AND "organization_id" IS NULL
);
DELETE FROM "oauth_client_registrations" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL AND "organization_id" IS NULL
);
DELETE FROM "debug_logs" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL AND "organization_id" IS NULL
);
DELETE FROM "mcp_servers" WHERE "user_id" IS NULL AND "organization_id" IS NULL;

-- Step 2: Assign org servers (userId IS NULL, organization_id IS NOT NULL) to org owner
-- Find the first owner member for each org and assign servers to them
UPDATE "mcp_servers"
SET "user_id" = (
  SELECT m."user_id" FROM "member" m
  WHERE m."organization_id" = "mcp_servers"."organization_id"
    AND m."role" = 'owner'
  LIMIT 1
)
WHERE "user_id" IS NULL AND "organization_id" IS NOT NULL;

-- Step 3: Delete any remaining servers without a userId (no owner found)
DELETE FROM "profile_mcp_servers" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL
);
DELETE FROM "mcp_server_tools_cache" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL
);
DELETE FROM "oauth_tokens" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL
);
DELETE FROM "oauth_client_registrations" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL
);
DELETE FROM "debug_logs" WHERE "mcp_server_id" IN (
  SELECT "id" FROM "mcp_servers" WHERE "user_id" IS NULL
);
DELETE FROM "mcp_servers" WHERE "user_id" IS NULL;

-- Step 4: Add preset_id column
ALTER TABLE "mcp_servers" ADD COLUMN "preset_id" TEXT;

-- Step 5: Drop organization_id column and its index
DROP INDEX IF EXISTS "mcp_servers_organization_id_idx";
ALTER TABLE "mcp_servers" DROP CONSTRAINT IF EXISTS "mcp_servers_organization_id_fkey";
ALTER TABLE "mcp_servers" DROP COLUMN "organization_id";

-- Step 6: Make user_id non-nullable
ALTER TABLE "mcp_servers" ALTER COLUMN "user_id" SET NOT NULL;

-- Step 7: Add user_id index
CREATE INDEX "mcp_servers_user_id_idx" ON "mcp_servers"("user_id");

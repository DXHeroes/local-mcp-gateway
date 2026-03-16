-- Require non-null user_id and organization_id on profiles.
-- Removes the "system profile" concept entirely.

-- 1. Delete debug logs referencing system profiles (userId IS NULL)
DELETE FROM "debug_logs"
WHERE "profile_id" IN (SELECT "id" FROM "profiles" WHERE "user_id" IS NULL);

-- 2. Delete tool customizations for system profiles
DELETE FROM "profile_mcp_server_tools"
WHERE "profile_mcp_server_id" IN (
  SELECT "id" FROM "profile_mcp_servers"
  WHERE "profile_id" IN (SELECT "id" FROM "profiles" WHERE "user_id" IS NULL)
);

-- 3. Delete profile-server links for system profiles
DELETE FROM "profile_mcp_servers"
WHERE "profile_id" IN (SELECT "id" FROM "profiles" WHERE "user_id" IS NULL);

-- 4. Delete system profiles (userId IS NULL)
DELETE FROM "profiles" WHERE "user_id" IS NULL;

-- 5. For profiles with userId but no organizationId, assign to user's first org
UPDATE "profiles" SET "organization_id" = (
  SELECT m."organization_id" FROM "member" m
  WHERE m."user_id" = "profiles"."user_id"
  ORDER BY m."created_at" ASC
  LIMIT 1
)
WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;

-- 6. Delete any remaining profiles that still have NULL organization_id
DELETE FROM "profiles" WHERE "organization_id" IS NULL;

-- 7. Make columns NOT NULL
ALTER TABLE "profiles" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "profiles" ALTER COLUMN "organization_id" SET NOT NULL;

-- 8. Drop old unique index, create new one
DROP INDEX IF EXISTS "profiles_organization_id_name_key";
CREATE UNIQUE INDEX "profiles_user_id_organization_id_name_key" ON "profiles"("user_id", "organization_id", "name");

-- 9. Create user_id index for per-user queries
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- 10. Create default profile for every existing user who doesn't have one
INSERT INTO "profiles" ("id", "name", "description", "user_id", "organization_id", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  'default',
  'Default MCP profile',
  m."user_id",
  m."organization_id",
  NOW(),
  NOW()
FROM "member" m
WHERE NOT EXISTS (
  SELECT 1 FROM "profiles" p
  WHERE p."user_id" = m."user_id"
    AND p."organization_id" = m."organization_id"
    AND p."name" = 'default'
)
-- Pick only the first org membership per user
AND m."organization_id" = (
  SELECT m2."organization_id" FROM "member" m2
  WHERE m2."user_id" = m."user_id"
  ORDER BY m2."created_at" ASC
  LIMIT 1
);

-- 11. Clean up the default_profile_deleted setting (no longer needed)
DELETE FROM "gateway_settings" WHERE "key" = 'default_profile_deleted';

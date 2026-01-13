-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mcp_servers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "oauth_config" TEXT,
    "api_key_config" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "profile_mcp_servers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "mcp_server_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "profile_mcp_servers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "profile_mcp_servers_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "profile_mcp_server_tools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_mcp_server_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "custom_name" TEXT,
    "custom_description" TEXT,
    "custom_input_schema" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "profile_mcp_server_tools_profile_mcp_server_id_fkey" FOREIGN KEY ("profile_mcp_server_id") REFERENCES "profile_mcp_servers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mcp_server_tools_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mcp_server_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "description" TEXT,
    "input_schema" TEXT,
    "schema_hash" TEXT NOT NULL,
    "fetched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mcp_server_tools_cache_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauth_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mcp_server_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_type" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "oauth_tokens_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "oauth_client_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mcp_server_id" TEXT NOT NULL,
    "authorization_server_url" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT,
    "registration_access_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "oauth_client_registrations_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "debug_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT,
    "mcp_server_id" TEXT,
    "request_type" TEXT NOT NULL,
    "request_payload" TEXT NOT NULL,
    "response_payload" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "debug_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "debug_logs_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "executed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "mcp_servers_type_idx" ON "mcp_servers"("type");

-- CreateIndex
CREATE INDEX "profile_mcp_servers_profile_id_idx" ON "profile_mcp_servers"("profile_id");

-- CreateIndex
CREATE INDEX "profile_mcp_servers_mcp_server_id_idx" ON "profile_mcp_servers"("mcp_server_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_mcp_servers_profile_id_mcp_server_id_key" ON "profile_mcp_servers"("profile_id", "mcp_server_id");

-- CreateIndex
CREATE INDEX "profile_mcp_server_tools_profile_mcp_server_id_idx" ON "profile_mcp_server_tools"("profile_mcp_server_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_mcp_server_tools_profile_mcp_server_id_tool_name_key" ON "profile_mcp_server_tools"("profile_mcp_server_id", "tool_name");

-- CreateIndex
CREATE INDEX "mcp_server_tools_cache_mcp_server_id_idx" ON "mcp_server_tools_cache"("mcp_server_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_server_tools_cache_mcp_server_id_tool_name_key" ON "mcp_server_tools_cache"("mcp_server_id", "tool_name");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_tokens_mcp_server_id_key" ON "oauth_tokens"("mcp_server_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_client_registrations_mcp_server_id_authorization_server_url_key" ON "oauth_client_registrations"("mcp_server_id", "authorization_server_url");

-- CreateIndex
CREATE INDEX "debug_logs_profile_id_idx" ON "debug_logs"("profile_id");

-- CreateIndex
CREATE INDEX "debug_logs_mcp_server_id_idx" ON "debug_logs"("mcp_server_id");

-- CreateIndex
CREATE INDEX "debug_logs_created_at_idx" ON "debug_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "migrations_name_key" ON "migrations"("name");

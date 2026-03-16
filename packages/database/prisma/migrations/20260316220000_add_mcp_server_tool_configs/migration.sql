-- CreateTable
CREATE TABLE "mcp_server_tool_configs" (
    "id" TEXT NOT NULL,
    "mcp_server_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_server_tool_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mcp_server_tool_configs_mcp_server_id_idx" ON "mcp_server_tool_configs"("mcp_server_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_server_tool_configs_mcp_server_id_tool_name_key" ON "mcp_server_tool_configs"("mcp_server_id", "tool_name");

-- AddForeignKey
ALTER TABLE "mcp_server_tool_configs" ADD CONSTRAINT "mcp_server_tool_configs_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

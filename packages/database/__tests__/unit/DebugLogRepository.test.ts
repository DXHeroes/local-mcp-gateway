/**
 * Unit tests for DebugLogRepository
 */

import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createDatabase, createRawDatabase, runMigrations } from '../../src/index.js';
import { DebugLogRepository } from '../../src/repositories/DebugLogRepository.js';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.js';
import { McpServerRepository } from '../../src/repositories/McpServerRepository.js';

describe('DebugLogRepository', () => {
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;
  let repository: DebugLogRepository;
  let profileRepository: ProfileRepository;
  let mcpServerRepository: McpServerRepository;
  let dbPath: string;
  let profileId: string;
  let serverId: string;

  beforeEach(async () => {
    dbPath = `/tmp/test-${randomUUID()}.db`;
    await runMigrations(dbPath);
    db = createDatabase(dbPath);
    rawDb = createRawDatabase(dbPath);
    repository = new DebugLogRepository(db);
    profileRepository = new ProfileRepository(db);
    mcpServerRepository = new McpServerRepository(db);

    // Create test profile and server
    const profile = await profileRepository.create({
      name: 'test-profile',
      description: 'Test profile',
    });
    profileId = profile.id;

    const server = await mcpServerRepository.create({
      name: 'test-server',
      type: 'remote_http',
      config: {
        url: 'https://example.com/mcp',
        transport: 'http',
      },
    });
    serverId = server.id;
  });

  afterEach(() => {
    if (rawDb) {
      rawDb.close();
    }
    try {
      if (dbPath) {
        unlinkSync(dbPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create debug log', async () => {
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({ method: 'tools/list' }),
        status: 'pending',
      });

      expect(log.id).toBeDefined();

      // Verify log was created by checking it exists
      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(1);
      expect(logs[0].requestType).toBe('tools/list');
    });

    it('should create log with all fields', async () => {
      const requestPayload = JSON.stringify({ method: 'tools/list', params: {} });
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload,
        status: 'pending',
      });

      expect(log.id).toBeDefined();

      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(1);
      const foundLog = logs[0];
      expect(foundLog.profileId).toBe(profileId);
      expect(foundLog.mcpServerId).toBe(serverId);
      expect(foundLog.requestType).toBe('tools/list');
      expect(foundLog.requestPayload).toBe(requestPayload);
      expect(foundLog.status).toBe('pending');
    });

    it('should create log with empty payload', async () => {
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'status/check',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      expect(log.id).toBeDefined();

      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(1);
      expect(logs[0].requestPayload).toBe(JSON.stringify({}));
    });
  });

  describe('update', () => {
    it('should update log with success response', async () => {
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({ method: 'tools/list' }),
        status: 'pending',
      });

      const responsePayload = JSON.stringify({ tools: [{ name: 'test-tool' }] });
      await repository.update(log.id, {
        responsePayload,
        status: 'success',
        durationMs: 150,
      });

      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(1);
      const updatedLog = logs[0];
      expect(updatedLog.status).toBe('success');
      expect(updatedLog.responsePayload).toBe(responsePayload);
      expect(updatedLog.durationMs).toBe(150);
    });

    it('should update log with error', async () => {
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({ method: 'tools/list' }),
        status: 'pending',
      });

      const errorMessage = 'Failed to connect';
      await repository.update(log.id, {
        status: 'error',
        errorMessage,
        durationMs: 50,
      });

      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(1);
      const updatedLog = logs[0];
      expect(updatedLog.status).toBe('error');
      expect(updatedLog.errorMessage).toBe(errorMessage);
      expect(updatedLog.durationMs).toBe(50);
    });

    it('should update log with partial data', async () => {
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({ method: 'tools/list' }),
        status: 'pending',
      });

      await repository.update(log.id, {
        status: 'success',
      });

      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('success');
    });
  });

  describe('findMany', () => {
    it('should find logs for profile', async () => {
      await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'status/check',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      const logs = await repository.findMany({ profileId });
      expect(logs.length).toBe(2);
      expect(logs.map((l) => l.requestType)).toContain('tools/list');
      expect(logs.map((l) => l.requestType)).toContain('status/check');
    });

    it('should find logs for MCP server', async () => {
      const server2 = await mcpServerRepository.create({
        name: 'test-server-2',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      // Create profile2 for server2 to avoid foreign key issues
      const profile2 = await profileRepository.create({
        name: 'test-profile-2',
        description: 'Test profile 2',
      });

      await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      await repository.create({
        profileId: profile2.id,
        mcpServerId: server2.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      const logs = await repository.findMany({ mcpServerId: serverId });
      expect(logs.length).toBe(1);
      expect(logs[0].mcpServerId).toBe(serverId);
    });

    it('should find logs for specific profile and server', async () => {
      const profile2 = await profileRepository.create({
        name: 'test-profile-2',
        description: 'Test profile 2',
      });

      const server2 = await mcpServerRepository.create({
        name: 'test-server-2',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      await repository.create({
        profileId: profile2.id,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      await repository.create({
        profileId,
        mcpServerId: server2.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      const logs = await repository.findMany({ profileId, mcpServerId: serverId });
      expect(logs.length).toBe(1);
      expect(logs[0].profileId).toBe(profileId);
      expect(logs[0].mcpServerId).toBe(serverId);
    });

    it('should return empty array when no matching logs exist', async () => {
      const logs = await repository.findMany({ profileId, mcpServerId: serverId });
      expect(logs).toEqual([]);
    });

    it('should filter by status', async () => {
      await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'success',
      });

      await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'error',
      });

      const successLogs = await repository.findMany({ profileId, status: 'success' });
      expect(successLogs.length).toBe(1);
      expect(successLogs[0].status).toBe('success');

      const errorLogs = await repository.findMany({ profileId, status: 'error' });
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].status).toBe('error');
    });
  });

  describe('edge cases', () => {
    it('should handle very long request payload', async () => {
      const longPayload = JSON.stringify({
        method: 'tools/list',
        params: {
          data: 'x'.repeat(10000), // Very long string
        },
      });

      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: longPayload,
        status: 'pending',
      });

      expect(log.id).toBeDefined();

      const logs = await repository.findMany({ profileId });
      expect(logs[0].requestPayload).toBe(longPayload);
    });

    it('should handle very long error message', async () => {
      const log = await repository.create({
        profileId,
        mcpServerId: serverId,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
      });

      const longErrorMessage = 'Error: ' + 'x'.repeat(5000);
      await repository.update(log.id, {
        status: 'error',
        errorMessage: longErrorMessage,
      });

      const logs = await repository.findMany({ profileId });
      expect(logs[0].errorMessage).toBe(longErrorMessage);
    });
  });
});

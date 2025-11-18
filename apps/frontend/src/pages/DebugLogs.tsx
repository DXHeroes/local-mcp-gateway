/**
 * Debug Logs page
 */

import { useCallback, useEffect, useState } from 'react';

interface DebugLog {
  id: string;
  profileId: string;
  mcpServerId?: string;
  requestType: string;
  requestPayload: string;
  responsePayload?: string;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
  createdAt: number;
}

interface Profile {
  id: string;
  name: string;
}

interface McpServer {
  id: string;
  name: string;
}

import { API_URL } from '../config/api';

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedMcpServerId, setSelectedMcpServerId] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/profiles`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  }, []);

  const fetchServers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/mcp-servers`);
      if (response.ok) {
        const data = await response.json();
        setServers(data);
      }
    } catch (err) {
      console.error('Failed to fetch MCP servers:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProfileId) params.append('profileId', selectedProfileId);
      if (selectedMcpServerId) params.append('mcpServerId', selectedMcpServerId);
      if (selectedRequestType) params.append('requestType', selectedRequestType);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('limit', '100');

      const response = await fetch(`${API_URL}/api/debug/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch debug logs');
      }
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedProfileId, selectedMcpServerId, selectedRequestType, selectedStatus]);

  useEffect(() => {
    fetchProfiles();
    fetchServers();
  }, [fetchProfiles, fetchServers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${ms}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  if (loading) {
    return <div className="p-6">Loading debug logs...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Debug Logs</h2>

      {error && <div className="mb-4 p-4 text-red-600 bg-red-50 rounded-md">Error: {error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="filter-profile"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Profile
            </label>
            <select
              id="filter-profile"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Profiles</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-server" className="block text-xs font-medium text-gray-600 mb-1">
              MCP Server
            </label>
            <select
              id="filter-server"
              value={selectedMcpServerId}
              onChange={(e) => setSelectedMcpServerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Servers</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-request-type"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Request Type
            </label>
            <select
              id="filter-request-type"
              value={selectedRequestType}
              onChange={(e) => setSelectedRequestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Types</option>
              <option value="tools/list">tools/list</option>
              <option value="tools/call">tools/call</option>
              <option value="resources/list">resources/list</option>
              <option value="resources/read">resources/read</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            No debug logs found. Debug logs viewer will display logs here when they are available.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const profile = profiles.find((p) => p.id === log.profileId);
            const server = log.mcpServerId ? servers.find((s) => s.id === log.mcpServerId) : null;

            return (
              <div key={log.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                      <span className="text-sm text-gray-600">{log.requestType}</span>
                      {log.durationMs && (
                        <span className="text-xs text-gray-500">
                          {formatDuration(log.durationMs)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Profile: {profile?.name || log.profileId}
                      {server && ` • Server: ${server.name}`}
                      {` • ${formatDate(log.createdAt)}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Request</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {formatJson(log.requestPayload)}
                    </pre>
                  </div>

                  {log.responsePayload && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Response</h4>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                        {formatJson(log.responsePayload)}
                      </pre>
                    </div>
                  )}

                  {log.errorMessage && (
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-1">Error</h4>
                      <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto text-red-800">
                        {log.errorMessage}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

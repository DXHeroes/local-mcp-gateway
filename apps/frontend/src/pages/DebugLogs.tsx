/**
 * Debug Logs page
 */

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-fetch';

interface DebugLog {
  id: string;
  profileId: string | null;
  mcpServerId?: string | null;
  requestType: string;
  requestPayload: string;
  responsePayload?: string;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
  createdAt: number | string;
  profile?: Profile | null;
  mcpServer?: McpServer | null;
}

interface Profile {
  id: string;
  name: string;
}

interface McpServer {
  id: string;
  name: string;
}

interface DebugLogsResponse {
  logs: DebugLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedMcpServerId, setSelectedMcpServerId] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSince, setSelectedSince] = useState<string>('');
  const [selectedUntil, setSelectedUntil] = useState<string>('');

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await apiFetch('/api/profiles');
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
      const response = await apiFetch('/api/mcp-servers');
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
      if (selectedProfileId) {
        params.append('profileId', selectedProfileId);
      }
      if (selectedMcpServerId) {
        params.append('mcpServerId', selectedMcpServerId);
      }
      if (selectedRequestType) {
        params.append('requestType', selectedRequestType);
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }
      if (selectedSince) {
        params.append('since', new Date(selectedSince).toISOString());
      }
      if (selectedUntil) {
        params.append('until', new Date(selectedUntil).toISOString());
      }
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await apiFetch(`/api/debug/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch debug logs');
      }
      const data = (await response.json()) as DebugLogsResponse;
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setTotal(data.total ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [
    limit,
    page,
    selectedMcpServerId,
    selectedProfileId,
    selectedRequestType,
    selectedSince,
    selectedStatus,
    selectedUntil,
  ]);

  const clearLogs = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all debug logs?')) {
      return;
    }
    try {
      setClearing(true);
      const params = new URLSearchParams();
      if (selectedProfileId) params.append('profileId', selectedProfileId);
      if (selectedMcpServerId) params.append('mcpServerId', selectedMcpServerId);

      await apiFetch(`/api/debug/logs?${params.toString()}`, {
        method: 'DELETE',
      });
      if (page !== 1) {
        setPage(1);
      } else {
        await fetchLogs();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    } finally {
      setClearing(false);
    }
  }, [fetchLogs, page, selectedMcpServerId, selectedProfileId]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  useEffect(() => {
    fetchProfiles();
    fetchServers();
  }, [fetchProfiles, fetchServers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (timestamp: number | string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined || ms === null) {
      return 'N/A';
    }

    return `${ms}ms`;
  };

  const getDurationColor = (ms?: number) => {
    if (ms === undefined || ms === null) {
      return 'text-gray-500';
    }
    if (ms < 100) {
      return 'text-green-600';
    }
    if (ms < 500) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
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
    return <div className="p-4">Loading debug logs...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Logs</h2>

      {error && <div className="mb-4 p-4 text-red-600 bg-red-50 rounded-md">Error: {error}</div>}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            <span className="text-sm text-gray-500">
              {total} log{total !== 1 ? 's' : ''} total
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-refresh
            </label>
            <button
              type="button"
              onClick={clearLogs}
              disabled={clearing || logs.length === 0}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? 'Clearing...' : 'Clear Logs'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
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
              onChange={(e) => {
                setPage(1);
                setSelectedProfileId(e.target.value);
              }}
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
              onChange={(e) => {
                setPage(1);
                setSelectedMcpServerId(e.target.value);
              }}
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
              onChange={(e) => {
                setPage(1);
                setSelectedRequestType(e.target.value);
              }}
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
              onChange={(e) => {
                setPage(1);
                setSelectedStatus(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-since" className="block text-xs font-medium text-gray-600 mb-1">
              Since
            </label>
            <input
              id="filter-since"
              type="datetime-local"
              value={selectedSince}
              onChange={(e) => {
                setPage(1);
                setSelectedSince(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label htmlFor="filter-until" className="block text-xs font-medium text-gray-600 mb-1">
              Until
            </label>
            <input
              id="filter-until"
              type="datetime-local"
              value={selectedUntil}
              onChange={(e) => {
                setPage(1);
                setSelectedUntil(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label htmlFor="filter-limit" className="block text-xs font-medium text-gray-600 mb-1">
              Page Size
            </label>
            <select
              id="filter-limit"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
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
        <div className="space-y-3">
          {logs.map((log) => {
            const profile =
              log.profile ??
              (log.profileId ? profiles.find((item) => item.id === log.profileId) : undefined);
            const server =
              log.mcpServer ??
              (log.mcpServerId
                ? servers.find((item) => item.id === log.mcpServerId)
                : undefined);

            return (
              <div key={log.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {server ? 'Server' : 'Profile'}
                      </span>
                      <span className="text-sm text-gray-600">{log.requestType}</span>
                      {log.durationMs !== undefined && (
                        <span className={`text-xs font-medium ${getDurationColor(log.durationMs)}`}>
                          {formatDuration(log.durationMs)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Profile: {profile?.name || log.profileId || 'N/A'}
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

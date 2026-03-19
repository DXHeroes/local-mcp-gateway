/**
 * Debug Logs page
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@dxheroes/local-mcp-ui';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DebugLogsOverview, { type DebugLogsSummary } from '../components/DebugLogsOverview';
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

interface PayloadPanelProps {
  title: string;
  content: string;
  tone?: 'default' | 'error';
}

const EMPTY_SUMMARY: DebugLogsSummary = {
  overview: {
    totalLogs: 0,
    successCount: 0,
    errorCount: 0,
    pendingCount: 0,
    errorRate: 0,
    avgDurationMs: 0,
    p95DurationMs: 0,
    uniqueProfiles: 0,
    uniqueServers: 0,
  },
  timeBucket: 'day',
  timeseries: [],
  statusBreakdown: [],
  requestTypeBreakdown: [],
  serverBreakdown: [],
  latencyBuckets: [
    { label: '0-100ms', count: 0 },
    { label: '100-500ms', count: 0 },
    { label: '500ms-1s', count: 0 },
    { label: '1s+', count: 0 },
  ],
};

function getPayloadSummary(content: string) {
  const trimmed = content.trim();
  const lineCount = trimmed ? trimmed.split('\n').length : 0;
  const characterCount = trimmed.length;
  const lineLabel = lineCount === 1 ? 'line' : 'lines';
  const characterLabel = characterCount === 1 ? 'char' : 'chars';

  if (!trimmed) {
    return 'Empty payload';
  }

  return `${lineCount} ${lineLabel} · ${characterCount} ${characterLabel}`;
}

function PayloadPanel({ title, content, tone = 'default' }: PayloadPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const summary = getPayloadSummary(content);

  const containerClassName =
    tone === 'error'
      ? 'rounded-xl border border-rose-200 bg-rose-50'
      : 'rounded-xl border border-slate-200 bg-slate-50';
  const previewClassName =
    tone === 'error' ? 'text-rose-700' : 'text-slate-500';
  const preClassName =
    tone === 'error'
      ? 'overflow-x-auto rounded-b-xl border-t border-rose-200 bg-rose-50 p-3 text-xs text-rose-800'
      : 'overflow-x-auto rounded-b-xl border-t border-slate-200 bg-slate-950 p-3 text-xs text-slate-100';

  return (
    <div className={containerClassName}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-3 py-2 text-left"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-700">{title}</div>
          <div className={`mt-1 truncate text-xs ${previewClassName}`}>{summary}</div>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-500">
          {isOpen ? 'Hide' : 'Show'}
        </span>
      </button>
      {isOpen && <pre className={preClassName}>{content}</pre>}
    </div>
  );
}

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [summary, setSummary] = useState<DebugLogsSummary>(EMPTY_SUMMARY);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedMcpServerId, setSelectedMcpServerId] = useState('');
  const [selectedRequestType, setSelectedRequestType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSince, setSelectedSince] = useState('');
  const [selectedUntil, setSelectedUntil] = useState('');

  const loading = logsLoading || summaryLoading;

  const buildFilterParams = useCallback(() => {
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

    return params;
  }, [
    selectedMcpServerId,
    selectedProfileId,
    selectedRequestType,
    selectedSince,
    selectedStatus,
    selectedUntil,
  ]);

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await apiFetch('/api/profiles');
      if (response.ok) {
        const data = await response.json();
        setProfiles(Array.isArray(data) ? data : []);
      }
    } catch (fetchError) {
      console.error('Failed to fetch profiles:', fetchError);
    }
  }, []);

  const fetchServers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/mcp-servers');
      if (response.ok) {
        const data = await response.json();
        setServers(Array.isArray(data) ? data : []);
      }
    } catch (fetchError) {
      console.error('Failed to fetch MCP servers:', fetchError);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const params = buildFilterParams();
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
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setLogsLoading(false);
    }
  }, [buildFilterParams, limit, page]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const params = buildFilterParams();
      const suffix = params.toString();
      const response = await apiFetch(
        suffix ? `/api/debug/logs/summary?${suffix}` : '/api/debug/logs/summary'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch debug log summary');
      }

      const data = (await response.json()) as DebugLogsSummary;
      setSummary({
        ...EMPTY_SUMMARY,
        ...data,
        overview: {
          ...EMPTY_SUMMARY.overview,
          ...(data.overview ?? {}),
        },
        timeseries: Array.isArray(data.timeseries) ? data.timeseries : [],
        statusBreakdown: Array.isArray(data.statusBreakdown) ? data.statusBreakdown : [],
        requestTypeBreakdown: Array.isArray(data.requestTypeBreakdown)
          ? data.requestTypeBreakdown
          : [],
        serverBreakdown: Array.isArray(data.serverBreakdown) ? data.serverBreakdown : [],
        latencyBuckets: Array.isArray(data.latencyBuckets)
          ? data.latencyBuckets
          : EMPTY_SUMMARY.latencyBuckets,
      });
      setError(null);
    } catch (fetchError) {
      setSummary(EMPTY_SUMMARY);
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setSummaryLoading(false);
    }
  }, [buildFilterParams]);

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
        await Promise.all([fetchLogs(), fetchSummary()]);
      }
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Failed to clear logs');
    } finally {
      setClearing(false);
    }
  }, [
    fetchLogs,
    fetchSummary,
    page,
    selectedMcpServerId,
    selectedProfileId,
  ]);

  useEffect(() => {
    fetchProfiles();
    fetchServers();
  }, [fetchProfiles, fetchServers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      void fetchLogs();
      void fetchSummary();
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs, fetchSummary]);

  const profileById = useMemo(() => {
    return new Map(profiles.map((profile) => [profile.id, profile.name]));
  }, [profiles]);

  const serverById = useMemo(() => {
    return new Map(servers.map((server) => [server.id, server.name]));
  }, [servers]);

  const requestTypeOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of summary.requestTypeBreakdown) {
      options.add(item.requestType);
    }
    for (const log of logs) {
      options.add(log.requestType);
    }
    if (selectedRequestType) {
      options.add(selectedRequestType);
    }

    return Array.from(options).sort((left, right) => left.localeCompare(right));
  }, [logs, selectedRequestType, summary.requestTypeBreakdown]);

  const filterChips = useMemo(() => {
    const chips = [
      {
        label: 'Profile',
        value:
          selectedProfileId === ''
            ? 'All profiles'
            : profileById.get(selectedProfileId) ?? selectedProfileId,
      },
      {
        label: 'Server',
        value:
          selectedMcpServerId === ''
            ? 'All servers'
            : serverById.get(selectedMcpServerId) ?? selectedMcpServerId,
      },
      {
        label: 'Request',
        value: selectedRequestType || 'All request types',
      },
      {
        label: 'Status',
        value: selectedStatus || 'All statuses',
      },
    ];

    if (selectedSince) {
      chips.push({
        label: 'Since',
        value: new Date(selectedSince).toLocaleString(),
      });
    }

    if (selectedUntil) {
      chips.push({
        label: 'Until',
        value: new Date(selectedUntil).toLocaleString(),
      });
    }

    return chips;
  }, [
    profileById,
    selectedMcpServerId,
    selectedProfileId,
    selectedRequestType,
    selectedSince,
    selectedStatus,
    selectedUntil,
    serverById,
  ]);

  const formatDate = (timestamp: number | string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined || ms === null) {
      return 'N/A';
    }

    return `${ms}ms`;
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const getDurationColor = (ms?: number) => {
    if (ms === undefined || ms === null) {
      return 'text-slate-500';
    }
    if (ms < 100) {
      return 'text-emerald-600';
    }
    if (ms < 500) {
      return 'text-amber-600';
    }
    return 'text-rose-600';
  };

  const getStatusColor = (status: DebugLog['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="p-4">Loading debug logs...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Debug Logs</h2>
        <p className="text-sm text-slate-500">
          Explore raw MCP traffic and a high-level story of what your gateway has been doing.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Error: {error}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-base">Filters</CardTitle>
              <span className="text-sm text-slate-500">
                {total} log{total !== 1 ? 's' : ''} total
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip) => (
                <Badge key={`${chip.label}-${chip.value}`} variant="outline" className="border-slate-200 text-slate-600">
                  {chip.label}: {chip.value}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="rounded border-slate-300"
              />
              Auto-refresh
            </label>
            <Button type="button" variant="outline" onClick={() => Promise.all([fetchLogs(), fetchSummary()])}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearLogs}
              disabled={clearing || logs.length === 0}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? 'Clearing...' : 'Clear Logs'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="filter-profile" className="mb-1 block text-xs font-medium text-slate-600">
                Profile
              </label>
              <select
                id="filter-profile"
                value={selectedProfileId}
                onChange={(event) => {
                  setPage(1);
                  setSelectedProfileId(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              <label htmlFor="filter-server" className="mb-1 block text-xs font-medium text-slate-600">
                MCP Server
              </label>
              <select
                id="filter-server"
                value={selectedMcpServerId}
                onChange={(event) => {
                  setPage(1);
                  setSelectedMcpServerId(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Request Type
              </label>
              <select
                id="filter-request-type"
                value={selectedRequestType}
                onChange={(event) => {
                  setPage(1);
                  setSelectedRequestType(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                {requestTypeOptions.map((requestType) => (
                  <option key={requestType} value={requestType}>
                    {requestType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-status" className="mb-1 block text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(event) => {
                  setPage(1);
                  setSelectedStatus(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-since" className="mb-1 block text-xs font-medium text-slate-600">
                Since
              </label>
              <input
                id="filter-since"
                type="datetime-local"
                value={selectedSince}
                onChange={(event) => {
                  setPage(1);
                  setSelectedSince(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="filter-until" className="mb-1 block text-xs font-medium text-slate-600">
                Until
              </label>
              <input
                id="filter-until"
                type="datetime-local"
                value={selectedUntil}
                onChange={(event) => {
                  setPage(1);
                  setSelectedUntil(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="filter-limit" className="mb-1 block text-xs font-medium text-slate-600">
                Page Size
              </label>
              <select
                id="filter-limit"
                value={limit}
                onChange={(event) => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DebugLogsOverview
            summary={summary}
            filterChips={filterChips}
            onInspectEvents={() => setActiveTab('events')}
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          {logs.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="py-12 text-center text-slate-500">
                No debug logs found. Debug logs viewer will display logs here when they are
                available.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const profileName =
                  log.profile?.name ??
                  (log.profileId ? profileById.get(log.profileId) : undefined) ??
                  log.profileId ??
                  'N/A';
                const serverName =
                  log.mcpServer?.name ??
                  (log.mcpServerId ? serverById.get(log.mcpServerId) : undefined);

                return (
                  <Card key={log.id} className="border-slate-200 shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getStatusColor(log.status)}>{log.status}</Badge>
                            <Badge variant="outline" className="border-slate-200 text-slate-600">
                              {serverName ? 'Server' : 'Profile'}
                            </Badge>
                            <span className="text-sm font-medium text-slate-700">
                              {log.requestType}
                            </span>
                            {log.durationMs !== undefined && (
                              <span className={`text-xs font-medium ${getDurationColor(log.durationMs)}`}>
                                {formatDuration(log.durationMs)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            Profile: {profileName}
                            {serverName && ` • Server: ${serverName}`}
                            {` • ${formatDate(log.createdAt)}`}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <PayloadPanel title="Request" content={formatJson(log.requestPayload)} />

                        {log.responsePayload && (
                          <PayloadPanel
                            title="Response"
                            content={formatJson(log.responsePayload)}
                          />
                        )}

                        {log.errorMessage && (
                          <PayloadPanel title="Error" content={log.errorMessage} tone="error" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

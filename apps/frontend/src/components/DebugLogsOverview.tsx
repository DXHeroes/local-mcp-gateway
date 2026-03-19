import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@dxheroes/local-mcp-ui';
import { Activity, ArrowRight, Gauge, Radar, Server, TimerReset } from 'lucide-react';

export interface DebugLogsSummary {
  overview: {
    totalLogs: number;
    successCount: number;
    errorCount: number;
    pendingCount: number;
    errorRate: number;
    avgDurationMs: number;
    p95DurationMs: number;
    uniqueProfiles: number;
    uniqueServers: number;
  };
  timeBucket: 'hour' | 'day';
  timeseries: Array<{
    timestamp: string;
    total: number;
    success: number;
    error: number;
    pending: number;
  }>;
  statusBreakdown: Array<{
    status: 'pending' | 'success' | 'error';
    count: number;
  }>;
  requestTypeBreakdown: Array<{
    requestType: string;
    count: number;
    errorRate: number;
    avgDurationMs: number;
  }>;
  serverBreakdown: Array<{
    mcpServerId: string | null;
    name: string;
    count: number;
    errorRate: number;
    avgDurationMs: number;
  }>;
  latencyBuckets: Array<{
    label: string;
    count: number;
  }>;
}

interface DebugLogsOverviewProps {
  summary: DebugLogsSummary;
  filterChips: Array<{ label: string; value: string }>;
  onInspectEvents: () => void;
}

interface TrendPoint {
  x: number;
  y: number;
}

const STATUS_COLORS: Record<string, string> = {
  success: '#0f766e',
  error: '#dc2626',
  pending: '#d97706',
};

const KPI_ITEMS = [
  {
    label: 'Success Rate',
    description: 'Healthy MCP traffic share',
    icon: Activity,
    valueKey: 'successRate',
  },
  {
    label: 'Average Latency',
    description: 'Median-ish feel of responses',
    icon: TimerReset,
    valueKey: 'avgDurationMs',
  },
  {
    label: 'P95 Latency',
    description: 'Tail latency for the slowest calls',
    icon: Gauge,
    valueKey: 'p95DurationMs',
  },
  {
    label: 'Unique Servers',
    description: 'Distinct MCP targets in the window',
    icon: Server,
    valueKey: 'uniqueServers',
  },
] as const;

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatDuration(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}s`;
  }

  return `${Math.round(value)}ms`;
}

function formatTimestamp(timestamp: string, bucket: 'hour' | 'day') {
  const date = new Date(timestamp);

  return bucket === 'hour'
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function buildTrendPoints(values: number[], width: number, height: number): TrendPoint[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length === 1) {
    return [{ x: width / 2, y: height / 2 }];
  }

  const maxValue = Math.max(...values, 1);
  const stepX = width / (values.length - 1);

  return values.map((value, index) => ({
    x: index * stepX,
    y: height - (value / maxValue) * height,
  }));
}

function linePath(points: TrendPoint[]) {
  if (points.length === 0) {
    return '';
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function areaPath(points: TrendPoint[], width: number, height: number) {
  if (points.length === 0) {
    return '';
  }

  return `${linePath(points)} L ${width} ${height} L 0 ${height} Z`;
}

function buildDonutSegments(items: Array<{ value: number; color: string }>) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const circumference = 2 * Math.PI * 42;
  let offset = 0;

  return items.map((item) => {
    const ratio = total === 0 ? 0 : item.value / total;
    const strokeLength = ratio * circumference;
    const segment = {
      ...item,
      circumference,
      strokeLength,
      strokeOffset: -offset,
    };
    offset += strokeLength;
    return segment;
  });
}

function OverviewHero({
  summary,
  filterChips,
  onInspectEvents,
}: DebugLogsOverviewProps) {
  const totalLogs = formatCompactNumber(summary.overview.totalLogs);
  const successRate = formatPercent(100 - summary.overview.errorRate);

  return (
    <Card className="overflow-hidden border-slate-200 bg-slate-950 text-slate-50 shadow-xl">
      <CardContent className="relative p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.35),transparent_32%),radial-gradient(circle_at_85%_20%,_rgba(34,197,94,0.24),transparent_28%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(15,23,42,0.92))]" />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10">
                Snapshot-ready
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/80">
                {summary.timeBucket === 'hour' ? 'Hourly pulse' : 'Daily pulse'}
              </Badge>
            </div>
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80">Log Pulse</p>
              <div className="flex flex-wrap items-end gap-4">
                <h3 className="text-6xl font-semibold tracking-tight sm:text-7xl">{totalLogs}</h3>
                <div className="pb-2 text-sm text-slate-300">
                  total requests across {summary.overview.uniqueProfiles} profile
                  {summary.overview.uniqueProfiles === 1 ? '' : 's'}
                </div>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                High-signal view of throughput, stability, latency and top MCP traffic slices for
                your current filters.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip) => (
                <div
                  key={`${chip.label}-${chip.value}`}
                  className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-slate-200"
                >
                  <span className="text-slate-400">{chip.label}:</span> {chip.value}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="bg-white text-slate-950 hover:bg-slate-100"
                onClick={onInspectEvents}
              >
                Inspect Events
                <ArrowRight />
              </Button>
              <div className="text-sm text-slate-300">
                Success rate <span className="font-semibold text-white">{successRate}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {KPI_ITEMS.map((item) => {
              const Icon = item.icon;
              let value = '';

              if (item.valueKey === 'successRate') {
                value = successRate;
              } else if (item.valueKey === 'avgDurationMs') {
                value = formatDuration(summary.overview.avgDurationMs);
              } else if (item.valueKey === 'p95DurationMs') {
                value = formatDuration(summary.overview.p95DurationMs);
              } else {
                value = formatCompactNumber(summary.overview.uniqueServers);
              }

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <Icon className="h-4 w-4 text-sky-200" />
                  </div>
                  <div className="text-3xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrafficOverTimeCard({ summary }: { summary: DebugLogsSummary }) {
  const chartWidth = 560;
  const chartHeight = 180;
  const values = summary.timeseries.map((point) => point.total);
  const successValues = summary.timeseries.map((point) => point.success);
  const points = buildTrendPoints(values, chartWidth, chartHeight);
  const successPoints = buildTrendPoints(successValues, chartWidth, chartHeight);
  const maxValue = Math.max(...values, 1);
  const fallbackTimestamp = summary.timeseries[0]?.timestamp ?? new Date(0).toISOString();

  return (
    <Card className="border-slate-200 shadow-sm lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Traffic Over Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.timeseries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No events in the current window yet.
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full">
                <defs>
                  <linearGradient id="trafficArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => {
                  const y = (chartHeight / 3) * line;
                  return (
                    <line
                      key={line}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#dbeafe"
                      strokeDasharray="4 6"
                    />
                  );
                })}
                <path d={areaPath(points, chartWidth, chartHeight)} fill="url(#trafficArea)" />
                <path
                  d={linePath(points)}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
                <path
                  d={linePath(successPoints)}
                  fill="none"
                  stroke="#14b8a6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  strokeDasharray="10 8"
                />
                {points.map((point, index) => (
                  <g key={`${point.x}-${point.y}`}>
                    <circle cx={point.x} cy={point.y} r="4" fill="#0ea5e9" />
                    <circle cx={point.x} cy={point.y} r="8" fill="#0ea5e9" fillOpacity="0.12" />
                    <text
                      x={point.x}
                      y={chartHeight + 18}
                      textAnchor="middle"
                      className="fill-slate-500 text-[11px]"
                    >
                      {formatTimestamp(summary.timeseries[index]?.timestamp ?? fallbackTimestamp, summary.timeBucket)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-sky-50 p-4">
                <div className="text-xs uppercase tracking-wide text-sky-700">Peak volume</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCompactNumber(maxValue)}
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-xs uppercase tracking-wide text-emerald-700">
                  Success window
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCompactNumber(
                    summary.timeseries.reduce((sum, point) => sum + point.success, 0)
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-xs uppercase tracking-wide text-amber-700">Error window</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCompactNumber(
                    summary.timeseries.reduce((sum, point) => sum + point.error, 0)
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusMixCard({ summary }: { summary: DebugLogsSummary }) {
  const segments = buildDonutSegments(
    summary.statusBreakdown.map((item) => ({
      value: item.count,
      color: STATUS_COLORS[item.status] ?? '#94a3b8',
    }))
  );
  const total = summary.statusBreakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Status Mix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-48 w-48">
            <circle cx="60" cy="60" r="42" fill="none" stroke="#e2e8f0" strokeWidth="12" />
            {segments.map((segment, index) => (
              <circle
                key={index}
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${segment.strokeLength} ${segment.circumference}`}
                strokeDashoffset={segment.strokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            ))}
            <text x="60" y="56" textAnchor="middle" className="fill-slate-500 text-[10px] uppercase">
              total
            </text>
            <text x="60" y="72" textAnchor="middle" className="fill-slate-900 text-[18px] font-semibold">
              {formatCompactNumber(total)}
            </text>
          </svg>
        </div>
        <div className="space-y-3">
          {summary.statusBreakdown.map((item) => (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                />
                <span className="capitalize">{item.status}</span>
              </div>
              <div className="text-sm font-medium text-slate-900">
                {formatCompactNumber(item.count)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RequestTypeCard({ summary }: { summary: DebugLogsSummary }) {
  const topRequestTypes = summary.requestTypeBreakdown.slice(0, 5);
  const maxCount = Math.max(...topRequestTypes.map((item) => item.count), 1);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Request Type Volume</CardTitle>
          <Radar className="h-4 w-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topRequestTypes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Request type breakdown will appear once traffic is captured.
          </div>
        ) : (
          topRequestTypes.map((item) => (
            <div key={item.requestType} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{item.requestType}</div>
                  <div className="text-xs text-slate-500">
                    {formatPercent(item.errorRate)} errors · {formatDuration(item.avgDurationMs)}
                  </div>
                </div>
                <div className="font-semibold text-slate-900">{formatCompactNumber(item.count)}</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LatencyBucketsCard({ summary }: { summary: DebugLogsSummary }) {
  const maxCount = Math.max(...summary.latencyBuckets.map((item) => item.count), 1);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Latency Shape</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-44 items-end gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          {summary.latencyBuckets.map((bucket) => (
            <div key={bucket.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="text-xs font-medium text-slate-500">{bucket.count}</div>
              <div className="flex h-28 w-full items-end">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-500 to-teal-300"
                  style={{
                    height: `${Math.max(12, (bucket.count / maxCount) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-center text-[11px] text-slate-500">{bucket.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ServerBreakdownCard({ summary }: { summary: DebugLogsSummary }) {
  const topServers = summary.serverBreakdown.slice(0, 5);

  return (
    <Card className="border-slate-200 shadow-sm lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Server Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        {topServers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No server-level traffic in the current filter set.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {topServers.map((server) => (
              <div
                key={`${server.mcpServerId ?? 'profile'}-${server.name}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{server.name}</div>
                    <div className="text-xs text-slate-500">
                      {server.mcpServerId ? 'Connected MCP server' : 'Profile-level aggregation'}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {formatCompactNumber(server.count)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Error rate</span>
                    <span className="font-medium text-slate-900">
                      {formatPercent(server.errorRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average latency</span>
                    <span className="font-medium text-slate-900">
                      {formatDuration(server.avgDurationMs)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DebugLogsOverview(props: DebugLogsOverviewProps) {
  return (
    <div className="space-y-6">
      <OverviewHero {...props} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TrafficOverTimeCard summary={props.summary} />
        <StatusMixCard summary={props.summary} />
        <RequestTypeCard summary={props.summary} />
        <LatencyBucketsCard summary={props.summary} />
        <ServerBreakdownCard summary={props.summary} />
      </div>
    </div>
  );
}

# Add OpenTelemetry export for telemetry visualization in Grafana

**Labels**: `enhancement`, `telemetry`

## Summary

Export MCP Gateway telemetry data via OpenTelemetry (OTEL) to enable visualization in Grafana.

## Background

Currently, telemetry data is only available through the built-in debug logs (Traces) UI. For enterprise deployments, teams need to view this data in their existing Grafana dashboards.

## Requirements

- Export trace data (MCP requests/responses) to OTEL collector
- Export metrics (request counts, latencies, error rates, tool usage)
- Support configurable OTEL endpoint via environment variable
- Maintain backwards compatibility with existing debug logs

## Technical Considerations

- Use `@opentelemetry/sdk-node` and related packages
- Integrate with existing `DebugService` to avoid duplicate logging
- Add `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable
- Consider span context propagation for distributed tracing
- Export semantic conventions for MCP operations

## Acceptance Criteria

- [ ] MCP requests appear as traces in Grafana Tempo
- [ ] Metrics dashboard shows request volume, latency percentiles, error rates
- [ ] Documentation for OTEL configuration

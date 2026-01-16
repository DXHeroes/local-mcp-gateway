# Health Module

## Description

Health check endpoints for monitoring application status. Used by container orchestrators and load balancers.

## Contents

- `health.module.ts` - Module definition
- `health.controller.ts` - Health check endpoints

## Key Endpoints

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe (database connection)

## Key Concepts

- **Liveness**: Application is running
- **Readiness**: Application can serve traffic
- **Docker**: Used by Docker health checks
- **Kubernetes**: Compatible with K8s probes

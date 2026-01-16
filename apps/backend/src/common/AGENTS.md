# Common Directory

## Description

Shared utilities and cross-cutting concerns for the NestJS backend. Contains reusable decorators, filters, interceptors, and pipes.

## Subdirectories

- `decorators/` - Custom decorators for route handlers
- `filters/` - Exception filters for error handling
- `interceptors/` - Request/response interceptors (logging, timeout)
- `pipes/` - Validation pipes for input transformation

## Key Concepts

- Common utilities are used across all modules
- Filters handle uncaught exceptions globally
- Interceptors can modify request/response flow
- Pipes validate and transform incoming data

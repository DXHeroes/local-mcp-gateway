# Architecture Overview

This document explains the high-level architecture of the Local MCP Proxy Server.

## Component Diagram

```mermaid
graph TB
    subgraph "Clients (AI)"
        Claude[Claude Desktop/Code]
        Cursor[Cursor IDE]
    end

    subgraph "Local MCP Proxy"
        Proxy[Proxy Server<br/>(Express.js)]
        FE[Frontend<br/>(React)]
        DB[(SQLite DB)]
        
        Proxy -- Reads/Writes --> DB
        FE -- REST API --> Proxy
    end

    subgraph "MCP Servers"
        RemoteHTTP[Remote HTTP Server]
        RemoteSSE[Remote SSE Server]
        Stdio[External Process<br/>(Stdio)]
        Custom[Custom TS Module]
    end

    subgraph "Tunneling"
        LocalTunnel[localtunnel]
    end

    %% Flows
    Claude -- HTTPS (Public URL) --> LocalTunnel
    LocalTunnel -- HTTP (3001) --> Proxy
    Cursor -- HTTP (3001) --> Proxy

    Proxy -- HTTP/SSE --> RemoteHTTP
    Proxy -- SSE --> RemoteSSE
    Proxy -- Stdio --> Stdio
    Proxy -- Direct Call --> Custom

    classDef client fill:#e1f5fe,stroke:#01579b
    classDef server fill:#e8f5e9,stroke:#2e7d32
    classDef mcp fill:#fff3e0,stroke:#33691e
    
    class Claude,Cursor client
    class Proxy,FE,DB,LocalTunnel server
    class RemoteHTTP,RemoteSSE,Stdio,Custom mcp
```

## Request Flow

When an AI client requests a list of tools or calls a tool, the request flows through the Proxy:

```mermaid
sequenceDiagram
    participant AI as AI Client (Claude)
    participant P as Proxy Handler
    participant S as MCP Server (Target)

    AI->>P: JSON-RPC Request (call_tool)
    Note over AI,P: Header: Authorization: Bearer <key>
    
    P->>P: Validate Request & Auth
    P->>P: Resolve Target Server (Routing)
    
    opt OAuth Required
        P->>P: Inject OAuth Access Token
    end

    P->>S: Forwarded Request
    S-->>P: Tool Result
    
    P-->>AI: JSON-RPC Response
```


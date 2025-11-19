# Docker Image Tagging Strategy

## Overview
Docker images jsou verzovány podle typu buildu:

### 🔧 Development Builds (Push do main)
**Workflow**: `ci-cd.yml`  
**Tags**: 
- `dxheroes/local-mcp-gateway-backend:abc123` (SHA only)
- `dxheroes/local-mcp-gateway-frontend:abc123` (SHA only)

**Použití**: Staging, development, testing  
**Trigger**: Každý push do `main` branch

### 🚀 Production Builds (Release)
**Workflow**: `release-please.yml`  
**Tags**:
- `dxheroes/local-mcp-gateway-backend:latest` ⭐
- `dxheroes/local-mcp-gateway-backend:v0.2.0` (version)
- `dxheroes/local-mcp-gateway-backend:abc123` (SHA)

**Použití**: Production deployment  
**Trigger**: Merge Release PR

## Deployment Strategie

### Development/Staging
```bash
# Pull konkrétní commit pro testing
docker pull dxheroes/local-mcp-gateway-backend:abc123
```

### Production
```bash
# Pull latest stable release
docker pull dxheroes/local-mcp-gateway-backend:latest

# Nebo konkrétní verzi
docker pull dxheroes/local-mcp-gateway-backend:v0.2.0
```

## Rollback
```bash
# Rollback na předchozí verzi
docker pull dxheroes/local-mcp-gateway-backend:v0.1.9

# Nebo na konkrétní commit
docker pull dxheroes/local-mcp-gateway-backend:def456
```

## Výhody tohoto setup

✅ **Jasné oddělení**: `latest` = production, SHA = staging  
✅ **Semantic versioning**: Version tagy odpovídají npm verzím  
✅ **Bezpečné testování**: Staging buildy nejsou označeny jako latest  
✅ **Rollback možnosti**: SHA tagy umožňují rollback na jakýkoliv commit  
✅ **Konzistence**: Docker verze = NPM verze

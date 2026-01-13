# Docker Quick Start Guide

Run Local MCP Gateway using Docker without cloning the repository.

## Quick Start

```bash
# Download docker-compose file
curl -fsSL https://raw.githubusercontent.com/DXHeroes/local-mcp-gateway/main/docker-compose.hub.yml -o local-mcp-gateway.yml && docker compose -f local-mcp-gateway.yml up -d
```

That's it! The gateway is now running.

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Web UI** | http://localhost:9630 | Manage profiles, servers, and view logs |
| **MCP Endpoint** | http://localhost:9631/api/mcp/default | Default profile MCP endpoint |
| **Health Check** | http://localhost:9631/api/health | Backend health status |

## Ports

The gateway uses non-standard ports to avoid conflicts with common development servers:

- **9630** - Frontend (Web UI)
- **9631** - Backend (API & MCP endpoints)

## Data Persistence

All data is stored in your home directory:

- **Linux/Mac**: `~/.local-mcp-gateway-data/`
- **Windows**: `C:\Users\<username>\.local-mcp-gateway-data\`

The database (`local-mcp-gateway.db`) is created automatically on first run.

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Restart services
docker compose restart

# Update to latest version
docker compose pull
docker compose up -d
```

## Using with AI Tools

### Claude Desktop / Cursor

Add your profile's MCP endpoint to your AI tool configuration:

**For local use:**
```json
{
  "mcpServers": {
    "local-gateway": {
      "url": "http://localhost:9631/api/mcp/default"
    }
  }
}
```

**For HTTPS (required by some tools):**

If your AI tool requires HTTPS, you can use a tunnel service like `localtunnel`:

```bash
# Install localtunnel
npm install -g localtunnel

# Create tunnel to backend
lt --port 9631
```

Then use the provided HTTPS URL in your configuration.

## Creating Profiles

1. Open the Web UI at http://localhost:9630
2. Go to "Profiles"
3. Click "Create Profile"
4. Add MCP servers to your profile
5. Use the profile's MCP endpoint: `http://localhost:9631/api/mcp/<profile-name>`

## Troubleshooting

### Container won't start

Check if ports are already in use:

```bash
# Check port 9630
lsof -i :9630

# Check port 9631
lsof -i :9631
```

### Database issues

Reset the database:

```bash
# Stop services
docker compose down

# Remove database
rm ~/.local-mcp-gateway-data/local-mcp-gateway.db

# Start services (database will be recreated)
docker compose up -d
```

### View detailed logs

```bash
docker compose logs -f --tail=100
```

### Check container health

```bash
docker compose ps
```

## Configuration

The Docker setup requires no configuration. If you need to customize:

### Using different ports

Create a custom `docker-compose.override.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:3001"  # Custom backend port
  frontend:
    ports:
      - "8000:80"    # Custom frontend port
```

Note: If you change the backend port, you'll need to rebuild the frontend with the correct `VITE_API_URL`.

### Using a different data directory

```yaml
services:
  backend:
    volumes:
      - /custom/path:/data
```

## Building from Source

If you want to build images locally instead of using Docker Hub:

```bash
# Clone the repository
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway

# Build and run
docker compose up -d --build
```

This uses `docker-compose.yml` which builds from source and uses ports 3000/3001.

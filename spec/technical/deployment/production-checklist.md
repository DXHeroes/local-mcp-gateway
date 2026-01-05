# Production Checklist

Checklist for deploying Local MCP Gateway to production.

## Overview

This checklist ensures a secure, reliable production deployment.

---

## Pre-Deployment

### Security

- [ ] **Generate encryption key**
  ```bash
  openssl rand -hex 32
  ```
  Set as `OAUTH_ENCRYPTION_KEY`

- [ ] **Configure CORS**
  ```bash
  ALLOWED_ORIGINS=https://your-domain.com
  ```

- [ ] **Enable HTTPS**
  - Use reverse proxy with SSL certificate
  - Or use HTTPS tunnel for OAuth callbacks

- [ ] **Review MCP servers**
  - Only add trusted servers
  - Verify OAuth configurations
  - Check API key security

### Configuration

- [ ] **Set production mode**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Configure logging**
  ```bash
  LOG_LEVEL=info
  LOG_FORMAT=json
  ```

- [ ] **Set rate limiting**
  ```bash
  RATE_LIMIT_WINDOW=60000
  RATE_LIMIT_MAX=100
  ```

- [ ] **Configure database path**
  ```bash
  DATABASE_PATH=/data/local-mcp-gateway.db
  ```

---

## Infrastructure

### Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 512MB | 1GB |
| Disk | 1GB | 5GB |
| Node.js | 20.x | Latest LTS |

### Network

- [ ] **Ports accessible**
  - 3001 (Backend API)
  - 3000 (Frontend) or served via reverse proxy

- [ ] **Firewall configured**
  - Allow inbound on configured ports
  - Block unnecessary ports

- [ ] **DNS configured**
  - A/AAAA records pointing to server
  - SSL certificate covers domain

---

## HTTPS Setup

### Option 1: Reverse Proxy (Recommended)

```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate /etc/ssl/certs/mcp.example.com.crt;
    ssl_certificate_key /etc/ssl/private/mcp.example.com.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /mcp {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### Option 2: Let's Encrypt with Caddy

```caddy
mcp.example.com {
    reverse_proxy /api/* localhost:3001
    reverse_proxy /mcp/* localhost:3001
    reverse_proxy /* localhost:3000
}
```

---

## Database

### Backup Strategy

- [ ] **Regular backups scheduled**
  ```bash
  # Daily backup cron job
  0 2 * * * /backup/backup-mcp.sh
  ```

- [ ] **Backup script**
  ```bash
  #!/bin/bash
  DATE=$(date +%Y%m%d)
  DB_PATH="/data/local-mcp-gateway.db"
  BACKUP_DIR="/backup"

  sqlite3 $DB_PATH "PRAGMA wal_checkpoint(TRUNCATE);"
  cp $DB_PATH $BACKUP_DIR/mcp-$DATE.db
  gzip $BACKUP_DIR/mcp-$DATE.db

  # Keep last 7 days
  find $BACKUP_DIR -name "mcp-*.db.gz" -mtime +7 -delete
  ```

- [ ] **Backup tested**
  - Restore works
  - Data integrity verified

### Permissions

- [ ] **Database file permissions**
  ```bash
  chmod 600 /data/local-mcp-gateway.db
  chown app-user:app-group /data/local-mcp-gateway.db
  ```

---

## Monitoring

### Health Checks

- [ ] **Health endpoint monitored**
  ```bash
  curl https://mcp.example.com/api/health
  ```

- [ ] **Uptime monitoring configured**
  - Pingdom, UptimeRobot, or similar
  - Alert on downtime

### Logging

- [ ] **Log aggregation**
  - Ship logs to central system
  - ELK, Loki, or cloud logging

- [ ] **Log rotation**
  ```yaml
  # Docker logging
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "5"
  ```

### Metrics

- [ ] **Resource monitoring**
  - CPU usage
  - Memory usage
  - Disk space
  - Network I/O

---

## Process Management

### Systemd Service

```ini
# /etc/systemd/system/local-mcp-gateway.service
[Unit]
Description=Local MCP Gateway
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/local-mcp-gateway
ExecStart=/usr/bin/node apps/backend/dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=/etc/local-mcp-gateway/env

[Install]
WantedBy=multi-user.target
```

### Docker

- [ ] **Restart policy**
  ```yaml
  restart: unless-stopped
  ```

- [ ] **Resource limits**
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
  ```

---

## OAuth Configuration

### Provider Setup

For each OAuth provider:

- [ ] **Production OAuth app created**
- [ ] **Correct redirect URIs configured**
  ```
  https://mcp.example.com/api/oauth/callback
  ```
- [ ] **Client credentials secured**
  - Stored in environment variables
  - Not in code or config files

### Testing

- [ ] **OAuth flow tested**
  - Authorization works
  - Token refresh works
  - Token encryption works

---

## Security Hardening

### Application

- [ ] **Dependencies updated**
  ```bash
  pnpm audit
  pnpm update
  ```

- [ ] **No sensitive data in logs**
- [ ] **Error messages don't leak info**

### Server

- [ ] **SSH key authentication only**
- [ ] **Firewall enabled**
- [ ] **Automatic security updates**

### Network

- [ ] **TLS 1.2+ only**
- [ ] **Strong cipher suites**
- [ ] **HSTS enabled**

---

## Documentation

- [ ] **Runbook created**
  - How to restart
  - How to check logs
  - Common issues and fixes

- [ ] **Contact information**
  - Who to contact for issues
  - Escalation procedures

---

## Final Verification

### Functional Testing

- [ ] Frontend loads
- [ ] Can create profile
- [ ] Can add MCP server
- [ ] OAuth flow works
- [ ] MCP tools accessible

### Performance Testing

- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] Handles expected load

### Security Testing

- [ ] HTTPS works
- [ ] CORS configured correctly
- [ ] Rate limiting works
- [ ] No sensitive data exposed

---

## Post-Deployment

- [ ] **Monitor for 24 hours**
- [ ] **Check logs for errors**
- [ ] **Verify backups run**
- [ ] **Document any issues**

---

## See Also

- [Docker Deployment](./docker.md) - Docker guide
- [Environment Variables](../configuration/environment-variables.md) - Configuration
- [Security Model](../architecture/security-model.md) - Security details

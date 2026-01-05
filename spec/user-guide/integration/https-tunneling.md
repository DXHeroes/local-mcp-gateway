# HTTPS Tunneling

Some features require HTTPS, especially OAuth callbacks. This guide covers setting up secure tunnels to your local gateway.

## When You Need HTTPS

HTTPS is required for:

- **OAuth callbacks** - Many OAuth providers require HTTPS redirect URIs
- **Remote access** - Accessing your local gateway from other machines
- **Production deployments** - Security best practice
- **Some MCP clients** - May require HTTPS endpoints

---

## Option 1: localtunnel (Recommended)

localtunnel provides free HTTPS tunnels to localhost.

### Quick Start

```bash
# Install localtunnel
npm install -g localtunnel

# Start tunnel to gateway backend
lt --port 3001

# Output: your url is: https://random-name.loca.lt
```

### With Subdomain

```bash
# Request specific subdomain (may not be available)
lt --port 3001 --subdomain my-mcp-gateway

# Output: https://my-mcp-gateway.loca.lt
```

### Using Built-in Script

The gateway includes an HTTPS dev script:

```bash
pnpm dev:https
```

This:
1. Starts the backend on port 3001
2. Creates a localtunnel
3. Outputs the HTTPS URL
4. Configures the frontend to use it

### Configure Clients

Use the tunnel URL in your MCP clients:

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "https://random-name.loca.lt/api/mcp/my-profile"
    }
  }
}
```

---

## Option 2: ngrok

ngrok is a more robust tunneling solution with additional features.

### Setup

1. Sign up at [ngrok.com](https://ngrok.com/)
2. Download and install ngrok
3. Configure your auth token:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

### Start Tunnel

```bash
# Basic tunnel
ngrok http 3001

# With custom subdomain (paid feature)
ngrok http 3001 --subdomain=my-gateway
```

### Output

```
Forwarding    https://abc123.ngrok.io -> http://localhost:3001
```

### Configure Clients

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "https://abc123.ngrok.io/api/mcp/my-profile"
    }
  }
}
```

---

## Option 3: Cloudflare Tunnel

Cloudflare Tunnel provides free, secure tunnels with a custom domain.

### Setup

1. Sign up for Cloudflare (free)
2. Add a domain to Cloudflare
3. Install cloudflared:
   ```bash
   # macOS
   brew install cloudflared

   # Linux
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   ```

### Create Tunnel

```bash
# Login
cloudflared login

# Create tunnel
cloudflared tunnel create mcp-gateway

# Configure DNS
cloudflared tunnel route dns mcp-gateway gateway.yourdomain.com
```

### Run Tunnel

```bash
cloudflared tunnel run mcp-gateway --url http://localhost:3001
```

### Configure Clients

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "https://gateway.yourdomain.com/api/mcp/my-profile"
    }
  }
}
```

---

## Option 4: Local SSL Certificates

For development, you can create local SSL certificates.

### Using mkcert

```bash
# Install mkcert
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Output: localhost+2.pem and localhost+2-key.pem
```

### Configure Gateway

Set environment variables:

```bash
SSL_CERT_PATH=./localhost+2.pem
SSL_KEY_PATH=./localhost+2-key.pem
```

Note: This requires gateway code changes to support HTTPS directly.

---

## OAuth Configuration

When using HTTPS tunnels, update your OAuth settings:

### Gateway OAuth Callback

Set the `APP_URL` environment variable:

```bash
APP_URL=https://your-tunnel.loca.lt
```

This ensures OAuth callbacks go to the correct URL.

### OAuth Provider Settings

Update your OAuth app's redirect URIs:

1. Go to your OAuth provider (GitHub, Google, etc.)
2. Find your OAuth app settings
3. Add the tunnel URL as an allowed redirect:
   ```
   https://your-tunnel.loca.lt/api/oauth/callback
   ```

---

## Comparison

| Feature | localtunnel | ngrok | Cloudflare |
|---------|-------------|-------|------------|
| Price | Free | Free/Paid | Free |
| Custom subdomain | Limited | Paid | Yes (with domain) |
| Stability | Good | Excellent | Excellent |
| Speed | Good | Good | Excellent |
| Persistent URL | No | Paid | Yes |
| Setup complexity | Low | Low | Medium |

---

## Security Considerations

### Public Exposure

When using tunnels, your gateway is publicly accessible:

- Anyone with the URL can access it
- No authentication by default
- Consider adding gateway authentication (future feature)

### Tunnel URL Sharing

- Don't share tunnel URLs publicly
- Tunnels are temporary (URL changes on restart)
- Use for development/testing only

### Production

For production deployments:

- Use proper SSL certificates
- Deploy behind a reverse proxy (nginx, Caddy)
- Add authentication
- Use firewall rules

---

## Troubleshooting

### Tunnel starts but connection fails

1. Verify gateway is running on correct port
2. Check tunnel output for errors
3. Test locally first: `curl http://localhost:3001/health`

### OAuth callback fails

1. Verify `APP_URL` environment variable is set
2. Check OAuth provider allows the tunnel URL
3. Ensure no trailing slash in URLs

### Tunnel disconnects frequently

localtunnel may have reliability issues:
- Try ngrok for more stability
- Use Cloudflare Tunnel for production
- Restart tunnel when disconnected

### "Not secure" warning in browser

With self-signed certificates:
- Click "Advanced" and proceed
- Or install the root CA properly

---

## Quick Reference

### localtunnel

```bash
lt --port 3001
```

### ngrok

```bash
ngrok http 3001
```

### Environment Variable

```bash
APP_URL=https://your-tunnel-url.com pnpm dev
```

### Client Config

```json
{
  "mcpServers": {
    "tools": {
      "url": "https://your-tunnel-url.com/api/mcp/profile"
    }
  }
}
```

---

## See Also

- [Claude Desktop Integration](./claude-desktop.md)
- [OAuth Setup](../authentication/oauth-setup.md)
- [Deployment Guide](../../technical/deployment/docker.md)

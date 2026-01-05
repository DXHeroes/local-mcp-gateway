# External Stdio Servers

External Stdio servers run as local processes and communicate via standard input/output streams.

## Overview

| Aspect | Details |
|--------|---------|
| Transport | stdin/stdout |
| Protocol | JSON-RPC 2.0 |
| Location | Local machine only |
| Use Case | CLI tools, local servers |

---

## How Stdio Works

### Process Lifecycle

1. Gateway spawns child process with configured command
2. JSON-RPC requests written to process stdin
3. Responses read from process stdout
4. Process remains running for session duration

### Communication Flow

```
Gateway                    Child Process
   │                            │
   │──── spawn process ────────▶│
   │                            │
   │──── JSON-RPC (stdin) ─────▶│
   │◀─── JSON-RPC (stdout) ─────│
   │                            │
   │──── JSON-RPC (stdin) ─────▶│
   │◀─── JSON-RPC (stdout) ─────│
   │                            │
   │──── terminate ────────────▶│
   │                            ✕
```

---

## Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| command | string | Executable to run |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| args | string[] | Command arguments |
| env | object | Environment variables |
| cwd | string | Working directory |

### Example Configuration

```json
{
  "name": "Local File Server",
  "type": "external",
  "config": {
    "command": "node",
    "args": ["./mcp-server.js"],
    "cwd": "/path/to/server",
    "env": {
      "NODE_ENV": "development",
      "DEBUG": "true"
    }
  }
}
```

---

## Setting Up via Web UI

### Step 1: Add Server

1. Go to **MCP Servers** → **"Add MCP Server"**
2. Enter a name (e.g., "Local Tools")
3. Select **External (Stdio)** type

### Step 2: Configure Command

**Command**: The executable to run
```
node
python
npx
./my-server
```

**Arguments**: Command-line arguments
```
["server.js", "--port", "8080"]
```

**Working Directory**: Where to run the command
```
/Users/me/projects/mcp-server
```

**Environment Variables**: Additional env vars
```json
{
  "API_KEY": "secret",
  "DEBUG": "true"
}
```

### Step 3: Create

Click **"Create"** to save the server.

---

## Common Configurations

### Node.js MCP Server

```json
{
  "command": "node",
  "args": ["dist/index.js"],
  "cwd": "/path/to/mcp-server"
}
```

### Python MCP Server

```json
{
  "command": "python",
  "args": ["-m", "mcp_server"],
  "cwd": "/path/to/python-server",
  "env": {
    "PYTHONPATH": "/path/to/libs"
  }
}
```

### npx-based Server

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
}
```

### Shell Script

```json
{
  "command": "/bin/bash",
  "args": ["./start-server.sh"],
  "cwd": "/path/to/scripts"
}
```

---

## Official MCP Servers

Anthropic provides official MCP servers that work with Stdio:

### Filesystem Server

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allow"]
}
```

### Git Server

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-git"]
}
```

### SQLite Server

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/db.sqlite"]
}
```

---

## Process Management

### Starting

Process starts when:
- Server is first accessed
- Gateway initializes the server
- Profile using this server is queried

### Stopping

Process stops when:
- Gateway shuts down
- Server is deleted
- Connection timeout (configurable)

### Restart Behavior

On process crash:
1. Gateway detects process exit
2. Marks server as disconnected
3. Next request triggers restart
4. Re-initialization occurs

---

## Environment Variables

### Inherited Variables

Child process inherits gateway's environment plus configured env vars.

### Common Variables

| Variable | Purpose |
|----------|---------|
| `PATH` | Executable search path |
| `NODE_ENV` | Node.js environment |
| `DEBUG` | Debug logging |
| `HOME` | User home directory |

### Overriding

Configured env vars override inherited ones:

```json
{
  "env": {
    "NODE_ENV": "production"  // Overrides gateway's NODE_ENV
  }
}
```

---

## Security Considerations

### Process Isolation

- Runs with gateway's user permissions
- Has access to user's filesystem
- Can execute any command user can

### Path Security

- Limit allowed paths for filesystem servers
- Don't expose sensitive directories
- Use absolute paths

### Command Validation

- Only run trusted executables
- Avoid user-provided commands
- Validate arguments

---

## Troubleshooting

### "Command not found"

**Cause**: Executable not in PATH or doesn't exist.

**Solutions**:
1. Use absolute path: `/usr/local/bin/node`
2. Check PATH includes executable's directory
3. Verify file exists and is executable

### "Permission denied"

**Cause**: No execute permission on command.

**Solutions**:
```bash
chmod +x /path/to/command
```

### "Process exited unexpectedly"

**Cause**: Server crashed or failed to start.

**Solutions**:
1. Test command manually in terminal
2. Check working directory exists
3. Verify all dependencies installed
4. Check server logs (stderr)

### "No response"

**Cause**: Server not writing to stdout correctly.

**Solutions**:
1. Ensure server writes JSON-RPC to stdout
2. Check server isn't buffering output
3. Verify JSON format is correct

### "Invalid JSON"

**Cause**: Non-JSON output mixed with responses.

**Solutions**:
1. Redirect debug output to stderr
2. Check for console.log statements
3. Ensure clean stdout

---

## Debugging

### Manual Testing

Test the command directly:

```bash
# Start server
node /path/to/server.js

# Send JSON-RPC via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node server.js
```

### Checking Stderr

Server errors go to stderr. View via:
- Gateway logs
- Process manager logs

### Process Status

Check if process is running:
```bash
ps aux | grep "mcp-server"
```

---

## Limitations

### No Remote Access

Stdio servers only work locally. For remote, use HTTP or SSE.

### Single Instance

One process per server configuration. Can't scale horizontally.

### Platform Specific

Commands may differ between platforms (Windows vs Unix).

---

## See Also

- [Custom TypeScript](./custom-typescript.md) - Alternative for custom logic
- [Remote HTTP](./remote-http.md) - For remote servers
- [MCP Servers Overview](./README.md) - All server types

import localtunnel from 'localtunnel';
import { getEnv } from './lib/env.js';

// Load environment variables
const env = getEnv();
const HTTP_PORT = env.PORT; // Default 3001

async function startTunnel() {
  console.log('🔒 Setting up secure tunnel...');

  try {
    const tunnel = await localtunnel({ port: HTTP_PORT });

    console.log('\n✅ Public HTTPS Tunnel running!');
    console.log(`👉 ${tunnel.url}`);
    console.log(`   (Tunneling to http://localhost:${HTTP_PORT})`);
    console.log(`\n⚠️  IMPORTANT: Update your mcp.json to use this URL!`);
    console.log(`   Example: "url": "${tunnel.url}/api/mcp/..."`);
    console.log(
      '\nThis URL is universally trusted (no SSL errors) and works in Claude Desktop, etc.'
    );

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

    tunnel.on('error', (err: Error) => {
      console.error('Tunnel error:', err);
    });
  } catch (error) {
    console.error('❌ Failed to start tunnel:', error);
    process.exit(1);
  }
}

// Start the tunnel
startTunnel();

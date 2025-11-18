import localtunnel from 'localtunnel';
import { getEnv } from './lib/env.js';

// Load environment variables
const env = getEnv();
const HTTP_PORT = env.PORT; // Default 3001

interface Profile {
  id: string;
  name: string;
  description?: string;
}

async function fetchProfiles(retries = 5): Promise<Profile[] | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`http://localhost:${HTTP_PORT}/api/profiles`);
      if (response.ok) {
        return (await response.json()) as Profile[];
      }
    } catch (err) {
      // Ignore error and retry
    }
    // Wait 1 second before retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
}

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

    // Fetch and display profiles
    console.log('\n⏳ Fetching profiles from backend...');
    const profiles = await fetchProfiles();

    if (profiles && profiles.length > 0) {
      console.log('\n📋 Available Profiles:');
      console.log('------------------------');
      profiles.forEach((p) => {
        console.log(`🔹 ${p.name}`);
        console.log(`   HTTP: ${tunnel.url}/api/mcp/${p.name}`);
        console.log(`   SSE:  ${tunnel.url}/api/mcp/${p.name}/sse`);
        if (p.description) console.log(`   Desc: ${p.description}`);
        console.log('');
      });
    } else if (profiles) {
      console.log('\nℹ️  No profiles found. Create one at http://localhost:3000');
    } else {
      console.log(
        '\n⚠️  Could not fetch profiles. Ensure the backend is running at http://localhost:' +
          HTTP_PORT
      );
    }

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

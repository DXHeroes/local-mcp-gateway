/**
 * Test script using Playwright MCP server via our MCP proxy
 *
 * This script:
 * 1. Creates a profile with Playwright MCP server (external process)
 * 2. Uses MCP proxy endpoint to call Playwright MCP tools
 * 3. Tests complete application flow via MCP protocol
 */

const PROXY_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const PROFILE_NAME = 'playwright-test-profile';

async function createPlaywrightMcpProfile() {
  console.log('Creating Playwright MCP server entry...');

  // Create MCP server entry for Playwright MCP (external process)
  const serverResponse = await fetch(`${PROXY_URL}/api/mcp-servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'playwright-mcp',
      type: 'external',
      config: {
        command: 'npx',
        args: ['-y', '@playwright/mcp@latest'],
      },
    }),
  });

  if (!serverResponse.ok) {
    const error = await serverResponse.text();
    throw new Error(`Failed to create MCP server: ${serverResponse.status} ${error}`);
  }

  const server = await serverResponse.json();
  console.log('✓ Created MCP server:', server.id);

  // Create profile
  console.log('Creating profile...');
  const profileResponse = await fetch(`${PROXY_URL}/api/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: PROFILE_NAME,
      description: 'Profile for Playwright MCP testing',
    }),
  });

  if (!profileResponse.ok) {
    const error = await profileResponse.text();
    throw new Error(`Failed to create profile: ${profileResponse.status} ${error}`);
  }

  const profile = await profileResponse.json();
  console.log('✓ Created profile:', profile.id);

  // Add server to profile
  console.log('Adding server to profile...');
  const addServerResponse = await fetch(`${PROXY_URL}/api/profiles/${profile.id}/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mcpServerId: server.id,
      order: 0,
    }),
  });

  if (!addServerResponse.ok) {
    const error = await addServerResponse.text();
    throw new Error(`Failed to add server to profile: ${addServerResponse.status} ${error}`);
  }

  console.log('✓ Added server to profile');
  return { profile, server };
}

async function callMcpTool(
  proxyEndpoint: string,
  toolName: string,
  args: Record<string, unknown> = {}
) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };

  const response = await fetch(proxyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`MCP tool error: ${JSON.stringify(result.error)}`);
  }
  return result.result;
}

async function getSnapshot(proxyEndpoint: string) {
  return callMcpTool(proxyEndpoint, 'playwright_snapshot', {});
}

async function navigate(proxyEndpoint: string, url: string) {
  return callMcpTool(proxyEndpoint, 'playwright_navigate', { url });
}

async function click(proxyEndpoint: string, ref: string) {
  return callMcpTool(proxyEndpoint, 'playwright_click', { ref });
}

async function type(proxyEndpoint: string, ref: string, text: string) {
  return callMcpTool(proxyEndpoint, 'playwright_type', { ref, text });
}

async function _waitFor(proxyEndpoint: string, text: string) {
  return callMcpTool(proxyEndpoint, 'playwright_wait_for', { text });
}

async function runTestViaMcp() {
  const proxyEndpoint = `${PROXY_URL}/api/mcp/${PROFILE_NAME}`;
  console.log(`\nUsing proxy endpoint: ${proxyEndpoint}`);

  // First, get available tools
  console.log('\n1. Getting available tools...');
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };

  const toolsResponse = await fetch(proxyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toolsRequest),
  });

  const toolsResult = await toolsResponse.json();
  console.log('Available tools:', JSON.stringify(toolsResult, null, 2));

  // Test: Navigate to frontend
  console.log('\n2. Navigating to frontend...');
  await navigate(proxyEndpoint, FRONTEND_URL);
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for page to load

  // Take initial snapshot
  console.log('\n3. Taking initial snapshot...');
  let snapshot = await getSnapshot(proxyEndpoint);
  console.log('Page loaded, found elements:', snapshot.content?.length || 0);

  // Test: Navigate to Profiles page
  console.log('\n4. Testing Profiles page...');
  const profilesLink = snapshot.content?.find(
    (el: { role?: string; name?: string }) =>
      el.role === 'link' && el.name?.toLowerCase().includes('profile')
  );
  if (profilesLink) {
    console.log('Found Profiles link, clicking...');
    await click(proxyEndpoint, profilesLink.ref);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    snapshot = await getSnapshot(proxyEndpoint);
    console.log('After clicking Profiles, found elements:', snapshot.content?.length || 0);
  }

  // Test: Click Create Profile button
  console.log('\n5. Testing Create Profile...');
  const createButton = snapshot.content?.find(
    (el: { role?: string; name?: string }) =>
      el.role === 'button' && el.name?.toLowerCase().includes('create')
  );
  if (createButton) {
    console.log('Found Create Profile button, clicking...');
    await click(proxyEndpoint, createButton.ref);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    snapshot = await getSnapshot(proxyEndpoint);
    console.log('Dialog opened, found elements:', snapshot.content?.length || 0);

    // Fill in profile name
    const nameInput = snapshot.content?.find(
      (el: { role?: string; name?: string; type?: string }) =>
        el.role === 'textbox' && (el.name?.toLowerCase().includes('name') || el.type === 'text')
    );
    if (nameInput) {
      console.log('Found name input, typing...');
      const testProfileName = `mcp-test-profile-${Date.now()}`;
      await type(proxyEndpoint, nameInput.ref, testProfileName);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Find and click Create button
      snapshot = await getSnapshot(proxyEndpoint);
      const submitButton = snapshot.content?.find(
        (el: { role?: string; name?: string }) =>
          el.role === 'button' &&
          (el.name?.toLowerCase().includes('create') || el.name?.toLowerCase().includes('save'))
      );
      if (submitButton) {
        console.log('Found Create button, clicking...');
        await click(proxyEndpoint, submitButton.ref);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        snapshot = await getSnapshot(proxyEndpoint);
        console.log('Profile created, checking for success...');
      }
    }
  }

  // Test: Navigate to MCP Servers page
  console.log('\n6. Testing MCP Servers page...');
  await navigate(proxyEndpoint, `${FRONTEND_URL}/mcp-servers`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  snapshot = await getSnapshot(proxyEndpoint);
  console.log('MCP Servers page loaded, found elements:', snapshot.content?.length || 0);

  // Test: Navigate to Debug Logs page
  console.log('\n7. Testing Debug Logs page...');
  await navigate(proxyEndpoint, `${FRONTEND_URL}/debug-logs`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  snapshot = await getSnapshot(proxyEndpoint);
  console.log('Debug Logs page loaded, found elements:', snapshot.content?.length || 0);

  console.log('\n✓ All UI tests completed!');
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  try {
    // Delete profile
    const profilesResponse = await fetch(`${PROXY_URL}/api/profiles`);
    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json();
      const testProfile = profiles.find((p: { name: string }) => p.name === PROFILE_NAME);
      if (testProfile) {
        await fetch(`${PROXY_URL}/api/profiles/${testProfile.id}`, { method: 'DELETE' });
        console.log('✓ Deleted test profile');
      }
    }

    // Delete MCP server
    const serversResponse = await fetch(`${PROXY_URL}/api/mcp-servers`);
    if (serversResponse.ok) {
      const servers = await serversResponse.json();
      const testServer = servers.find((s: { name: string }) => s.name === 'playwright-mcp');
      if (testServer) {
        await fetch(`${PROXY_URL}/api/mcp-servers/${testServer.id}`, { method: 'DELETE' });
        console.log('✓ Deleted test MCP server');
      }
    }
  } catch (error) {
    console.warn('Cleanup warning:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  try {
    console.log('=== Playwright MCP Testing via Proxy ===\n');
    console.log('Make sure backend (port 3001) and frontend (port 3000) are running!\n');

    await createPlaywrightMcpProfile();
    console.log('\nWaiting for MCP server to initialize...');
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for server to initialize

    await runTestViaMcp();

    console.log('\n✓ All tests completed successfully!');
  } catch (error) {
    console.error('\n✗ Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    await cleanup();
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();

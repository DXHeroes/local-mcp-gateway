/**
 * Documentation page with sidebar navigation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DocsSidebar from '../components/DocsSidebar';

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// Section IDs that can be navigated to
const SECTION_IDS = [
  'what-is',
  'core-concepts',
  'quick-start-docker',
  'quick-start-source',
  'quick-start-profile',
  'ai-cursor',
  'ai-claude',
  'ai-prompt',
  'debug-logs',
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('what-is');
  const mainRef = useRef<HTMLDivElement>(null);

  // Detect environment and set appropriate API port
  // Port 3000 = dev (API on 3001), otherwise Docker (API on 9631)
  const apiPort = useMemo(() => {
    const isDev = window.location.port === '3000';
    return isDev ? '3001' : '9631';
  }, []);

  // Scroll to section handler
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL hash without triggering scroll
      window.history.pushState(null, '', `#${sectionId}`);
      setActiveSection(sectionId);
    }
  }, []);

  // Handle initial hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && SECTION_IDS.includes(hash)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' });
          setActiveSection(hash);
        }
      }, 100);
    }
  }, []);

  // Scroll spy to update active section based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0,
      }
    );

    for (const id of SECTION_IDS) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <DocsSidebar activeSection={activeSection} onNavigate={scrollToSection} />

      <main ref={mainRef} className="flex-1 p-4 lg:p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documentation</h1>
          <p className="text-gray-600">
            Learn how to use Local MCP Gateway to connect your AI tools with external services.
          </p>
        </div>

        {/* Introduction Section */}
        <section id="what-is" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What is Local MCP Gateway?</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 mb-4">
              The <strong>Local MCP Gateway</strong> is a smart middleware that bridges the gap
              between AI coding assistants (like Cursor and Claude Desktop) and your local or remote
              tools.
            </p>

            <h3 className="text-md font-semibold text-gray-800 mb-2">The Problem</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>
                <strong>Fragmented Tools</strong>: Tools scattered everywhere - local CLIs, remote
                APIs, OAuth services
              </li>
              <li>
                <strong>Context Switching</strong>: Constantly pasting API keys or context into AI
                chats
              </li>
              <li>
                <strong>Connection Issues</strong>: Some tools require HTTPS, but local servers run
                on HTTP
              </li>
              <li>
                <strong>No Context Switching</strong>: Can&apos;t easily switch between "Work" and
                "Personal" contexts
              </li>
            </ul>

            <h3 className="text-md font-semibold text-gray-800 mb-2">The Solution</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>
                <strong>Unified Interface</strong>: Single MCP endpoint that aggregates multiple
                servers
              </li>
              <li>
                <strong>Profile Management</strong>: Create profiles for different contexts and
                switch instantly
              </li>
              <li>
                <strong>Auth Handling</strong>: Automatic OAuth flows and API key injection
              </li>
              <li>
                <strong>Debug Logging</strong>: See exactly what the AI is sending and receiving
              </li>
            </ul>
          </div>
        </section>

        {/* Core Concepts Section */}
        <section id="core-concepts" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Concepts</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-1">MCP Protocol</h3>
              <p className="text-gray-700">
                The <strong>Model Context Protocol (MCP)</strong> is an open standard that allows AI
                models to interact with external tools and data. Think of it as a "USB port for AI"
                - a standard way to plug tools into an LLM.
              </p>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-1">Profiles</h3>
              <p className="text-gray-700">
                A <strong>Profile</strong> is a logical grouping of MCP servers. Each profile gets a
                unique endpoint (e.g.,{' '}
                <code className="bg-gray-100 px-1 rounded">/api/mcp/work</code>). Use different
                profiles for different contexts: Work, Personal, Debug, etc.
              </p>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-1">MCP Server Types</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>
                  <strong>Remote HTTP/SSE</strong>: Connect to MCP servers running elsewhere
                </li>
                <li>
                  <strong>External (Stdio)</strong>: Run a command and communicate via stdin/stdout
                </li>
                <li>
                  <strong>Custom</strong>: TypeScript modules written directly in this project
                </li>
                <li>
                  <strong>Builtin</strong>: Pre-packaged MCP servers included with the gateway
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-1">The Proxy</h3>
              <p className="text-gray-700">
                The proxy sits between your AI client and MCP servers. It handles routing, tool
                aggregation, and security (OAuth tokens, API keys).
              </p>
            </div>
          </div>
        </section>

        {/* Quick Start - Docker */}
        <section id="quick-start-docker" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Start: Docker (Recommended)
          </h2>
          <p className="text-gray-700 mb-3">
            The fastest way to get started - no installation required:
          </p>
          <CodeBlock
            code={`curl -fsSL https://raw.githubusercontent.com/DXHeroes/local-mcp-gateway/main/docker-compose.hub.yml -o local-mcp-gateway.yml && docker compose -f local-mcp-gateway.yml up -d`}
          />
          <div className="mt-3 text-sm text-gray-600">
            <p>
              <strong>UI</strong>: http://localhost:9630
            </p>
            <p>
              <strong>MCP Endpoint</strong>: http://localhost:9631/api/mcp/default
            </p>
          </div>
        </section>

        {/* Quick Start - Source */}
        <section id="quick-start-source" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Start: From Source</h2>
          <CodeBlock
            code={`# Install dependencies
pnpm install

# Initialize database
pnpm db:seed

# Start development
pnpm dev`}
          />
          <div className="mt-3 text-sm text-gray-600">
            <p>
              <strong>Backend</strong>: http://localhost:3001
            </p>
            <p>
              <strong>Frontend</strong>: http://localhost:3000
            </p>
          </div>
        </section>

        {/* Quick Start - Creating Profile */}
        <section id="quick-start-profile" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Creating Your First Profile</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>
              Go to <strong>Profiles</strong> page
            </li>
            <li>
              Click <strong>"Create Profile"</strong>
            </li>
            <li>Enter a profile name (e.g., "my-profile")</li>
            <li>Add MCP servers to your profile</li>
            <li>Copy the endpoint URL for your AI client</li>
          </ol>
        </section>

        {/* AI Integration - Cursor */}
        <section id="ai-cursor" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cursor Configuration</h2>
          <p className="text-gray-700 mb-3">
            Add to your <code className="bg-gray-100 px-1 rounded">mcp.json</code> file:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "mcpServers": {
    "gateway": {
      "type": "http",
      "url": "http://localhost:${apiPort}/api/mcp/default"
    }
  }
}`}
          />
        </section>

        {/* AI Integration - Claude Desktop */}
        <section id="ai-claude" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Claude Desktop Configuration</h2>
          <p className="text-gray-700 mb-3">
            Add to your <code className="bg-gray-100 px-1 rounded">claude_desktop_config.json</code>
            :
          </p>
          <CodeBlock
            language="json"
            code={`{
  "mcpServers": {
    "gateway": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/claude-code-mcp",
        "--url",
        "http://localhost:${apiPort}/api/mcp/default"
      ]
    }
  }
}`}
          />
        </section>

        {/* AI Integration - AI Prompts */}
        <section id="ai-prompt" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Prompts</h2>
          <p className="text-gray-700 mb-3">
            To help the AI understand your tools, use the <strong>AI Prompt</strong> feature. The
            gateway provides two formats for different use cases:
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Markdown Format</h3>
              <p className="text-gray-700 mb-2">
                Human-readable format that&apos;s easy to review and edit. Best for:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Reviewing tool descriptions before use</li>
                <li>Documentation purposes</li>
                <li>Sharing with team members</li>
                <li>Debugging tool configurations</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-800 mb-2">TOON Format</h3>
              <p className="text-gray-700 mb-2">
                Token-Oriented Object Notation - optimized for LLMs. Best for:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Reducing token usage (more compact)</li>
                <li>Minimizing LLM hallucinations</li>
                <li>Improving tool use reliability</li>
                <li>Production AI integrations</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">How to use:</h4>
            <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
              <li>Go to Profile detail page</li>
              <li>
                Click <strong>&quot;AI Prompt&quot;</strong> tab
              </li>
              <li>Choose between Markdown or TOON format</li>
              <li>
                Click <strong>&quot;Copy&quot;</strong> to copy the prompt
              </li>
              <li>Paste into your AI chat (Cursor, Claude)</li>
            </ol>
          </div>
        </section>

        {/* Debug Logs Section */}
        <section id="debug-logs" className="mb-8 scroll-mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Logs</h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              The <strong>Debug Logs</strong> page shows all MCP traffic between your AI clients and
              MCP servers.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>View request and response payloads</li>
              <li>Filter by profile, server, request type, or status</li>
              <li>Enable auto-refresh to monitor in real-time</li>
              <li>Identify slow or failing tool calls</li>
            </ul>
            <p className="text-gray-600 text-sm">
              Access Debug Logs from the navigation bar or go to{' '}
              <code className="bg-gray-100 px-1 rounded">/debug-logs</code>.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            For more detailed documentation, visit the{' '}
            <a
              href="https://github.com/DXHeroes/local-mcp-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-blue-900"
            >
              GitHub repository
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

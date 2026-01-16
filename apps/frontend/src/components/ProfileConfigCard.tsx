/**
 * Profile Config Card Component
 *
 * Displays MCP server configuration in JSON format and AI prompts in Toon and Markdown formats.
 */

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Check, Copy, FileJson, FileText } from 'lucide-react';
import { useState } from 'react';
import { getProfileUrl } from '../config/api';
import { generateMarkdownPrompt, generateToonPrompt } from '../utils/promptGenerator';

interface Tool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

interface ProfileConfigCardProps {
  profileName: string;
  tools: Tool[];
}

export function ProfileConfigCard({ profileName, tools }: ProfileConfigCardProps) {
  const { toast } = useToast();
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});
  const [activePromptTab, setActivePromptTab] = useState<'markdown' | 'toon'>('markdown');

  const profileUrl = getProfileUrl(profileName);

  // Generate MCP Server JSON config
  const mcpServerConfig = JSON.stringify(
    {
      mcpServers: {
        [profileName]: {
          type: 'http',
          url: profileUrl,
        },
      },
    },
    null,
    2
  );

  // Generate prompts
  const normalizedTools: Array<{
    name: string;
    description: string;
  }> = tools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
  }));

  const toonPrompt = generateToonPrompt(profileName, profileUrl, normalizedTools);
  const markdownPrompt = generateMarkdownPrompt(profileName, profileUrl, normalizedTools);

  const handleCopy = async (key: string, content: string, description: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStates((prev) => ({ ...prev, [key]: true }));
      toast({
        title: 'Copied!',
        description,
      });
      setTimeout(() => setCopyStates((prev) => ({ ...prev, [key]: false })), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Profile Configuration</CardTitle>
        <CardDescription>MCP server configuration and AI prompts for this profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MCP Server Config */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              <FileJson className="h-3.5 w-3.5" />
              MCP Server Config
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleCopy('config', mcpServerConfig, 'MCP server config copied to clipboard')
              }
              aria-label="Copy MCP server config"
            >
              {copyStates.config ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1">{copyStates.config ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono whitespace-pre">
            {mcpServerConfig}
          </pre>
          <p className="text-xs text-muted-foreground">
            Add this configuration to your AI client settings (Claude Desktop, Cursor, etc.)
          </p>
        </div>

        {/* AI Prompts (Tabbed) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            AI Prompt
          </Label>
          <Tabs
            defaultValue="markdown"
            className="w-full"
            onValueChange={(value) => setActivePromptTab(value as 'markdown' | 'toon')}
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="toon">Toon Format</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopy(
                    'prompt',
                    activePromptTab === 'markdown' ? markdownPrompt : toonPrompt,
                    'AI prompt copied to clipboard'
                  )
                }
                aria-label="Copy AI prompt"
              >
                {copyStates.prompt ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1">{copyStates.prompt ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
            <TabsContent value="markdown">
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40 font-mono whitespace-pre-wrap">
                {markdownPrompt}
              </pre>
            </TabsContent>
            <TabsContent value="toon">
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40 font-mono whitespace-pre-wrap">
                {toonPrompt || 'No tools available'}
              </pre>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Copy this prompt to your AI assistant to inform it about available tools in this
            profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

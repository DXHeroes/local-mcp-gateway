/**
 * Gateway Config Component
 *
 * Displays the main gateway URL and allows selecting the default profile.
 */

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Check, Copy, Info, Loader2, Radio } from 'lucide-react';
import { useState } from 'react';
import { getGatewayUrl } from '../config/api';

interface Profile {
  id: string;
  name: string;
  description?: string;
}

interface GatewayConfigProps {
  profiles: Profile[];
  defaultProfileName: string | null;
  onProfileChange: (profileName: string) => Promise<void>;
  isLoading?: boolean;
}

export default function GatewayConfig({
  profiles,
  defaultProfileName,
  onProfileChange,
  isLoading = false,
}: GatewayConfigProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  const gatewayUrl = getGatewayUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gatewayUrl);
      setCopySuccess(true);
      toast({
        title: 'Copied!',
        description: 'MCP endpoint URL copied to clipboard',
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleProfileChange = async (profileName: string) => {
    setIsSaving(true);
    try {
      await onProfileChange(profileName);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50/50">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading gateway configuration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Gateway Configuration</CardTitle>
        <CardDescription>
          Configure your main MCP endpoint for AI client connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gateway Endpoint */}
        <div className="space-y-1.5">
          <Label htmlFor="gateway-url" className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            MCP Endpoint
          </Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border px-3 py-2 rounded-md font-mono text-sm break-all">
              {gatewayUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
              aria-label="Copy MCP endpoint URL to clipboard"
            >
              {copySuccess ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1">{copySuccess ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use this URL in your AI client (Cursor, Claude Code)
          </p>
        </div>

        {/* Profile Selector */}
        <div className="space-y-2">
          <Label htmlFor="default-profile">Active Profile</Label>
          <Select
            value={defaultProfileName || ''}
            onValueChange={handleProfileChange}
            disabled={isSaving || profiles.length === 0}
          >
            <SelectTrigger id="default-profile" className="w-full md:w-80 bg-white">
              <SelectValue placeholder="Select a profile..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.name}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSaving && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Saving...
            </p>
          )}
        </div>

        {/* Info Text */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-white/80 p-3 rounded-md border">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Use this URL to connect AI clients (like Claude Desktop) to your MCP servers. The
            selected profile determines which tools and servers are available.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

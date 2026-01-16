/**
 * Gateway Config Component
 *
 * Compact gateway configuration with endpoint and profile selector.
 */

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Check, Copy, Loader2 } from 'lucide-react';
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
        description: 'Gateway endpoint copied to clipboard',
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
      <div className="mb-4 p-3 bg-white border rounded-lg flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-white border rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Gateway label */}
        <span className="text-sm font-medium text-muted-foreground shrink-0">Gateway</span>

        {/* Endpoint with copy */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <code className="flex-1 bg-muted px-3 py-1.5 rounded text-xs font-mono truncate">
            {gatewayUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 h-8 w-8 p-0"
            aria-label="Copy gateway endpoint"
          >
            {copySuccess ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Profile selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">Profile:</span>
          <Select
            value={defaultProfileName || ''}
            onValueChange={handleProfileChange}
            disabled={isSaving || profiles.length === 0}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.name}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}

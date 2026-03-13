/**
 * MCP Preset Gallery - Browse and add popular MCP server presets
 */

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
} from '@dxheroes/local-mcp-ui';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-fetch';

interface McpPreset {
  id: string;
  name: string;
  description: string;
  type: 'external' | 'remote_http';
  config: Record<string, unknown>;
}

interface McpPresetGalleryProps {
  existingServerNames: string[];
  onAdd: () => void;
}

export default function McpPresetGallery({ existingServerNames, onAdd }: McpPresetGalleryProps) {
  const [presets, setPresets] = useState<McpPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchPresets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/mcp-servers/presets');
      if (!response.ok) throw new Error('Failed to fetch presets');
      const data: McpPreset[] = await response.json();
      setPresets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPresets();
    }
  }, [isOpen, fetchPresets]);

  const handleAdd = async (presetId: string) => {
    try {
      setAdding(presetId);
      setError(null);
      const response = await apiFetch(`/api/mcp-servers/presets/${presetId}/add`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add preset');
      }
      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="mt-6">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="mb-4">
        {isOpen ? 'Hide Presets' : 'Browse Presets'}
      </Button>

      {isOpen && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Add popular MCP servers to your organization with one click.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading presets...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((preset) => {
                const isAdded = existingServerNames.includes(preset.name);
                return (
                  <Card key={preset.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{preset.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{preset.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        disabled={isAdded || adding === preset.id}
                        onClick={() => handleAdd(preset.id)}
                      >
                        {isAdded
                          ? 'Already Added'
                          : adding === preset.id
                            ? 'Adding...'
                            : 'Add to Organization'}
                      </Button>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

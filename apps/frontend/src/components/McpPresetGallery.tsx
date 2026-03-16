/**
 * MCP Preset Gallery - Browse and add MCP server presets (external + builtin)
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
  type: string;
  config: Record<string, unknown>;
  source: 'preset' | 'builtin';
  requiresApiKey?: boolean;
  apiKeyDefaults?: {
    headerName: string;
    headerValueTemplate: string;
  };
  icon?: string;
  docsUrl?: string;
}

export interface PresetData {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  requiresApiKey?: boolean;
  apiKeyDefaults?: {
    headerName: string;
    headerValueTemplate: string;
  };
}

interface McpPresetGalleryProps {
  onAdd: (server: Record<string, unknown>) => void;
  onConfigurePreset?: (preset: PresetData) => void;
}

function PresetSection({
  title,
  presets,
  adding,
  onAdd,
}: {
  title: string;
  presets: McpPreset[];
  adding: string | null;
  onAdd: (id: string) => void;
}) {
  if (presets.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((preset) => (
          <Card key={preset.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{preset.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{preset.type}</Badge>
                    {preset.requiresApiKey && (
                      <Badge variant="outline">API key required</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="mt-3 w-full"
                disabled={adding === preset.id}
                onClick={() => onAdd(preset.id)}
              >
                {adding === preset.id ? 'Adding...' : 'Add to My Servers'}
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function McpPresetGallery({ onAdd, onConfigurePreset }: McpPresetGalleryProps) {
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
    const preset = presets.find((p) => p.id === presetId);

    // For non-builtin presets requiring API key, open configure form instead of creating immediately
    // Builtin presets always go through create-then-edit flow (edit form handles builtin UI correctly)
    if (preset?.requiresApiKey && preset.source !== 'builtin' && onConfigurePreset) {
      onConfigurePreset({
        id: preset.id,
        name: preset.name,
        type: preset.type,
        config: preset.config,
        requiresApiKey: preset.requiresApiKey,
        apiKeyDefaults: (preset as PresetData).apiKeyDefaults,
      });
      return;
    }

    try {
      setAdding(presetId);
      setError(null);
      const response = await apiFetch(`/api/mcp-servers/presets/${presetId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to add preset');
      }
      const createdServer = await response.json();
      onAdd(createdServer);
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
            Add popular MCP servers to your account. You can add the same preset multiple times with
            different configurations.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading presets...</div>
          ) : (
            <>
              <PresetSection
                title="Our MCP Servers"
                presets={presets.filter((p) => p.source === 'builtin')}
                adding={adding}
                onAdd={handleAdd}
              />
              <PresetSection
                title="Community Presets"
                presets={presets.filter((p) => p.source === 'preset')}
                adding={adding}
                onAdd={handleAdd}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

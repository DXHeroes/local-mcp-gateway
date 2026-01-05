/**
 * Tools List Component
 *
 * Manages list of tools for an MCP server in a profile
 */

import { Button, useToast } from '@dxheroes/local-mcp-ui';
import { useEffect, useState } from 'react';
import { API_URL } from '../config/api';
import { ToolEditCard } from './ToolEditCard';

interface ToolData {
  name: string;
  original: {
    name: string;
    description?: string;
    inputSchema?: unknown;
  };
  customized: {
    name: string;
    description?: string;
    inputSchema?: unknown;
  } | null;
  isEnabled: boolean;
  hasChanges: boolean;
  changeType?: 'added' | 'modified' | 'unchanged' | null;
}

interface ToolsListProps {
  profileId: string;
  serverId: string;
  tools: ToolData[];
  onToolsUpdated?: () => void;
}

export function ToolsList({
  profileId,
  serverId,
  tools: initialTools,
  onToolsUpdated,
}: ToolsListProps) {
  const [editingTools, setEditingTools] = useState<ToolData[]>(initialTools);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditingTools(initialTools);
    setHasChanges(false);
  }, [initialTools]);

  const handleToolChange = (updatedTool: ToolData) => {
    setEditingTools((prev) => prev.map((t) => (t.name === updatedTool.name ? updatedTool : t)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    console.log('[ToolsList] handleSave called');
    console.log('[ToolsList] editingTools:', editingTools.map(t => ({ name: t.name, isEnabled: t.isEnabled })));
    setIsSaving(true);

    try {
      const toolCustomizations = editingTools.map((tool) => ({
        toolName: tool.name,
        isEnabled: tool.isEnabled,
        customName:
          tool.customized?.name !== tool.original.name ? tool.customized?.name : undefined,
        customDescription:
          tool.customized?.description !== tool.original.description
            ? tool.customized?.description
            : undefined,
        customInputSchema:
          JSON.stringify(tool.customized?.inputSchema) !== JSON.stringify(tool.original.inputSchema)
            ? tool.customized?.inputSchema
            : undefined,
      }));

      console.log('[ToolsList] Sending PUT request with:', toolCustomizations);

      const response = await fetch(
        `${API_URL}/api/profiles/${profileId}/servers/${serverId}/tools`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tools: toolCustomizations }),
        }
      );

      console.log('[ToolsList] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to save tool customizations');
      }

      toast({
        title: 'Success',
        description: 'Tool customizations saved successfully',
      });

      setHasChanges(false);

      if (onToolsUpdated) {
        onToolsUpdated();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTools(initialTools);
    setHasChanges(false);
  };

  if (editingTools.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No tools available from this MCP server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {editingTools.map((tool) => (
          <div key={tool.name} data-testid="tool-item" data-tool-name={tool.name}>
            <ToolEditCard tool={tool} onChange={handleToolChange} />
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background py-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}

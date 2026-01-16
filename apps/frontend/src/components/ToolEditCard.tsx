/**
 * Tool Edit Card Component
 *
 * Compact card with edit modal for tool customizations
 */

import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@dxheroes/local-mcp-ui';
import { useState } from 'react';
import { DiffViewer } from './DiffViewer';

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

interface ToolEditCardProps {
  tool: ToolData;
  onChange: (tool: ToolData) => void;
}

export function ToolEditCard({ tool, onChange }: ToolEditCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState(tool.customized?.name || '');
  const [customDescription, setCustomDescription] = useState(tool.customized?.description || '');
  const [customSchemaJson, setCustomSchemaJson] = useState(
    tool.customized?.inputSchema ? JSON.stringify(tool.customized.inputSchema, null, 2) : ''
  );
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const handleToggle = (checked: boolean) => {
    onChange({
      ...tool,
      isEnabled: checked,
    });
  };

  const handleOpenModal = () => {
    // Reset form to current values when opening
    setCustomName(tool.customized?.name || '');
    setCustomDescription(tool.customized?.description || '');
    setCustomSchemaJson(
      tool.customized?.inputSchema ? JSON.stringify(tool.customized.inputSchema, null, 2) : ''
    );
    setSchemaError(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomizations = () => {
    // Validate schema if provided
    let parsedSchema = tool.original.inputSchema;
    if (customSchemaJson.trim()) {
      try {
        parsedSchema = JSON.parse(customSchemaJson);
      } catch {
        setSchemaError('Invalid JSON');
        return;
      }
    }

    // Check if there are any actual customizations
    const hasNameChange = customName && customName !== tool.original.name;
    const hasDescChange = customDescription && customDescription !== tool.original.description;
    const hasSchemaChange =
      customSchemaJson.trim() &&
      JSON.stringify(parsedSchema) !== JSON.stringify(tool.original.inputSchema);

    if (!hasNameChange && !hasDescChange && !hasSchemaChange) {
      // No customizations, set to null
      onChange({
        ...tool,
        customized: null,
      });
    } else {
      onChange({
        ...tool,
        customized: {
          name: customName || tool.original.name,
          description: customDescription || tool.original.description,
          inputSchema: parsedSchema,
        },
      });
    }

    setIsModalOpen(false);
  };

  const handleResetCustomizations = () => {
    setCustomName('');
    setCustomDescription('');
    setCustomSchemaJson('');
    setSchemaError(null);
    onChange({
      ...tool,
      customized: null,
    });
    setIsModalOpen(false);
  };

  const displayName = tool.customized?.name || tool.original.name;
  const displayDescription = tool.customized?.description || tool.original.description;
  const hasCustomizations = tool.customized !== null;

  return (
    <>
      {/* Compact Card */}
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border ${
          tool.hasChanges ? 'border-yellow-500 border-2' : 'border-border'
        }`}
      >
        <Checkbox checked={tool.isEnabled} onCheckedChange={handleToggle} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm break-words">{displayName}</span>
            {tool.hasChanges && (
              <Badge
                variant="outline"
                className="bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-500 text-xs"
              >
                Server Changed
              </Badge>
            )}
            {hasCustomizations && (
              <Badge
                variant="outline"
                className="bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500 text-xs"
              >
                Customized
              </Badge>
            )}
            {tool.changeType === 'added' && (
              <Badge
                variant="outline"
                className="bg-green-500 text-white border-green-600 dark:bg-green-600 dark:border-green-500 text-xs"
              >
                New
              </Badge>
            )}
          </div>
          {displayDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{displayDescription}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleOpenModal} className="shrink-0">
          Edit
        </Button>
      </div>

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tool: {tool.original.name}</DialogTitle>
            <DialogDescription>
              Customize the tool name, description, or input schema. Leave empty to use original
              values.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="diff">Diff</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor={`custom-name-${tool.name}`}>
                  Custom Name
                  <span className="text-xs text-muted-foreground ml-2">
                    (leave empty to use original)
                  </span>
                </Label>
                <Input
                  id={`custom-name-${tool.name}`}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={tool.original.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`custom-description-${tool.name}`}>
                  Custom Description
                  <span className="text-xs text-muted-foreground ml-2">
                    (leave empty to use original)
                  </span>
                </Label>
                <Textarea
                  id={`custom-description-${tool.name}`}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={tool.original.description || 'No description'}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`custom-schema-${tool.name}`}>
                  Custom Input Schema (JSON)
                  <span className="text-xs text-muted-foreground ml-2">
                    (leave empty to use original)
                  </span>
                </Label>
                <Textarea
                  id={`custom-schema-${tool.name}`}
                  value={customSchemaJson}
                  onChange={(e) => {
                    setCustomSchemaJson(e.target.value);
                    setSchemaError(null);
                  }}
                  placeholder={JSON.stringify(tool.original.inputSchema, null, 2)}
                  className="font-mono text-xs"
                  rows={10}
                />
                {schemaError && <p className="text-sm text-destructive">{schemaError}</p>}
              </div>
            </TabsContent>

            <TabsContent value="diff" className="mt-4" data-testid="diff-viewer">
              <DiffViewer
                original={tool.original}
                customized={
                  customName || customDescription || customSchemaJson
                    ? {
                        name: customName || tool.original.name,
                        description: customDescription || tool.original.description,
                        inputSchema: customSchemaJson
                          ? (() => {
                              try {
                                return JSON.parse(customSchemaJson);
                              } catch {
                                return tool.original.inputSchema;
                              }
                            })()
                          : tool.original.inputSchema,
                      }
                    : null
                }
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {hasCustomizations && (
              <Button
                variant="outline"
                onClick={handleResetCustomizations}
                className="text-destructive hover:text-destructive sm:mr-auto"
              >
                Reset All
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomizations}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Tool Edit Card Component
 *
 * Allows editing of individual tool customizations with expandable details
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
  const [showDetails, setShowDetails] = useState(false);
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

  const handleCustomNameChange = (value: string) => {
    setCustomName(value);
    onChange({
      ...tool,
      customized: {
        name: value || tool.original.name,
        description: customDescription || tool.original.description,
        inputSchema: tool.customized?.inputSchema || tool.original.inputSchema,
      },
    });
  };

  const handleCustomDescriptionChange = (value: string) => {
    setCustomDescription(value);
    onChange({
      ...tool,
      customized: {
        name: customName || tool.original.name,
        description: value || tool.original.description,
        inputSchema: tool.customized?.inputSchema || tool.original.inputSchema,
      },
    });
  };

  const handleSchemaChange = (value: string) => {
    setCustomSchemaJson(value);

    if (!value.trim()) {
      // Empty schema, reset to original
      setSchemaError(null);
      onChange({
        ...tool,
        customized: {
          name: customName || tool.original.name,
          description: customDescription || tool.original.description,
          inputSchema: tool.original.inputSchema,
        },
      });
      return;
    }

    try {
      const parsedSchema = JSON.parse(value);
      setSchemaError(null);
      onChange({
        ...tool,
        customized: {
          name: customName || tool.original.name,
          description: customDescription || tool.original.description,
          inputSchema: parsedSchema,
        },
      });
    } catch (_error) {
      setSchemaError('Invalid JSON');
    }
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
  };

  const displayName = tool.customized?.name || tool.original.name;
  const displayDescription = tool.customized?.description || tool.original.description;
  const hasCustomizations = tool.customized !== null;

  return (
    <Card className={tool.hasChanges ? 'border-yellow-500 border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox checked={tool.isEnabled} onCheckedChange={handleToggle} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base break-words">{displayName}</CardTitle>
                {tool.hasChanges && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                  >
                    Server Changed
                  </Badge>
                )}
                {hasCustomizations && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                  >
                    Customized
                  </Badge>
                )}
                {tool.changeType === 'added' && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700"
                  >
                    New
                  </Badge>
                )}
              </div>
              {displayDescription && (
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {displayDescription}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="shrink-0"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent data-testid="tool-details">
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
                  onChange={(e) => handleCustomNameChange(e.target.value)}
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
                  onChange={(e) => handleCustomDescriptionChange(e.target.value)}
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
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  placeholder={JSON.stringify(tool.original.inputSchema, null, 2)}
                  className="font-mono text-xs"
                  rows={10}
                />
                {schemaError && <p className="text-sm text-destructive">{schemaError}</p>}
              </div>

              {hasCustomizations && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCustomizations}
                    className="text-destructive hover:text-destructive"
                  >
                    Reset All Customizations
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="diff" className="mt-4" data-testid="diff-viewer">
              <DiffViewer original={tool.original} customized={tool.customized} />
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

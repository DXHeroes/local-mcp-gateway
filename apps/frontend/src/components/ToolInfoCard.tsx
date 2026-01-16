/**
 * Tool Info Card Component
 *
 * Displays tool information with tabbed interface for Description and Input Schema
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dxheroes/local-mcp-ui';

interface ToolInfoCardProps {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export function ToolInfoCard({ name, description, inputSchema }: ToolInfoCardProps) {
  const hasInputSchema = inputSchema != null;
  const hasDescription = Boolean(description);

  return (
    <div className="border-b pb-3 last:border-0">
      <h4 className="font-medium text-base">{name}</h4>

      {(hasDescription || hasInputSchema) && (
        <Tabs defaultValue="description" className="mt-2">
          <TabsList className="h-8">
            <TabsTrigger value="description" className="text-xs px-3 py-1">
              Description
            </TabsTrigger>
            {hasInputSchema && (
              <TabsTrigger value="schema" className="text-xs px-3 py-1">
                Input Schema
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="description" className="mt-2">
            {hasDescription ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description available</p>
            )}
          </TabsContent>

          {hasInputSchema && (
            <TabsContent value="schema" className="mt-2">
              <pre className="p-2 bg-muted rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(inputSchema, null, 2)}
              </pre>
            </TabsContent>
          )}
        </Tabs>
      )}

      {!hasDescription && !hasInputSchema && (
        <p className="text-sm text-muted-foreground italic mt-1">No description available</p>
      )}
    </div>
  );
}

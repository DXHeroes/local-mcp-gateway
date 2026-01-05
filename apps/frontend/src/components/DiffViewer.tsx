/**
 * Diff Viewer Component
 *
 * Shows differences between original and customized tool attributes
 */

import { Label } from '@dxheroes/local-mcp-ui';

interface DiffViewerProps {
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
}

interface DiffFieldProps {
  label: string;
  original: string | undefined;
  customized: string | undefined;
}

function DiffField({ label, original, customized }: DiffFieldProps) {
  if (original === customized || (!original && !customized)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Original</p>
          <div className="text-sm p-2 bg-muted/50 rounded border border-muted">
            {original || <span className="text-muted-foreground italic">Not set</span>}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Customized</p>
          <div className="text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
            {customized || <span className="text-muted-foreground italic">Not set</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiffViewer({ original, customized }: DiffViewerProps) {
  if (!customized) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No customizations applied. Original values will be used.
      </div>
    );
  }

  const hasNameDiff = original.name !== customized.name;
  const hasDescriptionDiff = original.description !== customized.description;
  const hasSchemaD =
    JSON.stringify(original.inputSchema) !== JSON.stringify(customized.inputSchema);

  if (!hasNameDiff && !hasDescriptionDiff && !hasSchemaD) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No differences found. Current customizations match the original values.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasNameDiff && (
        <DiffField label="Name" original={original.name} customized={customized.name} />
      )}

      {hasDescriptionDiff && (
        <DiffField
          label="Description"
          original={original.description}
          customized={customized.description}
        />
      )}

      {hasSchemaD && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Input Schema</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Original</p>
              <pre className="text-xs bg-muted/50 p-2 rounded border border-muted overflow-x-auto max-h-60">
                {JSON.stringify(original.inputSchema, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Customized</p>
              <pre className="text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-900 overflow-x-auto max-h-60">
                {JSON.stringify(customized.inputSchema, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

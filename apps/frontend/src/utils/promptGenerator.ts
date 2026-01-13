import { encode } from '@toon-format/toon';

interface Tool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Generates a TOON formatted prompt for the profile
 * @param profileName Name of the profile
 * @param profileUrl Endpoint URL of the profile
 * @param tools List of tools available in the profile
 * @returns TOON formatted string
 */
export function generateToonPrompt(profileName: string, profileUrl: string, tools: Tool[]): string {
  const data = {
    profile: profileName,
    url: profileUrl,
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    })),
  };

  return encode(data);
}

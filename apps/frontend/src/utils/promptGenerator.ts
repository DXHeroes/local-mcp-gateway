import { encode } from '@toon-format/toon';

interface Tool {
  name: string;
  description: string;
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
    })),
  };

  return encode(data);
}

/**
 * Generates a Markdown formatted prompt for the profile
 * @param profileName Name of the profile
 * @param profileUrl Endpoint URL of the profile
 * @param tools List of tools available in the profile
 * @returns Markdown formatted string
 */
export function generateMarkdownPrompt(
  profileName: string,
  profileUrl: string,
  tools: Tool[]
): string {
  let markdown = `# MCP Profile: ${profileName}\n\n`;
  markdown += `**Endpoint:** \`${profileUrl}\`\n\n`;
  markdown += `## Available Tools\n\n`;

  if (tools.length === 0) {
    markdown += '_No tools available_\n';
  } else {
    tools.forEach((tool) => {
      markdown += `### ${tool.name}\n\n`;
      if (tool.description) {
        markdown += `${tool.description}\n\n`;
      }
    });
  }

  return markdown;
}

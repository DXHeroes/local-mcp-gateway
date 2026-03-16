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
        markdown += `**Description:** ${tool.description}\n\n`;
      }
    });
  }

  return markdown;
}

/**
 * Generates an XML formatted prompt for the profile
 * @param profileName Name of the profile
 * @param profileUrl Endpoint URL of the profile
 * @param tools List of tools available in the profile
 * @returns XML formatted string
 */
export function generateXmlPrompt(
  profileName: string,
  profileUrl: string,
  tools: Tool[]
): string {
  let xml = `<mcp-profile name="${escapeXml(profileName)}" endpoint="${escapeXml(profileUrl)}">\n`;
  xml += '  <tools>\n';

  if (tools.length === 0) {
    xml += '    <!-- No tools available -->\n';
  } else {
    tools.forEach((tool) => {
      xml += `    <tool name="${escapeXml(tool.name)}">\n`;
      if (tool.description) {
        xml += `      <description>${escapeXml(tool.description)}</description>\n`;
      }
      xml += '    </tool>\n';
    });
  }

  xml += '  </tools>\n';
  xml += '</mcp-profile>\n';

  return xml;
}

/**
 * Generates a recommended hybrid Markdown + XML prompt for the profile.
 * Combines human-readable Markdown context with structured XML tool definitions,
 * following Anthropic/OpenAI prompting best practices.
 * @param profileName Name of the profile
 * @param profileUrl Endpoint URL of the profile
 * @param tools List of tools available in the profile
 * @returns Hybrid Markdown + XML formatted string
 */
export function generateRecommendedPrompt(
  profileName: string,
  profileUrl: string,
  tools: Tool[]
): string {
  let prompt = `# MCP Profile: ${profileName}\n\n`;
  prompt += `**Endpoint:** \`${profileUrl}\`\n\n`;
  prompt += `## Available Tools\n\n`;

  if (tools.length === 0) {
    prompt += '_No tools available_\n';
  } else {
    prompt += '<tools>\n';
    tools.forEach((tool) => {
      prompt += `<tool name="${escapeXml(tool.name)}">\n`;
      if (tool.description) {
        prompt += `<description>${escapeXml(tool.description)}</description>\n`;
      }
      prompt += '</tool>\n';
    });
    prompt += '</tools>\n';
  }

  return prompt;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

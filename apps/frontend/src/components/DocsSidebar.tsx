/**
 * Documentation sidebar navigation component
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export interface DocsSidebarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const NAV_ITEMS: NavSection[] = [
  {
    title: 'Introduction',
    items: [
      { id: 'what-is', label: 'What is Local MCP Gateway?' },
      { id: 'core-concepts', label: 'Core Concepts' },
    ],
  },
  {
    title: 'Quick Start',
    items: [
      { id: 'quick-start-docker', label: 'Docker (Recommended)' },
      { id: 'quick-start-source', label: 'From Source' },
      { id: 'quick-start-profile', label: 'Creating Your First Profile' },
    ],
  },
  {
    title: 'AI Integration',
    items: [
      { id: 'ai-cursor', label: 'Cursor Configuration' },
      { id: 'ai-claude', label: 'Claude Desktop Configuration' },
      { id: 'ai-prompt', label: 'AI Prompts' },
    ],
  },
  {
    title: 'Reference',
    items: [{ id: 'debug-logs', label: 'Debug Logs' }],
  },
];

interface SidebarSectionProps {
  section: NavSection;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  defaultOpen?: boolean;
}

function SidebarSection({
  section,
  activeSection,
  onNavigate,
  defaultOpen = true,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isActive = section.items.some((item) => item.id === activeSection);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded hover:bg-gray-100 transition-colors ${
          isActive ? 'text-blue-700' : 'text-gray-700'
        }`}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        {section.title}
      </button>
      {isOpen && (
        <ul className="ml-5 mt-1 space-y-0.5">
          {section.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600 -ml-0.5 pl-2.5'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DocsSidebar({ activeSection, onNavigate }: DocsSidebarProps) {
  return (
    <nav className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4 pr-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
          Documentation
        </div>
        {NAV_ITEMS.map((section) => (
          <SidebarSection
            key={section.title}
            section={section}
            activeSection={activeSection}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

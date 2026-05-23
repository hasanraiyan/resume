import { getBaseUrl } from '@/lib/mcp/oauth';
import { MCP_APPS } from '@/lib/mcp/scopes';

const INTERNAL_MCP_ORDER = ['pocketly', 'snaplinks', 'coursify', 'recall', 'youtube'];

const MCP_COLORS = {
  pocketly: 'emerald-500',
  snaplinks: 'sky-500',
  coursify: 'violet-500',
  recall: 'amber-500',
  youtube: 'red-500',
};

export function getInternalMcpServers() {
  const baseUrl = getBaseUrl();

  return INTERNAL_MCP_ORDER.map((scope) => {
    const app = MCP_APPS[scope];
    const id = `internal-${scope}`;

    return {
      _id: id,
      id,
      name: app.name,
      description: app.description,
      type: 'http',
      url: `${baseUrl}/api/mcp/${scope}`,
      icon: 'Server',
      color: MCP_COLORS[scope] || 'blue-500',
      adminOnly: true,
      isDefault: false,
      isActive: true,
      isInternal: true,
      createdAt: null,
      updatedAt: null,
    };
  });
}

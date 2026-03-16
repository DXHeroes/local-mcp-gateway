import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-fetch';

interface ShareInboundInfo {
  permission: string;
  sharedByUserName: string;
  sharedByUserEmail: string;
}

interface ShareOutboundSummary {
  total: number;
  byPermission: Record<string, number>;
}

export interface ResourceSharingSummary {
  inbound?: ShareInboundInfo;
  outbound?: ShareOutboundSummary;
}

export function useSharingSummary(resourceType: 'profile' | 'mcp_server') {
  const [summary, setSummary] = useState<Record<string, ResourceSharingSummary>>({});
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/sharing/summary/${resourceType}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, [resourceType]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, loading, refetch };
}

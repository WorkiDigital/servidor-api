import { apiClient } from './client';
import type { UtmReportData } from '../types';

export async function getUtmReport(projectId: string, from?: string, to?: string): Promise<UtmReportData> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get<UtmReportData>(`/admin/projects/${projectId}/utm-report`, { params });
  return res.data;
}

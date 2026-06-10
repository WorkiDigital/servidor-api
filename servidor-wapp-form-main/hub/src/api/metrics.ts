import { apiClient } from './client';
import type { MetricsData } from '../types';
import mockMetrics from '../mocks/metrics.json';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function getMetrics(projectId: string, from?: string, to?: string): Promise<MetricsData> {
  if (USE_MOCKS) return mockMetrics as MetricsData;
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get<MetricsData>(`/admin/projects/${projectId}/metrics`, { params });
  return res.data;
}

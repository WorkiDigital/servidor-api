import { apiClient } from './client';
import type { LeadsResponse } from '../types';
import mockLeads from '../mocks/leads.json';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function getLeads(
  projectId: string,
  opts: { status?: string; q?: string; page?: number } = {}
): Promise<LeadsResponse> {
  if (USE_MOCKS) return mockLeads as LeadsResponse;
  const params: Record<string, string> = {};
  if (opts.status) params.status = opts.status;
  if (opts.q) params.q = opts.q;
  if (opts.page) params.page = String(opts.page);
  const res = await apiClient.get<LeadsResponse>(`/admin/projects/${projectId}/leads`, { params });
  return res.data;
}

export async function exportLeadsCsv(projectId: string): Promise<void> {
  const token = localStorage.getItem('hub_token') || '';
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${base}/admin/projects/${projectId}/leads/export.csv`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leads-${projectId}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function deleteAllLeads(projectId: string): Promise<void> {
  if (USE_MOCKS) return;
  const token = localStorage.getItem('hub_token') || '';
  await apiClient.delete(`/admin/projects/${projectId}/leads`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Confirm': 'delete-all',
    },
  });
}

import { apiClient } from './client';
import type { EventsLogResponse } from '../types';

export async function getEventsLog(
  projectId: string,
  opts: { event?: string; status?: string; from?: string; to?: string; page?: number } = {}
): Promise<EventsLogResponse> {
  const params: Record<string, string> = {};
  if (opts.event) params.event = opts.event;
  if (opts.status) params.status = opts.status;
  if (opts.from) params.from = opts.from;
  if (opts.to) params.to = opts.to;
  if (opts.page) params.page = String(opts.page);
  const res = await apiClient.get<EventsLogResponse>(`/admin/projects/${projectId}/events`, { params });
  return res.data;
}

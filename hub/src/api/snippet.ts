import { apiClient } from './client';
import type { SnippetData } from '../types';
import mockSnippet from '../mocks/snippet.json';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function getSnippet(projectId: string): Promise<SnippetData> {
  if (USE_MOCKS) return mockSnippet as SnippetData;
  const res = await apiClient.get<SnippetData>(`/admin/projects/${projectId}/snippet`);
  return res.data;
}

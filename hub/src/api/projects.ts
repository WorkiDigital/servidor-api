import { apiClient } from './client';
import type { Project, MetaConfigPayload } from '../types';
import mockProjects from '../mocks/projects.json';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function listProjects(): Promise<Project[]> {
  if (USE_MOCKS) return mockProjects.projects as Project[];
  const res = await apiClient.get<{ projects: Project[] }>('/admin/projects');
  return res.data.projects;
}

export async function getProject(id: string): Promise<Project> {
  if (USE_MOCKS) {
    const p = (mockProjects.projects as Project[]).find((x) => x.id === id);
    if (!p) throw new Error('Not found');
    return p;
  }
  const res = await apiClient.get<{ project: Project }>(`/admin/projects/${id}`);
  return res.data.project;
}

export async function createProject(name: string, domain?: string): Promise<Project> {
  if (USE_MOCKS) {
    return {
      id: crypto.randomUUID(),
      name,
      domain: domain || `${name}.track.example.com`,
      pixelId: '',
      apiVersion: 'v22.0',
      hasToken: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }
  const res = await apiClient.post<{ project: Project }>('/admin/projects', { name, domain });
  return res.data.project;
}

export async function updateProjectMeta(id: string, payload: MetaConfigPayload): Promise<Project> {
  if (USE_MOCKS) {
    const p = (mockProjects.projects as Project[]).find((x) => x.id === id);
    return { ...p!, ...payload, hasToken: !!payload.accessToken || (p?.hasToken ?? false), tokenMasked: payload.accessToken ? `•••• ${payload.accessToken.slice(-4)}` : p?.tokenMasked };
  }
  const res = await apiClient.patch<{ project: Project }>(`/admin/projects/${id}/meta`, payload);
  return res.data.project;
}

export async function deleteProject(id: string): Promise<void> {
  if (USE_MOCKS) return;
  await apiClient.delete(`/admin/projects/${id}`);
}

export interface FormCaptureRule {
  buttonText: string[];
  eventName: string;
  customData?: Record<string, string>;
}

export async function getFormCaptureRules(id: string): Promise<FormCaptureRule[]> {
  if (USE_MOCKS) return [];
  const res = await apiClient.get<{ rules: FormCaptureRule[] }>(`/admin/projects/${id}/form-capture`);
  return res.data.rules;
}

export async function saveFormCaptureRules(id: string, rules: FormCaptureRule[]): Promise<void> {
  if (USE_MOCKS) return;
  await apiClient.put(`/admin/projects/${id}/form-capture`, { rules });
}

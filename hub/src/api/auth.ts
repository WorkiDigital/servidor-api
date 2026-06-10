import { apiClient } from './client';
import mockAuth from '../mocks/auth.json';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function login(user: string, password: string): Promise<string> {
  if (USE_MOCKS) {
    if (user === mockAuth.user && password === mockAuth.password) {
      return mockAuth.token;
    }
    throw new Error('Invalid credentials');
  }
  const res = await apiClient.post<{ token: string }>('/admin/login', { user, password });
  return res.data.token;
}

export async function getMe(): Promise<{ user: string }> {
  if (USE_MOCKS) return { user: mockAuth.user };
  const res = await apiClient.get<{ user: string }>('/admin/me');
  return res.data;
}

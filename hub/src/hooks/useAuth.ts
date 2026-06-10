export function isAuthenticated(): boolean {
  return !!localStorage.getItem('hub_token');
}

export function getToken(): string | null {
  return localStorage.getItem('hub_token');
}

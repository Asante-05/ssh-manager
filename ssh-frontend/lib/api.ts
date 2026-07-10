const BASE_URL = "http://localhost:8000/api";

export interface Server {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  key_path?: string;
  group?: string;
}

export interface CommandLog {
  id: number;
  command: string;
  output: string;
  created_at: string;
}

export interface ServerFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  key_path?: string;
  private_key?: string;
  group?: string;
}

// Auth helpers
export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

function authHeaders(token?: string): HeadersInit {
  const t = token || getToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

// Attempt to refresh the access token using the refresh token
async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    // ROTATE_REFRESH_TOKENS=True means we get a new refresh token too
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch {
    return null;
  }
}

// apiFetch: auto-refresh on 401 and retry once
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, {
    ...options,
    headers: authHeaders(),
  });

  if (res.status === 401) {
    // Try to refresh
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the original request with the new token
      res = await fetch(url, {
        ...options,
        headers: authHeaders(newToken),
      });
    }

    // If still 401 after refresh, log out
    if (res.status === 401) {
      clearTokens();
      window.location.href = "/login";
    }
  }

  return res;
}

// Auth
export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Invalid username or password");

  const data = await res.json();
  setTokens(data.access, data.refresh);
}

export function logout() {
  clearTokens();
  window.location.href = "/login";
}

// Servers
export async function getServers(): Promise<Server[]> {
  const res = await apiFetch(`${BASE_URL}/servers/`);
  if (!res.ok) throw new Error("Failed to fetch servers");
  return res.json();
}

export async function getServer(id: number): Promise<Server> {
  const res = await apiFetch(`${BASE_URL}/servers/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch server");
  return res.json();
}

export async function createServer(data: ServerFormData): Promise<Server> {
  const res = await apiFetch(`${BASE_URL}/servers/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create server");
  return res.json();
}

export async function deleteServer(id: number): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/servers/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete server");
}

export async function updateServer(id: number, data: Partial<ServerFormData>): Promise<Server> {
  const res = await apiFetch(`${BASE_URL}/servers/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update server");
  return res.json();
}

// Commands
export async function runCommand(
  serverId: number,
  command: string
): Promise<{ command: string; output: string; created_at: string }> {
  const res = await apiFetch(`${BASE_URL}/servers/${serverId}/run/`, {
    method: "POST",
    body: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error("Failed to run command");
  return res.json();
}

export async function getServerLogs(serverId: number): Promise<CommandLog[]> {
  const res = await apiFetch(`${BASE_URL}/servers/${serverId}/logs/`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function pingServer(id: number): Promise<{ online: boolean; host: string }> {
  const res = await apiFetch(`${BASE_URL}/servers/${id}/ping/`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to ping server");
  return res.json();
}
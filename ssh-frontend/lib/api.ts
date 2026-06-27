const BASE_URL = "http://localhost:8000/api";

export interface Server {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  key_path?: string;
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
}

// Auth helpers
export function getToken(): string | null {
  return localStorage.getItem("access_token");
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

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Auto-handle 401s by redirecting to login
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: authHeaders(),
  });

  if (res.status === 401) {
    clearTokens();
    window.location.href = "/login";
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
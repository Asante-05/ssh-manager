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
}

// Servers
export async function getServers(): Promise<Server[]> {
  const res = await fetch(`${BASE_URL}/servers/`);
  if (!res.ok) throw new Error("Failed to fetch servers");
  return res.json();
}

export async function getServer(id: number): Promise<Server> {
  const res = await fetch(`${BASE_URL}/servers/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch server");
  return res.json();
}

export async function createServer(data: ServerFormData): Promise<Server> {
  const res = await fetch(`${BASE_URL}/servers/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create server");
  return res.json();
}

export async function deleteServer(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/servers/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete server");
}

// Commands
export async function runCommand(
  serverId: number,
  command: string
): Promise<{ command: string; output: string; created_at: string }> {
  const res = await fetch(`${BASE_URL}/servers/${serverId}/run/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error("Failed to run command");
  return res.json();
}

export async function getServerLogs(serverId: number): Promise<CommandLog[]> {
  const res = await fetch(`${BASE_URL}/servers/${serverId}/logs/`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}
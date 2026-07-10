"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getServers,
  createServer,
  deleteServer,
  updateServer,
  pingServer,
  Server,
  ServerFormData,
} from "../lib/api";

const emptyForm: ServerFormData = {
  name: "",
  host: "",
  port: 22,
  username: "",
  password: "",
  key_path: "",
  private_key: "",
  group: "",
};

type PingStatus = "idle" | "pinging" | "online" | "offline";
type PingMode = "simple" | "live";

const GROUP_COLORS = [
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
];

function groupColor(group: string, groups: string[]) {
  const idx = groups.indexOf(group) % GROUP_COLORS.length;
  return GROUP_COLORS[idx];
}

// Custom group select component
function GroupSelect({
  value,
  onChange,
  groups,
}: {
  value: string;
  onChange: (val: string) => void;
  groups: string[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = groups.filter((g) =>
    g.toLowerCase().includes(input.toLowerCase())
  );

  const showCreateOption = input.trim() && !groups.includes(input.trim());

  function select(val: string) {
    setInput(val);
    onChange(val);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  function handleClear() {
    setInput("");
    onChange("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Select or create a group..."
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs px-1"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {open && (filtered.length > 0 || showCreateOption) && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-lg overflow-hidden">
          {filtered.length > 0 && (
            <div className="py-1">
              {filtered.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => select(g)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${input === g ? "bg-zinc-700 text-zinc-100" : "text-zinc-300 hover:bg-zinc-700"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {g}
                </button>
              ))}
            </div>
          )}
          {showCreateOption && (
            <>
              {filtered.length > 0 && <div className="border-t border-zinc-700" />}
              <button
                type="button"
                onClick={() => select(input.trim())}
                className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <span className="text-emerald-500">+</span>
                Create &quot;{input.trim()}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ServerFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [editForm, setEditForm] = useState<ServerFormData>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [pingMode, setPingMode] = useState<PingMode>("simple");
  const [pingStatuses, setPingStatuses] = useState<Record<number, PingStatus>>({});

  const [livePingServer, setLivePingServer] = useState<Server | null>(null);
  const [livePingLines, setLivePingLines] = useState<string[]>([]);
  const [livePingStatus, setLivePingStatus] = useState<"idle" | "running" | "done">("idle");
  const [livePingResult, setLivePingResult] = useState<"online" | "offline" | null>(null);
  const livePingRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.push("/login");
  }, []);

  useEffect(() => { fetchServers(); }, []);

  useEffect(() => {
    if (livePingRef.current) livePingRef.current.scrollTop = livePingRef.current.scrollHeight;
  }, [livePingLines]);

  async function fetchServers() {
    try {
      const data = await getServers();
      setServers(data);
    } catch {
      setError("Could not load servers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const newServer = await createServer(form);
      setServers((prev) => [...prev, newServer]);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setError("Failed to add server. Check your inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteServer(id);
      setServers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Failed to delete server.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEditClick(server: Server) {
    setEditingServer(server);
    setEditForm({
      name: server.name,
      host: server.host,
      port: server.port,
      username: server.username,
      password: "",
      key_path: server.key_path || "",
      private_key: "",
      group: server.group || "",
    });
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingServer) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const updated = await updateServer(editingServer.id, editForm);
      setServers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingServer(null);
    } catch {
      setError("Failed to update server.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSimplePing(server: Server) {
    setPingStatuses((prev) => ({ ...prev, [server.id]: "pinging" }));
    try {
      const result = await pingServer(server.id);
      setPingStatuses((prev) => ({ ...prev, [server.id]: result.online ? "online" : "offline" }));
    } catch {
      setPingStatuses((prev) => ({ ...prev, [server.id]: "offline" }));
    }
  }

  function handleLivePing(server: Server) {
    setLivePingServer(server);
    setLivePingLines([]);
    setLivePingStatus("running");
    setLivePingResult(null);

    const token = localStorage.getItem("access_token");
    const ws = new WebSocket(`ws://localhost:8000/ws/servers/${server.id}/ping/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ action: "ping" }));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "output") {
        setLivePingLines((prev) => [...prev, msg.data]);
      } else if (msg.type === "done") {
        setLivePingStatus("done");
        setLivePingResult(msg.status);
        setPingStatuses((prev) => ({ ...prev, [server.id]: msg.status }));
      } else if (msg.type === "error") {
        setLivePingLines((prev) => [...prev, `Error: ${msg.data}`]);
        setLivePingStatus("done");
        setLivePingResult("offline");
      }
    };
    ws.onclose = () => { if (livePingStatus === "running") setLivePingStatus("done"); };
  }

  function handlePingClick(server: Server) {
    pingMode === "simple" ? handleSimplePing(server) : handleLivePing(server);
  }

  function closeLivePing() {
    wsRef.current?.close();
    setLivePingServer(null);
    setLivePingLines([]);
    setLivePingStatus("idle");
    setLivePingResult(null);
  }

  const allGroups = Array.from(new Set(servers.map((s) => s.group).filter(Boolean))) as string[];

  const filteredServers = servers.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.host.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q);
    const matchesGroup = selectedGroup === null || s.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const inputClass = "bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors";

  function PingIndicator({ serverId }: { serverId: number }) {
    const status = pingStatuses[serverId] || "idle";
    if (status === "idle") return null;
    const map: Record<PingStatus, { color: string; label: string }> = {
      idle: { color: "bg-zinc-600", label: "" },
      pinging: { color: "bg-yellow-400 animate-pulse", label: "pinging..." },
      online: { color: "bg-emerald-400", label: "online" },
      offline: { color: "bg-red-400", label: "offline" },
    };
    const { color, label } = map[status];
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Servers</h1>
          <p className="text-sm text-zinc-500 mt-1">{servers.length} server{servers.length !== 1 ? "s" : ""} configured</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs font-medium">
            <button onClick={() => setPingMode("simple")} className={`px-3 py-1.5 rounded transition-colors ${pingMode === "simple" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>Simple ping</button>
            <button onClick={() => setPingMode("live")} className={`px-3 py-1.5 rounded transition-colors ${pingMode === "live" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>Live ping</button>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setEditingServer(null); }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-md transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Server"}
          </button>
        </div>
      </div>

      {/* Group filters */}
      {allGroups.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedGroup === null ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}
          >
            All
          </button>
          {allGroups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(selectedGroup === group ? null : group)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedGroup === group ? groupColor(group, allGroups) : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}
            >
              {group}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && servers.length > 0 && (
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" placeholder="Search by name, host, or username..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-md pl-9 pr-4 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">✕</button>}
        </div>
      )}

      {/* Error */}
      {error && <div className="mb-6 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-md">{error}</div>}

      {/* Add Server Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-5">New Server</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Name <span className="text-emerald-500">*</span></label>
              <input className={inputClass} type="text" placeholder="Production DB" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Host <span className="text-emerald-500">*</span></label>
              <input className={inputClass} type="text" placeholder="192.168.1.1 or example.com" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Port <span className="text-emerald-500">*</span></label>
              <input className={inputClass} type="number" value={form.port} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Username <span className="text-emerald-500">*</span></label>
              <input className={inputClass} type="text" placeholder="ubuntu" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Password</label>
              <input className={inputClass} type="password" placeholder="Leave blank if using key" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Key Path</label>
              <input className={inputClass} type="text" placeholder="/Users/you/.ssh/id_rsa" value={form.key_path} onChange={(e) => setForm({ ...form, key_path: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-medium text-zinc-400">Group</label>
              <GroupSelect value={form.group || ""} onChange={(val) => setForm({ ...form, group: val })} groups={allGroups} />
              <p className="text-xs text-zinc-600">Select an existing group or type to create a new one.</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={submitting} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-md transition-colors">
              {submitting ? "Adding..." : "Add Server"}
            </button>
          </div>
        </form>
      )}

      {/* Edit Server Modal */}
      {editingServer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Edit Server</h2>
              <button onClick={() => setEditingServer(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Name <span className="text-emerald-500">*</span></label>
                  <input className={inputClass} type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Host <span className="text-emerald-500">*</span></label>
                  <input className={inputClass} type="text" value={editForm.host} onChange={(e) => setEditForm({ ...editForm, host: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Port <span className="text-emerald-500">*</span></label>
                  <input className={inputClass} type="number" value={editForm.port} onChange={(e) => setEditForm({ ...editForm, port: parseInt(e.target.value) })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Username <span className="text-emerald-500">*</span></label>
                  <input className={inputClass} type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Password</label>
                  <input className={inputClass} type="password" placeholder="Leave blank to keep existing" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Key Path</label>
                  <input className={inputClass} type="text" value={editForm.key_path} onChange={(e) => setEditForm({ ...editForm, key_path: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-medium text-zinc-400">Group</label>
                  <GroupSelect value={editForm.group || ""} onChange={(val) => setEditForm({ ...editForm, group: val })} groups={allGroups} />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingServer(null)} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 transition-colors">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-md transition-colors">
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Ping Modal */}
      {livePingServer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="font-mono text-xs text-zinc-500 ml-2">ping {livePingServer.host}</span>
              </div>
              <button onClick={closeLivePing} className="text-zinc-600 hover:text-zinc-300 transition-colors">✕</button>
            </div>
            <div ref={livePingRef} className="font-mono text-xs p-4 h-48 overflow-y-auto space-y-1">
              {livePingLines.length === 0 && livePingStatus === "running" && <p className="text-zinc-600 animate-pulse">Starting ping...</p>}
              {livePingLines.map((line, i) => <p key={i} className="text-zinc-400">{line}</p>)}
            </div>
            {livePingStatus === "done" && livePingResult && (
              <div className={`flex items-center gap-2 px-4 py-3 border-t border-zinc-800 ${livePingResult === "online" ? "bg-emerald-950/50" : "bg-red-950/50"}`}>
                <span className={`w-2 h-2 rounded-full ${livePingResult === "online" ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className={`text-sm font-medium ${livePingResult === "online" ? "text-emerald-400" : "text-red-400"}`}>{livePingServer.host} is {livePingResult}</span>
                <button onClick={closeLivePing} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Server List */}
      {loading ? (
        <div className="text-zinc-500 text-sm">Loading servers...</div>
      ) : servers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm">No servers yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Add one above to get started.</p>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm">No servers match your filters.</p>
          <button onClick={() => { setSearch(""); setSelectedGroup(null); }} className="text-zinc-600 hover:text-zinc-400 text-xs mt-2 transition-colors">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServers.map((server) => (
            <div key={server.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-zinc-100">{server.name}</h3>
                    {server.group && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${groupColor(server.group, allGroups)}`}>
                        {server.group}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-zinc-500 mt-0.5">{server.username}@{server.host}:{server.port}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/servers/${server.id}`} className="text-xs bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 font-semibold px-3 py-1.5 rounded transition-colors">Connect</Link>
                  <button onClick={() => handlePingClick(server)} disabled={pingStatuses[server.id] === "pinging"} className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors px-2 py-1.5 disabled:opacity-50">
                    {pingStatuses[server.id] === "pinging" ? "..." : "Ping"}
                  </button>
                  <button onClick={() => handleEditClick(server)} className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1.5">Edit</button>
                  <button onClick={() => handleDelete(server.id)} disabled={deletingId === server.id} className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1.5 disabled:opacity-50">
                    {deletingId === server.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <span className="text-xs text-zinc-600">{server.key_path ? "SSH Key" : "Password auth"}</span>
                </div>
                <PingIndicator serverId={server.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function PingIndicator({ serverId }: { serverId: number }) {
    const status = pingStatuses[serverId] || "idle";
    if (status === "idle") return null;
    const map: Record<PingStatus, { color: string; label: string }> = {
      idle: { color: "bg-zinc-600", label: "" },
      pinging: { color: "bg-yellow-400 animate-pulse", label: "pinging..." },
      online: { color: "bg-emerald-400", label: "online" },
      offline: { color: "bg-red-400", label: "offline" },
    };
    const { color, label } = map[status];
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
    );
  }
}

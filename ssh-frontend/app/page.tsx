"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getServers,
  createServer,
  deleteServer,
  updateServer,
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
};

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
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, []);

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
    });
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingServer) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const updated = await updateServer(editingServer.id, editForm);
      setServers((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      setEditingServer(null);
    } catch {
      setError("Failed to update server.");
    } finally {
      setEditSubmitting(false);
    }
  }

  const filteredServers = servers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.host.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q)
    );
  });

  const inputClass =
    "bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Servers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {servers.length} server{servers.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setEditingServer(null);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-md transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Server"}
        </button>
      </div>

      {/* Search */}
      {!loading && servers.length > 0 && (
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, host, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-md pl-9 pr-4 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Add Server Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6"
        >
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-5">
            New Server
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Name <span className="text-emerald-500">*</span>
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="Production DB"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Host <span className="text-emerald-500">*</span>
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="192.168.1.1 or example.com"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Port <span className="text-emerald-500">*</span>
              </label>
              <input
                className={inputClass}
                type="number"
                value={form.port}
                onChange={(e) =>
                  setForm({ ...form, port: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Username <span className="text-emerald-500">*</span>
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="ubuntu"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Password
              </label>
              <input
                className={inputClass}
                type="password"
                placeholder="Leave blank if using key"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Key Path
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="/Users/you/.ssh/id_rsa"
                value={form.key_path}
                onChange={(e) => setForm({ ...form, key_path: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-md transition-colors"
            >
              {submitting ? "Adding..." : "Add Server"}
            </button>
          </div>
        </form>
      )}

      {/* Edit Server Modal */}
      {editingServer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                Edit Server
              </h2>
              <button
                onClick={() => setEditingServer(null)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Name <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Host <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="text"
                    value={editForm.host}
                    onChange={(e) =>
                      setEditForm({ ...editForm, host: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Port <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    value={editForm.port}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        port: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Username <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Password
                  </label>
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="Leave blank to keep existing"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    Key Path
                  </label>
                  <input
                    className={inputClass}
                    type="text"
                    value={editForm.key_path}
                    onChange={(e) =>
                      setEditForm({ ...editForm, key_path: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingServer(null)}
                  className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-md transition-colors"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Server List */}
      {loading ? (
        <div className="text-zinc-500 text-sm">Loading servers...</div>
      ) : servers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm">No servers yet.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Add one above to get started.
          </p>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm">
            No servers match &quot;{search}&quot;
          </p>
          <button
            onClick={() => setSearch("")}
            className="text-zinc-600 hover:text-zinc-400 text-xs mt-2 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServers.map((server) => (
            <div
              key={server.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-100">{server.name}</h3>
                  <p className="font-mono text-xs text-zinc-500 mt-0.5">
                    {server.username}@{server.host}:{server.port}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/servers/${server.id}`}
                    className="text-xs bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 font-semibold px-3 py-1.5 rounded transition-colors"
                  >
                    Connect
                  </Link>
                  <button
                    onClick={() => handleEditClick(server)}
                    className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1.5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(server.id)}
                    disabled={deletingId === server.id}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1.5 disabled:opacity-50"
                  >
                    {deletingId === server.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="text-xs text-zinc-600">
                  {server.key_path ? "SSH Key" : "Password auth"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import {
//   getServers,
//   createServer,
//   deleteServer,
//   Server,
//   ServerFormData,
// } from "../lib/api";

// const emptyForm: ServerFormData = {
//   name: "",
//   host: "",
//   port: 22,
//   username: "",
//   password: "",
//   key_path: "",
// };

// export default function DashboardPage() {
//   const [servers, setServers] = useState<Server[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState<ServerFormData>(emptyForm);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [deletingId, setDeletingId] = useState<number | null>(null);

//   useEffect(() => {
//     fetchServers();
//   }, []);

//   async function fetchServers() {
//     try {
//       const data = await getServers();
//       setServers(data);
//     } catch {
//       setError("Could not load servers. Is the backend running?");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setSubmitting(true);
//     setError(null);
//     try {
//       const newServer = await createServer(form);
//       setServers((prev) => [...prev, newServer]);
//       setForm(emptyForm);
//       setShowForm(false);
//     } catch {
//       setError("Failed to add server. Check your inputs and try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   async function handleDelete(id: number) {
//     setDeletingId(id);
//     try {
//       await deleteServer(id);
//       setServers((prev) => prev.filter((s) => s.id !== id));
//     } catch {
//       setError("Failed to delete server.");
//     } finally {
//       setDeletingId(null);
//     }
//   }

//   return (
//     <div>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-2xl font-semibold text-zinc-100">Servers</h1>
//           <p className="text-sm text-zinc-500 mt-1">
//             {servers.length} server{servers.length !== 1 ? "s" : ""} configured
//           </p>
//         </div>
//         <button
//           // onClick={() => setShowForm((v) => !v)}
//           onClick={() => console.log("Add Server button clicked")} // Placeholder for future functionality
//           className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-md transition-colors"
//         >
//           {showForm ? "Cancel" : "+ Add Server"}
//         </button>
//       </div>

//       {/* Error */}
//       {error && (
//         <div className="mb-6 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-md">
//           {error}
//         </div>
//       )}

//       {/* Add Server Form */}
//       {showForm && (
//         <form
//           onSubmit={handleSubmit}
//           className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6"
//         >
//           <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-5">
//             New Server
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Field label="Name" required>
//               <input
//                 type="text"
//                 placeholder="Production DB"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 required
//               />
//             </Field>
//             <Field label="Host" required>
//               <input
//                 type="text"
//                 placeholder="192.168.1.1 or example.com"
//                 value={form.host}
//                 onChange={(e) => setForm({ ...form, host: e.target.value })}
//                 required
//               />
//             </Field>
//             <Field label="Port" required>
//               <input
//                 type="number"
//                 value={form.port}
//                 onChange={(e) =>
//                   setForm({ ...form, port: parseInt(e.target.value) })
//                 }
//                 required
//               />
//             </Field>
//             <Field label="Username" required>
//               <input
//                 type="text"
//                 placeholder="ubuntu"
//                 value={form.username}
//                 onChange={(e) => setForm({ ...form, username: e.target.value })}
//                 required
//               />
//             </Field>
//             <Field label="Password">
//               <input
//                 type="password"
//                 placeholder="Leave blank if using key"
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//               />
//             </Field>
//             <Field label="Key Path">
//               <input
//                 type="text"
//                 placeholder="/Users/you/.ssh/id_rsa"
//                 value={form.key_path}
//                 onChange={(e) => setForm({ ...form, key_path: e.target.value })}
//               />
//             </Field>
//           </div>
//           <div className="mt-5 flex justify-end">
//             <button
//               type="submit"
//               disabled={submitting}
//               className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-md transition-colors"
//             >
//               {submitting ? "Adding..." : "Add Server"}
//             </button>
//           </div>
//         </form>
//       )}

//       {/* Server List */}
//       {loading ? (
//         <div className="text-zinc-500 text-sm">Loading servers...</div>
//       ) : servers.length === 0 ? (
//         <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
//           <p className="text-zinc-500 text-sm">No servers yet.</p>
//           <p className="text-zinc-600 text-xs mt-1">
//             Add one above to get started.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {servers.map((server) => (
//             <div
//               key={server.id}
//               className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors group"
//             >
//               <div className="flex items-start justify-between mb-3">
//                 <div>
//                   <h3 className="font-semibold text-zinc-100">{server.name}</h3>
//                   <p className="font-mono text-xs text-zinc-500 mt-0.5">
//                     {server.username}@{server.host}:{server.port}
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Link
//                     href={`/servers/${server.id}`}
//                     className="text-xs bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 font-semibold px-3 py-1.5 rounded transition-colors"
//                   >
//                     Connect
//                   </Link>
//                   <button
//                     onClick={() => handleDelete(server.id)}
//                     disabled={deletingId === server.id}
//                     className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1.5 disabled:opacity-50"
//                   >
//                     {deletingId === server.id ? "..." : "Delete"}
//                   </button>
//                 </div>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
//                 <span className="text-xs text-zinc-600">
//                   {server.key_path ? "SSH Key" : "Password auth"}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function Field({
//   label,
//   required,
//   children,
// }: {
//   label: string;
//   required?: boolean;
//   children: React.ReactElement;
// }) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       <label className="text-xs font-medium text-zinc-400">
//         {label}
//         {required && <span className="text-emerald-500 ml-0.5">*</span>}
//       </label>
//       {/* Clone the child and add shared input classes */}
//       {React.cloneElement(children, {
//         className:
//           "bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors",
//       })}
//     </div>
//   );
// }

// =========================================


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getServers,
  createServer,
  deleteServer,
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

  const inputClass =
    "bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 transition-colors";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Servers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {servers.length} server{servers.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-md transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Server"}
        </button>
      </div>

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

      {/* Server List */}
      {loading ? (
        <div className="text-zinc-500 text-sm">Loading servers...</div>
      ) : servers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm">No servers yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Add one above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((server) => (
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


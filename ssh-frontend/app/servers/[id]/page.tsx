"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getServer, getServerLogs, runCommand, Server, CommandLog } from "../../../lib/api";

export default function ServerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const serverId = parseInt(id as string);

  const [server, setServer] = useState<Server | null>(null);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [command, setCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<
    { command: string; output: string; time: string }[]
  >([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"terminal" | "history">("terminal");

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [srv, serverLogs] = await Promise.all([
          getServer(serverId),
          getServerLogs(serverId),
        ]);
        setServer(srv);
        setLogs(serverLogs);
      } catch {
        setError("Could not load server. It may have been deleted.");
      }
    }
    load();
  }, [serverId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim() || running) return;

    const cmd = command.trim();
    setCommand("");
    setRunning(true);
    setError(null);

    try {
      const result = await runCommand(serverId, cmd);
      setTerminalOutput((prev) => [
        ...prev,
        {
          command: cmd,
          output: result.output,
          time: new Date(result.created_at).toLocaleTimeString(),
        },
      ]);
      // Refresh logs
      const updatedLogs = await getServerLogs(serverId);
      setLogs(updatedLogs);
    } catch {
      setError("Failed to run command. Check your SSH connection.");
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  }

  if (error && !server) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">{error}</p>
        <Link href="/" className="text-zinc-500 text-xs mt-3 inline-block hover:text-zinc-300">
          ← Back to servers
        </Link>
      </div>
    );
  }

  if (!server) {
    return <div className="text-zinc-500 text-sm">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Servers
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]" />
          <h1 className="text-xl font-semibold text-zinc-100">{server.name}</h1>
        </div>
        <p className="font-mono text-xs text-zinc-500 mt-1 ml-5">
          {server.username}@{server.host}:{server.port}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-zinc-800">
        {(["terminal", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm px-4 py-2 font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
            {tab === "history" && logs.length > 0 && (
              <span className="ml-2 text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                {logs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Terminal */}
      {activeTab === "terminal" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="font-mono text-xs text-zinc-600 ml-2">
              {server.username}@{server.host}
            </span>
          </div>

          {/* Output area */}
          <div
            ref={terminalRef}
            className="terminal-output font-mono text-sm p-4 h-96 overflow-y-auto space-y-4"
            onClick={() => inputRef.current?.focus()}
          >
            {terminalOutput.length === 0 && (
              <p className="text-zinc-600 text-xs">
                Run a command below to get started.
              </p>
            )}
            {terminalOutput.map((entry, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">$</span>
                  <span className="text-zinc-300">{entry.command}</span>
                  <span className="text-zinc-700 text-xs ml-auto">{entry.time}</span>
                </div>
                <pre className="text-zinc-400 text-xs mt-1 whitespace-pre-wrap leading-relaxed pl-4 border-l border-zinc-800">
                  {entry.output}
                </pre>
              </div>
            ))}
            {running && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <span className="text-emerald-400">$</span>
                <span className="animate-pulse">Running...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleRun}
            className="flex items-center gap-3 px-4 py-3 border-t border-zinc-800 bg-zinc-950"
          >
            <span className="text-emerald-400 font-mono text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command..."
              disabled={running}
              autoFocus
              className="flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={running || !command.trim()}
              className="text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-zinc-950 font-semibold px-3 py-1.5 rounded transition-colors"
            >
              Run
            </button>
          </form>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-zinc-500 text-sm">No commands run yet.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 font-mono text-sm">$</span>
                  <span className="font-mono text-sm text-zinc-200">{log.command}</span>
                  <span className="ml-auto text-xs text-zinc-600">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <pre className="font-mono text-xs text-zinc-500 whitespace-pre-wrap leading-relaxed pl-4 border-l border-zinc-800">
                  {log.output}
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

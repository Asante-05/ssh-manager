"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getServer, getServerLogs, Server, CommandLog } from "../../../lib/api";

interface TerminalEntry {
  command: string;
  output: string;
  time: string;
  error?: boolean;
}

export default function ServerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const serverId = parseInt(id as string);

  const [server, setServer] = useState<Server | null>(null);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [command, setCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<TerminalEntry[]>([]);
  const [currentOutput, setCurrentOutput] = useState<string>("");
  const [currentCommand, setCurrentCommand] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"terminal" | "history">("terminal");
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }

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

    // Connect WebSocket
    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [serverId]);

  function connectWebSocket() {
    const token = localStorage.getItem("access_token");
    const ws = new WebSocket(
      `ws://localhost:8000/ws/servers/${serverId}/terminal/?token=${token}`
    );

    setWsStatus("connecting");

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("disconnected");

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "start") {
        setCurrentCommand(msg.command);
        setCurrentOutput("");
        setRunning(true);
      } else if (msg.type === "output") {
        setCurrentOutput(msg.data);
      } else if (msg.type === "done") {
        setTerminalOutput((prev) => [
          ...prev,
          {
            command: currentCommandRef.current,
            output: currentOutputRef.current,
            time: new Date().toLocaleTimeString(),
          },
        ]);
        setCurrentCommand("");
        setCurrentOutput("");
        setRunning(false);
        // Refresh logs
        getServerLogs(serverId).then(setLogs).catch(() => {});
        inputRef.current?.focus();
      } else if (msg.type === "error") {
        setTerminalOutput((prev) => [
          ...prev,
          {
            command: currentCommandRef.current,
            output: msg.data,
            time: new Date().toLocaleTimeString(),
            error: true,
          },
        ]);
        setRunning(false);
        inputRef.current?.focus();
      }
    };

    wsRef.current = ws;
  }

  // Refs to capture latest state inside ws.onmessage closure
  const currentCommandRef = useRef("");
  const currentOutputRef = useRef("");
  useEffect(() => { currentCommandRef.current = currentCommand; }, [currentCommand]);
  useEffect(() => { currentOutputRef.current = currentOutput; }, [currentOutput]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput, currentOutput]);

  function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim() || running) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected. Try refreshing.");
      return;
    }

    wsRef.current.send(JSON.stringify({ command: command.trim() }));
    setCommand("");
  }

  function exportLogs() {
    if (!logs.length || !server) return;
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const rows = [
      ["Timestamp", "Command", "Output"],
      ...logs.map((log) => [
        escape(new Date(log.created_at).toLocaleString()),
        escape(log.command),
        escape(log.output),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${server.name}-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const wsStatusColor = {
    connected: "bg-emerald-400",
    connecting: "bg-yellow-400 animate-pulse",
    disconnected: "bg-red-400",
  }[wsStatus];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Servers
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className={`w-2 h-2 rounded-full ${wsStatusColor}`} />
          <h1 className="text-xl font-semibold text-zinc-100">{server.name}</h1>
          <span className="text-xs text-zinc-600">{wsStatus}</span>
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
      <div className="flex items-center gap-1 mb-4 border-b border-zinc-800">
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

        {activeTab === "history" && logs.length > 0 && (
          <button
            onClick={exportLogs}
            className="ml-auto text-xs text-zinc-500 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-500 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Terminal */}
      {activeTab === "terminal" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="font-mono text-xs text-zinc-600 ml-2">
              {server.username}@{server.host}
            </span>
            {wsStatus === "disconnected" && (
              <button
                onClick={connectWebSocket}
                className="ml-auto text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>

          <div
            ref={terminalRef}
            className="terminal-output font-mono text-sm p-4 h-96 overflow-y-auto space-y-4"
            onClick={() => inputRef.current?.focus()}
          >
            {terminalOutput.length === 0 && !running && (
              <p className="text-zinc-600 text-xs">Run a command below to get started.</p>
            )}
            {terminalOutput.map((entry, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">$</span>
                  <span className="text-zinc-300">{entry.command}</span>
                  <span className="text-zinc-700 text-xs ml-auto">{entry.time}</span>
                </div>
                <pre className={`text-xs mt-1 whitespace-pre-wrap leading-relaxed pl-4 border-l ${entry.error ? "text-red-400 border-red-800" : "text-zinc-400 border-zinc-800"}`}>
                  {entry.output}
                </pre>
              </div>
            ))}
            {/* Live output while running */}
            {running && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">$</span>
                  <span className="text-zinc-300">{currentCommand}</span>
                  <span className="text-zinc-700 text-xs ml-auto animate-pulse">running...</span>
                </div>
                {currentOutput && (
                  <pre className="text-zinc-400 text-xs mt-1 whitespace-pre-wrap leading-relaxed pl-4 border-l border-zinc-800">
                    {currentOutput}
                  </pre>
                )}
              </div>
            )}
          </div>

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
              placeholder={wsStatus === "connected" ? "Enter command..." : "Waiting for connection..."}
              disabled={running || wsStatus !== "connected"}
              autoFocus
              className="flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={running || !command.trim() || wsStatus !== "connected"}
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
              <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
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

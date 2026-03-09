"use client";
import { useState, useCallback } from "react";
import StatCard from "@/components/stat-card";
import { format } from "date-fns";

interface PromptVersion {
  id: string;
  prompt_type: string;
  version: string;
  status: string;
  content: string;
  change_summary: string | null;
  parent_version: string | null;
  model: string | null;
  author: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  initialVersions: PromptVersion[];
}

const STATUS_COLORS: Record<string, string> = {
  production: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  testing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  deprecated: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ORDER = ["production", "testing", "draft", "deprecated"];

function computeDiff(a: string, b: string): { type: "same" | "added" | "removed"; text: string }[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const result: { type: "same" | "added" | "removed"; text: string }[] = [];

  const maxLen = Math.max(linesA.length, linesB.length);
  let ia = 0;
  let ib = 0;

  while (ia < linesA.length || ib < linesB.length) {
    if (ia < linesA.length && ib < linesB.length && linesA[ia] === linesB[ib]) {
      result.push({ type: "same", text: linesA[ia] });
      ia++;
      ib++;
    } else if (ib < linesB.length && (ia >= linesA.length || !linesA.slice(ia, ia + 5).includes(linesB[ib]))) {
      result.push({ type: "added", text: linesB[ib] });
      ib++;
    } else if (ia < linesA.length && (ib >= linesB.length || !linesB.slice(ib, ib + 5).includes(linesA[ia]))) {
      result.push({ type: "removed", text: linesA[ia] });
      ia++;
    } else {
      if (ia < linesA.length) {
        result.push({ type: "removed", text: linesA[ia] });
        ia++;
      }
      if (ib < linesB.length) {
        result.push({ type: "added", text: linesB[ib] });
        ib++;
      }
    }

    if (result.length > maxLen * 3) break;
  }

  return result;
}

export default function PromptLabClient({ initialVersions }: Props) {
  const [versions, setVersions] = useState<PromptVersion[]>(initialVersions);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");
  const [view, setView] = useState<"list" | "create" | "diff" | "detail">("list");
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [diffA, setDiffA] = useState<string>("");
  const [diffB, setDiffB] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newVersion, setNewVersion] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newParent, setNewParent] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newStatus, setNewStatus] = useState<string>("draft");

  const filtered = versions.filter((v) => v.prompt_type === activeTab);
  const sorted = [...filtered].sort((a, b) => {
    const sa = STATUS_ORDER.indexOf(a.status);
    const sb = STATUS_ORDER.indexOf(b.status);
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const productionVersion = filtered.find((v) => v.status === "production");
  const testingCount = filtered.filter((v) => v.status === "testing").length;

  const refreshVersions = useCallback(async () => {
    const res = await fetch("/api/prompt-versions");
    if (res.ok) setVersions(await res.json());
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    setSaving(true);
    const res = await fetch("/api/prompt-versions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) await refreshVersions();
    setSaving(false);
  }, [refreshVersions]);

  const createVersion = useCallback(async () => {
    if (!newVersion || !newContent) return;
    setSaving(true);
    const res = await fetch("/api/prompt-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt_type: activeTab,
        version: newVersion,
        content: newContent,
        change_summary: newSummary || null,
        parent_version: newParent || null,
        model: newModel || null,
        status: newStatus,
      }),
    });
    if (res.ok) {
      await refreshVersions();
      setNewVersion("");
      setNewContent("");
      setNewSummary("");
      setNewParent("");
      setNewModel("");
      setNewStatus("draft");
      setView("list");
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create version");
    }
    setSaving(false);
  }, [activeTab, newVersion, newContent, newSummary, newParent, newModel, newStatus, refreshVersions]);

  const openDiff = useCallback((a: PromptVersion, b: PromptVersion) => {
    setDiffA(a.version);
    setDiffB(b.version);
    setView("diff");
  }, []);

  const versionA = filtered.find((v) => v.version === diffA);
  const versionB = filtered.find((v) => v.version === diffB);
  const diffLines = versionA && versionB ? computeDiff(versionA.content, versionB.content) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prompt Lab</h1>
          <p className="text-sm text-zinc-500 mt-1">Version, test, and deploy system prompts</p>
        </div>
        <div className="flex gap-2">
          {view !== "list" && (
            <button
              onClick={() => setView("list")}
              className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Back to list
            </button>
          )}
          {view === "list" && (
            <>
              <button
                onClick={() => {
                  const latestVersion = sorted[0]?.version || "1.0.0";
                  const parts = latestVersion.split(".").map(Number);
                  parts[1]++;
                  parts[2] = 0;
                  setNewVersion(parts.join("."));
                  setNewParent(latestVersion);
                  setNewContent(productionVersion?.content || "");
                  setView("create");
                }}
                className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                New Version
              </button>
              <button
                onClick={() => {
                  const versions = sorted.filter((v) => v.status !== "deprecated");
                  if (versions.length >= 2) {
                    setDiffA(versions[1]?.version || "");
                    setDiffB(versions[0]?.version || "");
                    setView("diff");
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Compare
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "chat"
              ? "bg-violet-600/20 text-violet-300 border border-violet-600/40"
              : "bg-zinc-800/60 text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          Chat Prompts
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "voice"
              ? "bg-cyan-600/20 text-cyan-300 border border-cyan-600/40"
              : "bg-zinc-800/60 text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          Voice Prompts
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Versions"
          value={filtered.length}
        />
        <StatCard
          title="Production"
          value={productionVersion?.version || "None"}
          color="green"
        />
        <StatCard
          title="In Testing"
          value={testingCount}
          color={testingCount > 0 ? "amber" : "default"}
        />
        <StatCard
          title="Latest"
          value={sorted[0]?.version || "—"}
          color="purple"
        />
      </div>

      {/* List view */}
      {view === "list" && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            All Versions ({activeTab})
          </h2>
          {sorted.length === 0 ? (
            <p className="text-zinc-600 text-sm py-8 text-center">
              No prompt versions yet. Create one to get started.
            </p>
          ) : (
            sorted.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono font-bold text-white">v{v.version}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[v.status]}`}>
                      {v.status}
                    </span>
                    {v.model && (
                      <span className="text-[10px] text-zinc-600 font-mono">{v.model}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">
                      {format(new Date(v.created_at), "MMM d, yyyy")} by {v.author}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedVersion(v);
                        setView("detail");
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      View
                    </button>
                    {v.status === "draft" && (
                      <button
                        onClick={() => updateStatus(v.id, "testing")}
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                      >
                        Start Testing
                      </button>
                    )}
                    {v.status === "testing" && (
                      <button
                        onClick={() => updateStatus(v.id, "production")}
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                      >
                        Deploy
                      </button>
                    )}
                    {(v.status === "testing" || v.status === "production") && (
                      <button
                        onClick={() => updateStatus(v.id, "deprecated")}
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        Deprecate
                      </button>
                    )}
                  </div>
                </div>
                {v.change_summary && (
                  <p className="text-xs text-zinc-500 mt-2">{v.change_summary}</p>
                )}
                {v.parent_version && (
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Parent: v{v.parent_version}
                  </p>
                )}
                <p className="text-[10px] text-zinc-700 mt-2 font-mono truncate">
                  {v.content.slice(0, 150)}...
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail view */}
      {view === "detail" && selectedVersion && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white font-mono">v{selectedVersion.version}</h2>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[selectedVersion.status]}`}>
              {selectedVersion.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-zinc-500">Type</p>
              <p className="text-zinc-300 mt-0.5">{selectedVersion.prompt_type}</p>
            </div>
            <div>
              <p className="text-zinc-500">Author</p>
              <p className="text-zinc-300 mt-0.5">{selectedVersion.author}</p>
            </div>
            <div>
              <p className="text-zinc-500">Model</p>
              <p className="text-zinc-300 mt-0.5 font-mono">{selectedVersion.model || "—"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Parent</p>
              <p className="text-zinc-300 mt-0.5 font-mono">{selectedVersion.parent_version || "—"}</p>
            </div>
          </div>

          {selectedVersion.change_summary && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500 mb-1">Change Summary</p>
              <p className="text-sm text-zinc-300">{selectedVersion.change_summary}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Prompt Content</p>
              <p className="text-[10px] text-zinc-600">
                {selectedVersion.content.length.toLocaleString()} chars /
                ~{Math.ceil(selectedVersion.content.split(/\s+/).length / 1).toLocaleString()} words
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                {selectedVersion.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Create view */}
      {view === "create" && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">
            New {activeTab === "chat" ? "Chat" : "Voice"} Prompt Version
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Version</label>
              <input
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="1.2.0"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:border-violet-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-violet-600 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="testing">Testing</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Parent Version</label>
              <input
                value={newParent}
                onChange={(e) => setNewParent(e.target.value)}
                placeholder="1.0.0"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:border-violet-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Model</label>
              <input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="google/gemini-3.1-flash-lite-preview"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:border-violet-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Change Summary</label>
            <input
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Brief description of what changed"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-violet-600 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-500">Prompt Content</label>
              <span className="text-[10px] text-zinc-600">
                {newContent.length.toLocaleString()} chars
              </span>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={24}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed focus:border-violet-600 focus:outline-none resize-y"
              placeholder="Paste or write the full system prompt here..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createVersion}
              disabled={saving || !newVersion || !newContent}
              className="px-6 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Create Version"}
            </button>
            <button
              onClick={() => setView("list")}
              className="px-6 py-2.5 text-sm rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Diff view */}
      {view === "diff" && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">Compare Versions</h2>

          <div className="flex gap-4 items-end">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Version A (old)</label>
              <select
                value={diffA}
                onChange={(e) => setDiffA(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:border-violet-600 focus:outline-none"
              >
                <option value="">Select...</option>
                {filtered.map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-zinc-600 text-lg pb-2">vs</div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Version B (new)</label>
              <select
                value={diffB}
                onChange={(e) => setDiffB(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:border-violet-600 focus:outline-none"
              >
                <option value="">Select...</option>
                {filtered.map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {versionA && versionB ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 max-h-[600px] overflow-y-auto">
              <div className="flex items-center gap-4 mb-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                  Removed from v{diffA}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                  Added in v{diffB}
                </span>
              </div>
              <div className="font-mono text-xs leading-relaxed">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 ${
                      line.type === "added"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : line.type === "removed"
                          ? "bg-red-500/10 text-red-300"
                          : "text-zinc-500"
                    }`}
                  >
                    <span className="inline-block w-4 text-zinc-700 select-none">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    {line.text || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-600 text-sm py-8 text-center">
              Select two versions to compare.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import StatCard from "@/components/stat-card";
import SessionViewer from "@/components/session-viewer";
import { format } from "date-fns";

interface Session {
  id: string;
  user_id: string;
  session_number: number;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
  key_themes: string[] | null;
  crisis_flag: boolean;
}

interface QualityStats {
  totalProcessed: number;
  avgEchoesPerSession: number;
  avgCommitmentsPerSession: number;
  avgHabitsPerSession: number;
  avgGoalsPerSession: number;
  recentExtractions: { details: any; created_at: string }[];
}

interface Props {
  quality: QualityStats;
  sessions: Session[];
}

export default function AIQualityClient({ quality, sessions }: Props) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "crisis">("all");

  const loadMessages = useCallback(async (sessionId: string) => {
    setLoading(true);
    const res = await fetch(`/api/session-messages?sessionId=${sessionId}`);
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedSession) loadMessages(selectedSession);
  }, [selectedSession, loadMessages]);

  const filtered = filter === "crisis" ? sessions.filter((s) => s.crisis_flag) : sessions;
  const crisisCount = sessions.filter((s) => s.crisis_flag).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Quality</h1>
        <p className="text-sm text-zinc-500 mt-1">Session processing and extraction analytics</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Extraction Rates (per session)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Processed" value={quality.totalProcessed} color="purple" />
          <StatCard title="Echoes" value={quality.avgEchoesPerSession} subtitle="avg per session" />
          <StatCard title="Commitments" value={quality.avgCommitmentsPerSession} subtitle="avg per session" />
          <StatCard title="Habits" value={quality.avgHabitsPerSession} subtitle="avg per session" />
          <StatCard title="Goals" value={quality.avgGoalsPerSession} subtitle="avg per session" />
        </div>
      </div>

      {crisisCount > 0 && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-300">
            {crisisCount} crisis session{crisisCount > 1 ? "s" : ""} detected in recent sessions
          </p>
          <p className="text-xs text-red-400/70 mt-1">Review flagged conversations below</p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Conversation Review</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full text-xs ${filter === "all" ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter("crisis")}
              className={`px-3 py-1 rounded-full text-xs ${filter === "crisis" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              Crisis ({crisisCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedSession === s.id
                    ? "border-violet-600 bg-violet-600/10"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">#{s.session_number}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      s.session_type === "voice" ? "bg-cyan-500/20 text-cyan-400" : "bg-violet-500/20 text-violet-400"
                    }`}>
                      {s.session_type}
                    </span>
                    {s.crisis_flag && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">CRISIS</span>}
                  </div>
                  <span className="text-[10px] text-zinc-600">
                    {format(new Date(s.started_at), "MMM d, h:mm a")}
                  </span>
                </div>
                {s.summary && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.summary}</p>}
                {s.key_themes && s.key_themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.key_themes.slice(0, 3).map((t: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-zinc-600 text-sm py-4">No sessions match the filter.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Transcript</h3>
            {selectedSession ? (
              loading ? (
                <p className="text-zinc-500 text-sm">Loading messages...</p>
              ) : (
                <SessionViewer messages={messages} />
              )
            ) : (
              <p className="text-zinc-600 text-sm">Select a session to review its transcript.</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Recent Extractions Log</h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-zinc-900 border-b border-zinc-800">
                  <th className="px-3 py-2 text-left text-zinc-500 font-medium">Time</th>
                  <th className="px-3 py-2 text-left text-zinc-500 font-medium">Echoes</th>
                  <th className="px-3 py-2 text-left text-zinc-500 font-medium">Commitments</th>
                  <th className="px-3 py-2 text-left text-zinc-500 font-medium">Habits</th>
                  <th className="px-3 py-2 text-left text-zinc-500 font-medium">Goals</th>
                </tr>
              </thead>
              <tbody>
                {quality.recentExtractions.map((e, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="px-3 py-2 text-zinc-500">{format(new Date(e.created_at), "MMM d, h:mm a")}</td>
                    <td className="px-3 py-2 text-zinc-300">{e.details?.echoes_extracted ?? 0}</td>
                    <td className="px-3 py-2 text-zinc-300">{e.details?.commitments_extracted ?? 0}</td>
                    <td className="px-3 py-2 text-zinc-300">{e.details?.habits_extracted ?? 0}</td>
                    <td className="px-3 py-2 text-zinc-300">{e.details?.goals_extracted ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

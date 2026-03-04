"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  action: string;
  details: any;
  user_id: string | null;
  created_at: string;
}

interface SessionEntry {
  id: string;
  user_id: string;
  session_type: string;
  started_at: string;
  crisis_flag: boolean;
}

interface UserEntry {
  id: string;
  email: string;
  created_at: string;
}

interface Activity {
  audit: AuditEntry[];
  recentSessions: SessionEntry[];
  recentUsers: UserEntry[];
}

const ACTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  session_started: { icon: "💬", color: "text-violet-400", label: "Session started" },
  session_message: { icon: "📝", color: "text-zinc-400", label: "Message sent" },
  session_ended: { icon: "✅", color: "text-emerald-400", label: "Session ended" },
  session_processed: { icon: "🧠", color: "text-cyan-400", label: "Session processed" },
  referral_applied: { icon: "🔗", color: "text-blue-400", label: "Referral applied" },
  referral_activated: { icon: "🎉", color: "text-green-400", label: "Referral activated" },
  scheduler_run: { icon: "⏰", color: "text-amber-400", label: "Scheduler ran" },
  crisis_detected: { icon: "🚨", color: "text-red-400", label: "Crisis detected" },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] ?? { icon: "📌", color: "text-zinc-400", label: action.replace(/_/g, " ") };
}

export default function FeedClient({ initialActivity }: { initialActivity: Activity }) {
  const [activity, setActivity] = useState(initialActivity);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      setActivity(data);
    } catch {
      // Silently fail on network issues
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const combinedFeed = [
    ...activity.audit.map((a) => ({
      type: "audit" as const,
      action: a.action,
      userId: a.user_id,
      details: a.details,
      time: a.created_at,
    })),
    ...activity.recentUsers.map((u) => ({
      type: "new_user" as const,
      action: "new_user",
      userId: u.id,
      details: { email: u.email },
      time: u.created_at,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Feed</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time activity stream</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors">
            Refresh now
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              autoRefresh
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-700/30"
                : "bg-zinc-800 text-zinc-500 border-zinc-700"
            }`}
          >
            {autoRefresh ? "Auto-refresh ON (10s)" : "Auto-refresh OFF"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {combinedFeed.map((event, i) => {
          const config = event.action === "new_user"
            ? { icon: "👤", color: "text-green-400", label: "New user signed up" }
            : getActionConfig(event.action);

          return (
            <div key={i} className="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-zinc-900/50 transition-colors border-b border-zinc-800/30">
              <span className="text-lg mt-0.5">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  {event.userId && (
                    <span className="text-[10px] text-zinc-600 font-mono truncate max-w-[120px]">
                      {event.userId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                {event.details && (
                  <p className="text-xs text-zinc-600 mt-0.5 truncate">
                    {typeof event.details === "string"
                      ? event.details
                      : Object.entries(event.details)
                          .filter(([, v]) => v !== null && v !== undefined)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0">
                {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
              </span>
            </div>
          );
        })}

        {combinedFeed.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-sm">No recent activity. Waiting for events...</p>
          </div>
        )}
      </div>
    </div>
  );
}

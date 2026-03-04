"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/stat-card";
import SessionViewer from "@/components/session-viewer";
import ChartArea from "@/components/chart-area";
import { format, formatDistanceToNow } from "date-fns";

interface SessionRow {
  id: string;
  session_number: number;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
  key_themes: string[] | null;
  crisis_flag: boolean;
}

interface Props {
  detail: {
    user: any;
    sessions: SessionRow[];
    moods: { mood_score: number; notes: string | null; logged_at: string }[];
    goals: any[];
    habits: any[];
    echoes: any[];
    patterns: any[];
    memory: { content: string; version: number; updated_at: string } | null;
    relationships: any[];
    lifeDomains: any[];
    dailyCheckins: any[];
    reminders: any[];
    referralCode: { code: string; created_at: string } | null;
    referralsGiven: any[];
    referralReceived: any | null;
    voiceNotes: any[];
    stats: {
      totalSessions: number;
      completedSessions: number;
      meaningfulSessions: number;
      completionRate: number;
      extractionRate: number;
      commitmentsDone: number;
      commitmentsNotDone: number;
      commitmentsPending: number;
      followThroughRate: number;
    };
  };
}

const PATTERN_ICONS: Record<string, string> = {
  mood_trend: "📈",
  trigger_correlation: "⚡",
  improvement: "🌱",
  recurring_theme: "🔄",
};

const DOMAIN_META: Record<string, { label: string; color: string; icon: string }> = {
  health: { label: "Health", color: "#10b981", icon: "💪" },
  career: { label: "Career", color: "#3b82f6", icon: "💼" },
  relationships: { label: "Relationships", color: "#f43f5e", icon: "❤️" },
  personal_growth: { label: "Growth", color: "#8b5cf6", icon: "🌱" },
  rest_recovery: { label: "Rest", color: "#06b6d4", icon: "😴" },
  fun_creativity: { label: "Fun", color: "#f59e0b", icon: "🎨" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-white mb-4">{children}</h2>;
}

function Badge({ children, color = "zinc" }: { children: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    zinc: "bg-zinc-700/30 text-zinc-400",
    green: "bg-emerald-500/20 text-emerald-400",
    violet: "bg-violet-500/20 text-violet-400",
    amber: "bg-amber-500/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    blue: "bg-blue-500/20 text-blue-400",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colorMap[color] ?? colorMap.zinc}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 ${className}`}>
      {children}
    </div>
  );
}

export default function UserDetailClient({ detail }: Props) {
  const {
    user, sessions, moods, goals, habits, echoes, patterns, memory,
    relationships, lifeDomains, dailyCheckins, reminders,
    referralCode, referralsGiven, referralReceived, voiceNotes, stats,
  } = detail;
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "echoes" | "checkins">("sessions");

  const loadMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/session-messages?sessionId=${sessionId}`);
    const data = await res.json();
    setMessages(data);
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (selectedSession) loadMessages(selectedSession);
  }, [selectedSession, loadMessages]);

  const moodData = moods.slice().reverse().map((m) => ({
    date: m.logged_at.split("T")[0],
    mood: m.mood_score,
  }));

  const activeGoals = goals.filter((g: any) => g.status === "active");
  const completedGoals = goals.filter((g: any) => g.status === "completed");
  const activeHabits = habits.filter((h: any) => h.status === "active");

  const latestDomains: Record<string, number> = {};
  lifeDomains.forEach((d: any) => {
    if (!latestDomains[d.domain]) latestDomains[d.domain] = d.score;
  });

  const preferences = user.preferences ?? {};

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button onClick={() => router.back()} className="text-sm text-violet-400 hover:text-violet-300">
        ← Back to Users
      </button>

      {/* ─── User Header ─── */}
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center text-2xl font-bold text-violet-300">
          {(user.display_name || user.email || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{user.display_name || user.email}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
            <span>Joined {format(new Date(user.created_at), "MMM d, yyyy")}</span>
            {user.onboarding_completed_at ? (
              <Badge color="green">Onboarded</Badge>
            ) : (
              <Badge color="amber">Not onboarded</Badge>
            )}
            {user.companion_name && <span>🤖 {user.companion_name}</span>}
            {user.timezone && <span>🌍 {user.timezone}</span>}
            {user.push_token ? <Badge color="green">Push enabled</Badge> : <Badge color="zinc">No push</Badge>}
            {referralReceived && <Badge color="cyan">Referred</Badge>}
          </div>
          {preferences.onboarding_reason && (
            <div className="flex gap-2 mt-2 text-xs text-zinc-500">
              <span>Reason: <span className="text-zinc-300">{preferences.onboarding_reason}</span></span>
              {preferences.stress_response && (
                <span>· Stress response: <span className="text-zinc-300">{preferences.stress_response}</span></span>
              )}
            </div>
          )}
          {user.future_self_vision && (
            <p className="mt-2 text-xs text-zinc-500 italic max-w-xl">
              &quot;{user.future_self_vision}&quot;
            </p>
          )}
        </div>
      </div>

      {/* ─── Key Metrics ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard title="Sessions" value={stats.totalSessions} subtitle={`${stats.completedSessions} completed`} />
        <StatCard title="Meaningful" value={stats.meaningfulSessions} color="purple" subtitle={`${stats.extractionRate}% extraction`} />
        <StatCard title="Completion" value={`${stats.completionRate}%`} color={stats.completionRate >= 50 ? "green" : "amber"} />
        <StatCard title="Follow-through" value={`${stats.followThroughRate}%`} color={stats.followThroughRate >= 40 ? "green" : "amber"} subtitle={`${stats.commitmentsDone}/${stats.commitmentsDone + stats.commitmentsNotDone}`} />
        <StatCard title="Streak" value={user.current_streak ?? 0} color="amber" subtitle={`Best: ${user.longest_streak ?? 0}`} />
        <StatCard title="Goals" value={activeGoals.length} color="green" subtitle={`${completedGoals.length} done`} />
        <StatCard title="Habits" value={activeHabits.length} color="purple" subtitle={`${habits.length} total`} />
        <StatCard title="Patterns" value={patterns.length} subtitle={`${relationships.length} people`} />
      </div>

      {/* ─── Life Domains ─── */}
      {Object.keys(latestDomains).length > 0 && (
        <Card>
          <SectionTitle>Life Domains (Latest Assessment)</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(latestDomains).map(([domain, score]) => {
              const meta = DOMAIN_META[domain] ?? { label: domain, color: "#71717a", icon: "📊" };
              return (
                <div key={domain} className="text-center">
                  <div className="text-2xl mb-1">{meta.icon}</div>
                  <div className="text-xs text-zinc-500 mb-1">{meta.label}</div>
                  <div className="relative h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="absolute h-full rounded-full transition-all"
                      style={{ width: `${score * 10}%`, backgroundColor: meta.color }}
                    />
                  </div>
                  <div className="text-sm font-bold mt-1" style={{ color: meta.color }}>{score}/10</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── Mood Chart ─── */}
      {moodData.length > 0 && (
        <ChartArea data={moodData} xKey="date" yKey="mood" title="Mood Over Time" color="#f59e0b" height={200} />
      )}

      {/* ─── Relationships ─── */}
      {relationships.length > 0 && (
        <div>
          <SectionTitle>Relationships ({relationships.length})</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relationships.map((r: any) => (
              <Card key={r.id} className="!p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{r.name}</span>
                  <Badge color={
                    (r.sentiment_trend ?? 0) > 0 ? "green" :
                    (r.sentiment_trend ?? 0) < 0 ? "red" : "zinc"
                  }>
                    {r.relation_type ?? "Unknown"}
                  </Badge>
                </div>
                <div className="flex gap-3 text-[11px] text-zinc-500">
                  <span>Mentioned {r.mentioned_count}x</span>
                  {r.sentiment_trend != null && (
                    <span>
                      Sentiment: <span className={r.sentiment_trend > 0 ? "text-emerald-400" : r.sentiment_trend < 0 ? "text-red-400" : "text-zinc-400"}>
                        {r.sentiment_trend > 0 ? "+" : ""}{r.sentiment_trend.toFixed(1)}
                      </span>
                    </span>
                  )}
                </div>
                {r.notes && <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{r.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tabbed: Sessions / Echoes / Check-ins ─── */}
      <div>
        <div className="flex gap-1 mb-4 bg-zinc-900 rounded-lg p-1 w-fit">
          {(["sessions", "echoes", "checkins"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "sessions" ? `Sessions (${sessions.length})` :
               tab === "echoes" ? `Commitments (${echoes.length})` :
               `Check-ins (${dailyCheckins.length})`}
            </button>
          ))}
        </div>

        {activeTab === "sessions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const duration = s.ended_at
                    ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
                    : null;
                  return (
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
                          <Badge color={s.session_type === "voice" ? "cyan" : "violet"}>{s.session_type}</Badge>
                          {s.crisis_flag && <Badge color="red">CRISIS</Badge>}
                          {!s.ended_at && <Badge color="amber">abandoned</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                          {duration !== null && <span>{duration}min</span>}
                          <span>{format(new Date(s.started_at), "MMM d, h:mm a")}</span>
                        </div>
                      </div>
                      {s.summary && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.summary}</p>}
                      {s.key_themes && s.key_themes.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {s.key_themes.slice(0, 4).map((t, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
                {sessions.length === 0 && <p className="text-sm text-zinc-600">No sessions yet.</p>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Transcript</h3>
              {selectedSession ? (
                loadingMessages ? (
                  <p className="text-zinc-500 text-sm">Loading...</p>
                ) : (
                  <SessionViewer messages={messages} />
                )
              ) : (
                <p className="text-zinc-600 text-sm">Select a session to view transcript.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "echoes" && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {echoes.map((e: any) => (
              <Card key={e.id} className="!p-4">
                <div className="flex items-center justify-between mb-1">
                  <Badge color={
                    e.outcome === "done" ? "green" :
                    e.outcome === "not_done" ? "red" :
                    e.outcome === "partially" ? "amber" :
                    e.outcome === "rescheduled" ? "blue" :
                    e.committed_for ? "violet" : "zinc"
                  }>
                    {e.outcome ?? (e.committed_for ? "pending" : "no commitment")}
                  </Badge>
                  <span className="text-[10px] text-zinc-600">
                    {format(new Date(e.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-white">{e.action_item}</p>
                {e.context && <p className="text-xs text-zinc-500 mt-1">{e.context}</p>}
                <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                  {e.committed_for && <span>Due: {format(new Date(e.committed_for), "MMM d, h:mm a")}</span>}
                  {e.check_in_at && <span>Checked: {format(new Date(e.check_in_at), "MMM d")}</span>}
                  {e.follow_up_response && <span>Response: {e.follow_up_response}</span>}
                </div>
              </Card>
            ))}
            {echoes.length === 0 && <p className="text-sm text-zinc-600">No commitments yet.</p>}
          </div>
        )}

        {activeTab === "checkins" && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {dailyCheckins.map((c: any) => (
              <Card key={c.id} className="!p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {format(new Date(c.checkin_date + "T12:00:00"), "EEEE, MMM d")}
                  </span>
                  <div className="flex gap-2">
                    {c.energy_level && <Badge color="amber">Energy: {c.energy_level}/10</Badge>}
                    {c.day_rating && <Badge color="violet">Day: {c.day_rating}/10</Badge>}
                    {c.intention_completed != null && (
                      <Badge color={c.intention_completed ? "green" : "red"}>
                        {c.intention_completed ? "Intention met" : "Intention missed"}
                      </Badge>
                    )}
                  </div>
                </div>
                {c.morning_intention && (
                  <p className="text-xs text-zinc-400"><span className="text-zinc-600">Morning:</span> {c.morning_intention}</p>
                )}
                {c.evening_reflection && (
                  <p className="text-xs text-zinc-400 mt-1"><span className="text-zinc-600">Evening:</span> {c.evening_reflection}</p>
                )}
                {c.wins && c.wins.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {c.wins.map((w: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">🏆 {w}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
            {dailyCheckins.length === 0 && <p className="text-sm text-zinc-600">No daily check-ins yet.</p>}
          </div>
        )}
      </div>

      {/* ─── Patterns ─── */}
      {patterns.length > 0 && (
        <div>
          <SectionTitle>AI-Detected Patterns ({patterns.length})</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patterns.map((p: any) => (
              <Card key={p.id} className="!p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{PATTERN_ICONS[p.pattern_type] ?? "📊"}</span>
                  <Badge color={
                    p.pattern_type === "improvement" ? "green" :
                    p.pattern_type === "trigger_correlation" ? "amber" :
                    p.pattern_type === "mood_trend" ? "blue" : "violet"
                  }>{p.pattern_type.replace(/_/g, " ")}</Badge>
                  <span className="text-[10px] text-zinc-600 ml-auto">
                    {format(new Date(p.detected_at), "MMM d")}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{p.description}</p>
                {p.acknowledged_by_user && <Badge color="green">Acknowledged</Badge>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Goals ─── */}
      {goals.length > 0 && (
        <div>
          <SectionTitle>Goals ({activeGoals.length} active, {completedGoals.length} completed)</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((g: any) => (
              <Card key={g.id} className="!p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge color={
                    g.status === "completed" ? "green" :
                    g.status === "active" ? "violet" : "zinc"
                  }>{g.status}</Badge>
                  {g.timeframe && <span className="text-[10px] text-zinc-600">{g.timeframe}</span>}
                  <span className="text-[10px] text-zinc-600 ml-auto">
                    {format(new Date(g.created_at), "MMM d")}
                  </span>
                </div>
                <p className="text-sm text-white font-medium">{g.title}</p>
                {g.description && <p className="text-xs text-zinc-500 mt-1">{g.description}</p>}
                {g.completed_at && (
                  <p className="text-[10px] text-emerald-400 mt-2">
                    Completed {format(new Date(g.completed_at), "MMM d, yyyy")}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Habits ─── */}
      {habits.length > 0 && (
        <div>
          <SectionTitle>Habits ({activeHabits.length} active)</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {habits.map((h: any) => (
              <Card key={h.id} className="!p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge color={
                    h.status === "active" ? "green" :
                    h.status === "paused" ? "amber" : "zinc"
                  }>{h.status}</Badge>
                  <span className="text-xs text-zinc-500">{h.frequency}</span>
                </div>
                <p className="text-sm text-white font-medium">{h.title}</p>
                {h.cue && <p className="text-xs text-zinc-500 mt-1">Cue: {h.cue}</p>}
                {h.reward && <p className="text-xs text-zinc-500">Reward: {h.reward}</p>}
                <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                  <span>🔥 {h.current_streak} streak</span>
                  <span>Best: {h.longest_streak}</span>
                  <span>{h.total_completions} total</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Reminders ─── */}
      {reminders.length > 0 && (
        <div>
          <SectionTitle>AI-Scheduled Reminders ({reminders.length})</SectionTitle>
          <div className="space-y-2">
            {reminders.map((r: any) => (
              <Card key={r.id} className="!p-3 flex items-center gap-3">
                <span className="text-lg">{r.sent ? "✅" : "⏰"}</span>
                <div className="flex-1">
                  <p className="text-sm text-white">{r.title}</p>
                  {r.body && <p className="text-xs text-zinc-500">{r.body}</p>}
                </div>
                <div className="text-right text-[10px] text-zinc-600">
                  <p>{format(new Date(r.scheduled_for), "MMM d, h:mm a")}</p>
                  <Badge color={r.sent ? "green" : "amber"}>{r.sent ? "Sent" : "Pending"}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Voice Notes ─── */}
      {voiceNotes.length > 0 && (
        <div>
          <SectionTitle>Voice Notes ({voiceNotes.length})</SectionTitle>
          <div className="space-y-2">
            {voiceNotes.map((v: any) => (
              <Card key={v.id} className="!p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>🎙️</span>
                    {v.duration_seconds && <span className="text-xs text-zinc-500">{Math.round(v.duration_seconds / 60)}min</span>}
                  </div>
                  <span className="text-[10px] text-zinc-600">{format(new Date(v.created_at), "MMM d, h:mm a")}</span>
                </div>
                {v.transcript && <p className="text-xs text-zinc-400 line-clamp-3">{v.transcript}</p>}
                {v.themes && v.themes.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {v.themes.map((t: string, i: number) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Referral Info ─── */}
      {(referralCode || referralsGiven.length > 0 || referralReceived) && (
        <div>
          <SectionTitle>Referrals</SectionTitle>
          <Card>
            <div className="space-y-3">
              {referralCode && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">Code:</span>
                  <span className="font-mono text-sm text-violet-400 bg-violet-500/10 px-2 py-1 rounded">{referralCode.code}</span>
                </div>
              )}
              {referralReceived && (
                <p className="text-xs text-zinc-400">
                  Referred by user <span className="text-zinc-300 font-mono">{referralReceived.referrer_id.slice(0, 8)}...</span>
                  {" · "}
                  <Badge color={referralReceived.status === "activated" ? "green" : referralReceived.status === "rewarded" ? "violet" : "amber"}>
                    {referralReceived.status}
                  </Badge>
                </p>
              )}
              {referralsGiven.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">
                    Invited {referralsGiven.length} user{referralsGiven.length > 1 ? "s" : ""}
                    {" · "}{referralsGiven.filter((r: any) => r.status === "activated").length} activated
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {referralsGiven.map((r: any) => (
                      <Badge key={r.id} color={r.status === "activated" ? "green" : r.status === "rewarded" ? "violet" : "amber"}>
                        {r.referred_id?.slice(0, 6) ?? "pending"} · {r.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ─── Memory Document ─── */}
      {memory && (
        <div>
          <SectionTitle>AI Memory Document</SectionTitle>
          <Card>
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed">
              {memory.content}
            </pre>
            <p className="text-[10px] text-zinc-600 mt-3 pt-3 border-t border-zinc-800">
              Version {memory.version} · Updated {format(new Date(memory.updated_at), "MMM d, yyyy h:mm a")}
              {" · "}{formatDistanceToNow(new Date(memory.updated_at), { addSuffix: true })}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

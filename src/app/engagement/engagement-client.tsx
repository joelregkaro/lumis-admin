"use client";
import StatCard from "@/components/stat-card";
import ChartPie from "@/components/chart-pie";

interface Commitment {
  done: number;
  notDone: number;
  partial: number;
  rescheduled: number;
  pending: number;
  total: number;
}

interface Habit {
  id: string;
  title: string;
  current_streak: number;
  total_completions: number;
  frequency: string;
  status: string;
}

interface Props {
  stats: {
    totalSessions: number;
    chatSessions: number;
    voiceSessions: number;
    completedSessions: number;
    avgDurationSec: number;
    habitsActive: number;
    topHabits: Habit[];
    commitments: Commitment;
    dailyCheckins: number;
    moodEntries: number;
    voiceNotes: number;
  };
}

export default function EngagementClient({ stats }: Props) {
  const sessionSplit = [
    { name: "Chat", value: stats.chatSessions },
    { name: "Voice", value: stats.voiceSessions },
  ];

  const commitmentBreakdown = [
    { name: "Done", value: stats.commitments.done },
    { name: "Not Done", value: stats.commitments.notDone },
    { name: "Partially", value: stats.commitments.partial },
    { name: "Rescheduled", value: stats.commitments.rescheduled },
    { name: "Pending", value: stats.commitments.pending },
  ].filter((c) => c.value > 0);

  const followThrough = stats.commitments.total > 0
    ? Math.round(((stats.commitments.done + stats.commitments.partial) / stats.commitments.total) * 100)
    : 0;

  const avgMins = Math.round(stats.avgDurationSec / 60);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Engagement</h1>
        <p className="text-sm text-zinc-500 mt-1">Last 30 days</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Session Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Sessions" value={stats.totalSessions} color="purple" />
          <StatCard title="Completed" value={stats.completedSessions} color="green" subtitle={`${stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}% rate`} />
          <StatCard title="Avg Duration" value={`${avgMins}m`} />
          <StatCard title="Chat / Voice" value={`${stats.chatSessions} / ${stats.voiceSessions}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPie data={sessionSplit} title="Session Type Split" />
        <ChartPie data={commitmentBreakdown} title="Commitment Outcomes" />
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Feature Usage</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Daily Check-ins" value={stats.dailyCheckins} />
          <StatCard title="Mood Entries" value={stats.moodEntries} />
          <StatCard title="Active Habits" value={stats.habitsActive} color="purple" />
          <StatCard title="Voice Notes" value={stats.voiceNotes} />
          <StatCard title="Follow-through" value={`${followThrough}%`} color={followThrough >= 50 ? "green" : "amber"} subtitle="Commitments" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Commitment Tracking</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total" value={stats.commitments.total} />
          <StatCard title="Done" value={stats.commitments.done} color="green" />
          <StatCard title="Not Done" value={stats.commitments.notDone} color="red" />
          <StatCard title="Partially" value={stats.commitments.partial} color="amber" />
          <StatCard title="Rescheduled" value={stats.commitments.rescheduled} />
        </div>
      </div>

      {stats.topHabits.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Top Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.topHabits.map((h) => (
              <div key={h.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-sm text-white font-medium">{h.title}</p>
                <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                  <span>{h.frequency}</span>
                  <span>🔥 {h.current_streak}</span>
                  <span>{h.total_completions} completions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

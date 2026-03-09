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
  eventData?: {
    screenBreakdown: { screen: string; count: number }[];
    topFeatureEvents: { name: string; count: number; users: number }[];
  };
}

export default function EngagementClient({ stats, eventData }: Props) {
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

      {eventData && eventData.topFeatureEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Feature Usage (from Events)</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Event</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Count</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {eventData.topFeatureEvents.map((e) => (
                  <tr key={e.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-2.5 text-zinc-300 font-mono">{e.name}</td>
                    <td className="px-4 py-2.5 text-right text-white font-semibold">{e.count}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">{e.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {eventData && eventData.screenBreakdown.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Screen Popularity (from Events)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {eventData.screenBreakdown.slice(0, 10).map((s) => (
              <div key={s.screen} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                <p className="text-xs text-zinc-500">{s.screen}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import ChartArea from "@/components/chart-area";

interface RollupRow {
  date: string;
  dau: number;
  sessions_started: number;
  sessions_completed: number;
  new_users: number;
  avg_mood: number | null;
  meaningful_sessions: number;
  session_completion_rate: number;
  extraction_rate: number;
  commitment_followthrough_rate: number;
  memory_updates: number;
}

export default function OverviewCharts({ rollup }: { rollup: RollupRow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartArea data={rollup} xKey="date" yKey="meaningful_sessions" title="Meaningful Sessions / Day" color="#a855f7" />
      <ChartArea data={rollup} xKey="date" yKey="dau" title="Daily Active Users" color="#8b5cf6" />
      <ChartArea data={rollup} xKey="date" yKey="sessions_started" title="Sessions Started / Day" color="#06b6d4" />
      <ChartArea data={rollup} xKey="date" yKey="session_completion_rate" title="Session Completion Rate (%)" color="#10b981" />
      <ChartArea data={rollup} xKey="date" yKey="extraction_rate" title="AI Extraction Rate (%)" color="#f59e0b" />
      <ChartArea data={rollup} xKey="date" yKey="new_users" title="New Users / Day" color="#10b981" />
      <ChartArea
        data={rollup.filter((r) => r.avg_mood !== null)}
        xKey="date"
        yKey="avg_mood"
        title="Average Mood Score"
        color="#f59e0b"
      />
      <ChartArea data={rollup} xKey="date" yKey="memory_updates" title="Memory Updates / Day" color="#8b5cf6" />
    </div>
  );
}

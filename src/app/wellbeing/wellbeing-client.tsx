"use client";
import StatCard from "@/components/stat-card";
import ChartArea from "@/components/chart-area";
import ChartBar from "@/components/chart-bar";

interface Props {
  stats: {
    moodTrend: { date: string; avg: number; count: number }[];
    distribution: number[];
    domainAvgs: { domain: string; avg: number; count: number }[];
    totalEntries: number;
  };
}

export default function WellbeingClient({ stats }: Props) {
  const distData = stats.distribution.map((count, i) => ({
    score: `${i + 1}`,
    count,
  }));

  const overallAvg = stats.moodTrend.length > 0
    ? +(stats.moodTrend.reduce((s, m) => s + m.avg, 0) / stats.moodTrend.length).toFixed(1)
    : 0;

  const sortedDomains = [...stats.domainAvgs].sort((a, b) => a.avg - b.avg);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Mood & Wellbeing</h1>
        <p className="text-sm text-zinc-500 mt-1">Population-level mental health indicators</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Entries" value={stats.totalEntries} color="purple" />
        <StatCard title="Avg Mood (30d)" value={overallAvg} color={overallAvg >= 6 ? "green" : overallAvg >= 4 ? "amber" : "red"} subtitle="out of 10" />
        <StatCard title="Data Points Today" value={stats.moodTrend.length > 0 ? stats.moodTrend[stats.moodTrend.length - 1].count : 0} />
        <StatCard title="Domains Tracked" value={stats.domainAvgs.length} />
      </div>

      <ChartArea data={stats.moodTrend} xKey="date" yKey="avg" title="Average Mood Score Over Time" color="#f59e0b" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBar data={distData} xKey="score" yKey="count" title="Mood Distribution (Last 30 Days)" color="#8b5cf6" />

        {sortedDomains.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Life Domains (Avg Score)</h3>
            <div className="space-y-3">
              {sortedDomains.map((d) => (
                <div key={d.domain} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-28 capitalize truncate">{d.domain}</span>
                  <div className="flex-1 h-6 bg-zinc-800 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg flex items-center px-2 ${
                        d.avg >= 7 ? "bg-emerald-600" :
                        d.avg >= 5 ? "bg-amber-600" :
                        "bg-red-600"
                      }`}
                      style={{ width: `${(d.avg / 10) * 100}%` }}
                    >
                      <span className="text-[10px] font-medium text-white">{d.avg}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600 w-16">{d.count} entries</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

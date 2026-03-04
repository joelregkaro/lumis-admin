import StatCard from "@/components/stat-card";
import { getOverviewStats, getKPIRollup, getNorthStarMetrics, getSubscriptionStats } from "@/lib/queries";
import OverviewCharts from "./overview-charts";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [stats, rollup, nsm, subs] = await Promise.all([
    getOverviewStats(),
    getKPIRollup(30),
    getNorthStarMetrics(),
    getSubscriptionStats(),
  ]);

  const latestRollup = rollup.length > 0 ? rollup[rollup.length - 1] : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Real-time snapshot of Lumis</p>
      </div>

      {stats.crisisToday > 0 && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 flex items-center gap-3">
          <span className="text-2xl">&#x1F6A8;</span>
          <div>
            <p className="font-medium text-red-300">
              {stats.crisisToday} crisis event{stats.crisisToday > 1 ? "s" : ""} in the last 24 hours
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Review flagged sessions in AI Quality
            </p>
          </div>
        </div>
      )}

      {/* North Star Metric - Hero */}
      <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-950/50 to-zinc-900/80 p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-purple-400 uppercase tracking-wider">North Star Metric</span>
        </div>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-5xl font-bold text-white">{nsm.msw}</span>
          <span className="text-lg text-zinc-400">users with 2+ meaningful sessions this week</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          A meaningful session = completed + AI extracted at least 1 actionable insight (echo, goal, or pattern)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Session Completion</p>
            <p className="text-xl font-semibold text-white mt-1">{nsm.sessionCompletionRate}%</p>
            <p className="text-xs text-zinc-600">{nsm.totalCompletedThisWeek} of {Math.round(nsm.totalCompletedThisWeek / (nsm.sessionCompletionRate / 100) || 0)} started</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Extraction Rate</p>
            <p className="text-xl font-semibold text-white mt-1">{nsm.extractionRate}%</p>
            <p className="text-xs text-zinc-600">{nsm.meaningfulSessionsThisWeek} meaningful this week</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Commitment Follow-Through</p>
            <p className="text-xl font-semibold text-white mt-1">{nsm.commitFollowthrough}%</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Avg Memory Depth</p>
            <p className="text-xl font-semibold text-white mt-1">{nsm.avgMemoryDepth}</p>
            <p className="text-xs text-zinc-600">doc versions per user</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} color="purple" />
        <StatCard title="Onboarded" value={stats.onboardedUsers} subtitle={`${nsm.onboardingRate}% rate`} color="green" />
        <StatCard title="New Today" value={stats.newToday} color="green" />
        <StatCard title="Sessions Today" value={stats.sessionsToday} />
        <StatCard title="WAU" value={stats.wau} subtitle="Weekly active" color="purple" />
        <StatCard title="MAU" value={stats.mau} subtitle="Monthly active" color="purple" />
        <StatCard title="Crisis (24h)" value={stats.crisisToday} color={stats.crisisToday > 0 ? "red" : "default"} />
      </div>

      {/* AI Intelligence Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Sessions Processed" value={latestRollup?.sessions_processed ?? 0} subtitle="by AI today" color="purple" />
        <StatCard title="Goals Created" value={latestRollup?.goals_created ?? 0} subtitle="today" color="green" />
        <StatCard title="Reminders Set" value={latestRollup?.reminders_created ?? 0} subtitle="by AI today" color="amber" />
        <StatCard title="Memory Updates" value={latestRollup?.memory_updates ?? 0} subtitle="docs updated today" color="purple" />
      </div>

      {/* Subscription & Revenue */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Revenue & Subscriptions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Paying Users" value={subs.payingUsers} color="green" />
          <StatCard title="Trial Users" value={subs.trialUsers} color="amber" />
          <StatCard title="Free Users" value={subs.freeUsers} />
          <StatCard title="Total Revenue" value={`$${(subs.totalRevenueCents / 100).toFixed(2)}`} color="green" />
          <StatCard title="Conversion Rate" value={`${stats.totalUsers > 0 ? ((subs.payingUsers / stats.totalUsers) * 100).toFixed(1) : 0}%`} subtitle="paid / total" color="purple" />
        </div>
      </div>

      <OverviewCharts rollup={rollup} />
    </div>
  );
}

"use client";
import StatCard from "@/components/stat-card";
import ChartBar from "@/components/chart-bar";
import ChartArea from "@/components/chart-area";

interface FunnelStep {
  name: string;
  value: number;
}

interface Props {
  stats: {
    totalUsers: number;
    onboarded: number;
    onboardingRate: number;
    session1: number;
    session3: number;
    session7: number;
    funnel: FunnelStep[];
    retention: { d1: number; d7: number; d30: number };
    referrals: { total: number; pending: number; activated: number; rewarded: number };
    notificationsByType: Record<string, number>;
    usersByWeek: { week: string; count: number }[];
  };
  eventData?: {
    signUpMethods: { method: string; count: number }[];
    onboardingSteps: Record<string, number>;
  };
}

export default function GrowthClient({ stats, eventData }: Props) {
  const s1Rate = stats.totalUsers > 0 ? Math.round((stats.session1 / stats.totalUsers) * 100) : 0;
  const s3Rate = stats.totalUsers > 0 ? Math.round((stats.session3 / stats.totalUsers) * 100) : 0;
  const s7Rate = stats.totalUsers > 0 ? Math.round((stats.session7 / stats.totalUsers) * 100) : 0;
  const refConversion = stats.referrals.total > 0 ? Math.round((stats.referrals.activated / stats.referrals.total) * 100) : 0;

  const notifData = Object.entries(stats.notificationsByType).map(([type, count]) => ({
    type: type.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Growth</h1>
        <p className="text-sm text-zinc-500 mt-1">Funnels, retention, and referrals</p>
      </div>

      {/* Retention Cohorts */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Retention Cohorts</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
            <p className="text-xs text-zinc-500 uppercase">Day 1</p>
            <p className={`text-4xl font-bold mt-2 ${stats.retention.d1 >= 50 ? "text-emerald-400" : stats.retention.d1 >= 30 ? "text-amber-400" : "text-red-400"}`}>
              {stats.retention.d1}%
            </p>
            <p className="text-xs text-zinc-600 mt-1">Had a session on day 1</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
            <p className="text-xs text-zinc-500 uppercase">Day 7</p>
            <p className={`text-4xl font-bold mt-2 ${stats.retention.d7 >= 30 ? "text-emerald-400" : stats.retention.d7 >= 15 ? "text-amber-400" : "text-red-400"}`}>
              {stats.retention.d7}%
            </p>
            <p className="text-xs text-zinc-600 mt-1">2+ sessions within 7 days</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
            <p className="text-xs text-zinc-500 uppercase">Day 30</p>
            <p className={`text-4xl font-bold mt-2 ${stats.retention.d30 >= 20 ? "text-emerald-400" : stats.retention.d30 >= 10 ? "text-amber-400" : "text-red-400"}`}>
              {stats.retention.d30}%
            </p>
            <p className="text-xs text-zinc-600 mt-1">3+ sessions within 30 days</p>
          </div>
        </div>
      </div>

      {/* User Funnel */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">User Funnel</h2>
        <div className="space-y-3">
          {stats.funnel.map((step, i) => {
            const pct = stats.totalUsers > 0 ? Math.round((step.value / stats.totalUsers) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-zinc-500 w-24 text-right">{step.name}</span>
                <div className="flex-1 h-8 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg flex items-center px-3"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  >
                    <span className="text-xs font-medium text-white">{step.value}</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-500 w-12">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Onboard Rate" value={`${stats.onboardingRate}%`} color={stats.onboardingRate >= 70 ? "green" : "amber"} />
        <StatCard title="→ Session 1" value={`${s1Rate}%`} />
        <StatCard title="→ Session 3" value={`${s3Rate}%`} color={s3Rate >= 50 ? "green" : "amber"} />
        <StatCard title="→ Session 7" value={`${s7Rate}%`} color={s7Rate >= 30 ? "green" : "amber"} />
        <StatCard title="Ref. Conversion" value={`${refConversion}%`} subtitle={`${stats.referrals.activated}/${stats.referrals.total}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Referrals</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Total Referrals" value={stats.referrals.total} color="purple" />
            <StatCard title="Pending" value={stats.referrals.pending} color="amber" />
            <StatCard title="Activated" value={stats.referrals.activated} color="green" />
            <StatCard title="Rewarded" value={stats.referrals.rewarded} color="green" />
          </div>
        </div>

        {notifData.length > 0 && (
          <ChartBar data={notifData} xKey="type" yKey="count" title="Notifications by Type" color="#8b5cf6" />
        )}
      </div>

      <ChartArea data={stats.usersByWeek} xKey="week" yKey="count" title="New Users by Week" color="#10b981" />

      {eventData && eventData.signUpMethods.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Sign-up Methods (from Events)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {eventData.signUpMethods.map((m) => (
              <StatCard key={m.method} title={m.method} value={m.count} color="purple" />
            ))}
          </div>
        </div>
      )}

      {eventData && Object.keys(eventData.onboardingSteps).length > 0 && (
        <ChartBar
          data={Object.entries(eventData.onboardingSteps)
            .map(([step, count]) => ({ step: `Step ${step}`, count }))
            .sort((a, b) => {
              const aNum = parseInt(a.step.replace("Step ", ""));
              const bNum = parseInt(b.step.replace("Step ", ""));
              return aNum - bNum;
            })}
          xKey="step"
          yKey="count"
          title="Onboarding Step Completion (from Events)"
          color="#f59e0b"
        />
      )}
    </div>
  );
}

"use client";

import StatCard from "@/components/stat-card";
import ChartBar from "@/components/chart-bar";

interface RevenueStats {
  totalUsers: number;
  onboarded: number;
  trialReady: number;
  highValue: number;
  power: number;
  conversionFunnel: { name: string; value: number }[];
}

export default function RevenueClient({ stats }: { stats: RevenueStats }) {
  const trialRate = stats.totalUsers > 0
    ? Math.round((stats.trialReady / stats.totalUsers) * 100) : 0;
  const highValueRate = stats.totalUsers > 0
    ? Math.round((stats.highValue / stats.totalUsers) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue & Conversion</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Subscription readiness and conversion funnel
        </p>
      </div>

      {/* RevenueCat integration notice */}
      <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4 flex items-center gap-3">
        <span className="text-xl">💡</span>
        <div>
          <p className="font-medium text-amber-300 text-sm">
            RevenueCat webhook integration pending
          </p>
          <p className="text-xs text-amber-400/60 mt-0.5">
            Actual subscription revenue, MRR, churn rate, and LTV metrics will appear once RevenueCat
            server-side webhooks are connected. The data below is based on engagement signals.
          </p>
        </div>
      </div>

      {/* Conversion readiness metrics */}
      <div>
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">Conversion Readiness</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="All Users" value={stats.totalUsers} color="purple" />
          <StatCard title="Onboarded" value={stats.onboarded}
            subtitle={`${stats.totalUsers > 0 ? Math.round((stats.onboarded / stats.totalUsers) * 100) : 0}% of all`}
            color="green" />
          <StatCard title="Trial-Ready" value={stats.trialReady}
            subtitle={`${trialRate}% — 3+ sessions`}
            color="amber" />
          <StatCard title="High-Value" value={stats.highValue}
            subtitle={`${highValueRate}% — 7+ sessions`}
            color="purple" />
          <StatCard title="Power Users" value={stats.power}
            subtitle="15+ sessions"
            color="green" />
        </div>
      </div>

      {/* Conversion Funnel */}
      <div>
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">Conversion Funnel</p>
        <ChartBar data={stats.conversionFunnel} xKey="name" yKey="value" title="User Journey Funnel" color="#8b5cf6" height={350} />
      </div>

      {/* Pricing structure reference */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <h3 className="text-sm font-medium text-zinc-400">Current Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500 uppercase">Monthly</p>
            <p className="text-2xl font-bold text-white mt-1">$14.99<span className="text-sm text-zinc-500">/mo</span></p>
          </div>
          <div className="rounded-lg border border-violet-700/50 bg-violet-950/30 p-4">
            <p className="text-xs text-violet-400 uppercase">Annual</p>
            <p className="text-2xl font-bold text-white mt-1">$99.99<span className="text-sm text-zinc-500">/yr</span></p>
            <p className="text-xs text-zinc-500 mt-1">$8.33/mo — 44% savings</p>
          </div>
        </div>
        <p className="text-xs text-zinc-600">14-day free trial on all plans</p>
      </div>

      {/* Revenue projections */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <h3 className="text-sm font-medium text-zinc-400">Revenue Projections</h3>
        <p className="text-xs text-zinc-600 mb-3">Based on current engagement data and industry conversion benchmarks</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-zinc-500">Conservative (2% conv.)</p>
            <p className="text-xl font-bold text-white">
              ${Math.round(stats.trialReady * 0.02 * 14.99)}<span className="text-sm text-zinc-500">/mo</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Moderate (5% conv.)</p>
            <p className="text-xl font-bold text-amber-400">
              ${Math.round(stats.trialReady * 0.05 * 14.99)}<span className="text-sm text-zinc-500">/mo</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">Optimistic (10% conv.)</p>
            <p className="text-xl font-bold text-green-400">
              ${Math.round(stats.trialReady * 0.1 * 14.99)}<span className="text-sm text-zinc-500">/mo</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

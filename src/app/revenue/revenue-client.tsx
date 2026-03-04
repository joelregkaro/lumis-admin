"use client";

import StatCard from "@/components/stat-card";
import ChartBar from "@/components/chart-bar";

interface SubscriptionEvent {
  id: string;
  user_id: string;
  event_type: string;
  product_id: string | null;
  revenue_cents: number;
  currency: string;
  platform: string | null;
  details: any;
  created_at: string;
}

interface RevenueStats {
  totalUsers: number;
  onboarded: number;
  activeSubscribers: number;
  mrr: number;
  totalRevenueCents: number;
  churnEvents: number;
  newSubscriptions: number;
  recentEvents: SubscriptionEvent[];
  trialReady: number;
  highValue: number;
  power: number;
  conversionFunnel: { name: string; value: number }[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  INITIAL_PURCHASE: { label: "New Sub", color: "text-green-400" },
  RENEWAL: { label: "Renewal", color: "text-emerald-400" },
  CANCELLATION: { label: "Cancelled", color: "text-red-400" },
  EXPIRATION: { label: "Expired", color: "text-red-300" },
  BILLING_ISSUE: { label: "Billing Issue", color: "text-amber-400" },
  PRODUCT_CHANGE: { label: "Plan Change", color: "text-blue-400" },
  UNCANCELLATION: { label: "Resubscribed", color: "text-green-300" },
  SUBSCRIBER_ALIAS: { label: "Alias", color: "text-zinc-400" },
  TRANSFER: { label: "Transfer", color: "text-zinc-400" },
};

export default function RevenueClient({ stats }: { stats: RevenueStats }) {
  const trialRate = stats.totalUsers > 0
    ? Math.round((stats.trialReady / stats.totalUsers) * 100) : 0;
  const highValueRate = stats.totalUsers > 0
    ? Math.round((stats.highValue / stats.totalUsers) * 100) : 0;
  const churnRate =
    stats.activeSubscribers > 0
      ? ((stats.churnEvents / (stats.activeSubscribers + stats.churnEvents)) * 100).toFixed(1)
      : "0.0";
  const hasRevenueData = stats.recentEvents.length > 0 || stats.activeSubscribers > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue & Subscriptions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Live subscription metrics from RevenueCat webhooks
        </p>
      </div>

      {/* Revenue KPIs */}
      <div>
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
          Revenue Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="MRR"
            value={formatCents(stats.mrr)}
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value={formatCents(stats.totalRevenueCents)}
            color="purple"
          />
          <StatCard
            title="Active Subscribers"
            value={stats.activeSubscribers}
            color="green"
          />
          <StatCard
            title="New (30d)"
            value={stats.newSubscriptions}
            subtitle="Initial purchases"
            color="amber"
          />
          <StatCard
            title="Churned (30d)"
            value={stats.churnEvents}
            subtitle={`${churnRate}% churn rate`}
            color="red"
          />
          <StatCard
            title="ARPU"
            value={
              stats.activeSubscribers > 0
                ? formatCents(Math.round(stats.mrr / stats.activeSubscribers))
                : "$0.00"
            }
            subtitle="Per active subscriber"
            color="purple"
          />
        </div>
      </div>

      {!hasRevenueData && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3">
          <span className="text-xl">📡</span>
          <div>
            <p className="font-medium text-zinc-300 text-sm">
              Waiting for subscription events
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Revenue metrics will populate as RevenueCat webhook events arrive.
              Configure the webhook URL to <code className="text-zinc-400">/api/revenuecat-webhook</code> in your RevenueCat dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Recent Subscription Events */}
      <div>
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
          Recent Subscription Events
        </p>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {stats.recentEvents.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 text-center">
              No subscription events yet
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Event</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Platform</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase">User</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.map((ev) => {
                  const meta = EVENT_LABELS[ev.event_type] ?? {
                    label: ev.event_type,
                    color: "text-zinc-400",
                  };
                  return (
                    <tr key={ev.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className={`px-4 py-2.5 font-medium ${meta.color}`}>
                        {meta.label}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">
                        {ev.product_id || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-white font-mono">
                        {ev.revenue_cents > 0 ? formatCents(ev.revenue_cents) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500">
                        {ev.platform || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                        {ev.user_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500">
                        {formatDate(ev.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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

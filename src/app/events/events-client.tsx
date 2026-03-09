"use client";
import { useState } from "react";
import StatCard from "@/components/stat-card";
import ChartBar from "@/components/chart-bar";
import ChartArea from "@/components/chart-area";
import DataTable from "@/components/data-table";

interface EventRow {
  event_name: string;
  properties: Record<string, any>;
  screen: string | null;
  created_at: string;
  user_id: string;
}

interface Props {
  stats: {
    totalEvents: number;
    uniqueUsers: number;
    topEvents: { name: string; count: number; users: number }[];
    screenBreakdown: { screen: string; count: number }[];
    timeline: { date: string; count: number }[];
    recentEvents: EventRow[];
    signUpMethods: { method: string; count: number }[];
    signInMethods: { method: string; count: number }[];
    purchaseFunnel: {
      paywallViews: number;
      purchaseStarted: number;
      purchaseCompleted: number;
      purchaseFailed: number;
    };
    onboardingSteps: Record<string, number>;
  };
}

type Tab = "overview" | "events" | "screens" | "funnel";

export default function EventsClient({ stats }: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Event Log" },
    { id: "screens", label: "Screens" },
    { id: "funnel", label: "Funnels" },
  ];

  const eventsPerUser =
    stats.uniqueUsers > 0
      ? (stats.totalEvents / stats.uniqueUsers).toFixed(1)
      : "0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-sm text-zinc-500 mt-1">Last 30 days</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "text-violet-300 bg-violet-600/10 border-b-2 border-violet-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Events" value={stats.totalEvents.toLocaleString()} color="purple" />
            <StatCard title="Unique Users" value={stats.uniqueUsers} color="green" />
            <StatCard title="Events / User" value={eventsPerUser} />
            <StatCard title="Event Types" value={stats.topEvents.length} />
          </div>

          <ChartArea
            data={stats.timeline}
            xKey="date"
            yKey="count"
            title="Events Over Time"
            color="#8b5cf6"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartBar
              data={stats.topEvents.slice(0, 15)}
              xKey="name"
              yKey="count"
              title="Top Events by Volume"
              color="#8b5cf6"
              height={350}
            />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Events</h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {stats.topEvents.map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/40"
                  >
                    <span className="text-sm text-zinc-300 font-mono">{e.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500">{e.users} users</span>
                      <span className="text-sm font-semibold text-white">{e.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {stats.signUpMethods.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                Sign-up Methods
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.signUpMethods.map((m) => (
                  <StatCard key={m.method} title={m.method} value={m.count} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <DataTable
          data={stats.recentEvents}
          columns={[
            {
              key: "event_name",
              label: "Event",
              render: (r: EventRow) => (
                <span className="font-mono text-violet-300">{r.event_name}</span>
              ),
            },
            {
              key: "user_id",
              label: "User",
              render: (r: EventRow) => (
                <span className="text-xs text-zinc-500">{r.user_id.slice(0, 8)}...</span>
              ),
            },
            {
              key: "screen",
              label: "Screen",
              render: (r: EventRow) => (
                <span className="text-zinc-400">{r.screen || "—"}</span>
              ),
            },
            {
              key: "properties",
              label: "Properties",
              render: (r: EventRow) => {
                const props = { ...r.properties };
                delete props.screen;
                delete props.session_id;
                const entries = Object.entries(props);
                if (entries.length === 0) return <span className="text-zinc-600">—</span>;
                return (
                  <span className="text-xs text-zinc-500 font-mono">
                    {entries.map(([k, v]) => `${k}=${v}`).join(", ")}
                  </span>
                );
              },
              sortable: false,
            },
            {
              key: "created_at",
              label: "Time",
              render: (r: EventRow) => (
                <span className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              ),
            },
          ]}
        />
      )}

      {tab === "screens" && (
        <div className="space-y-6">
          <ChartBar
            data={stats.screenBreakdown.slice(0, 20)}
            xKey="screen"
            yKey="count"
            title="Screen Views"
            color="#10b981"
            height={350}
          />
          <DataTable
            data={stats.screenBreakdown}
            columns={[
              { key: "screen", label: "Screen" },
              {
                key: "count",
                label: "Views",
                render: (r: { screen: string; count: number }) => (
                  <span className="font-semibold text-white">{r.count}</span>
                ),
              },
            ]}
          />
        </div>
      )}

      {tab === "funnel" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
              Purchase Funnel
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Paywall Views" value={stats.purchaseFunnel.paywallViews} />
              <StatCard title="Purchase Started" value={stats.purchaseFunnel.purchaseStarted} color="amber" />
              <StatCard title="Completed" value={stats.purchaseFunnel.purchaseCompleted} color="green" />
              <StatCard title="Failed" value={stats.purchaseFunnel.purchaseFailed} color="red" />
            </div>
            {stats.purchaseFunnel.paywallViews > 0 && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Conversion Rates</h3>
                <div className="space-y-3">
                  <FunnelBar
                    label="Paywall → Started"
                    rate={
                      stats.purchaseFunnel.paywallViews > 0
                        ? (stats.purchaseFunnel.purchaseStarted / stats.purchaseFunnel.paywallViews) * 100
                        : 0
                    }
                  />
                  <FunnelBar
                    label="Started → Completed"
                    rate={
                      stats.purchaseFunnel.purchaseStarted > 0
                        ? (stats.purchaseFunnel.purchaseCompleted / stats.purchaseFunnel.purchaseStarted) * 100
                        : 0
                    }
                  />
                  <FunnelBar
                    label="Paywall → Completed"
                    rate={
                      stats.purchaseFunnel.paywallViews > 0
                        ? (stats.purchaseFunnel.purchaseCompleted / stats.purchaseFunnel.paywallViews) * 100
                        : 0
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {Object.keys(stats.onboardingSteps).length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                Onboarding Steps
              </h2>
              <ChartBar
                data={Object.entries(stats.onboardingSteps)
                  .map(([step, count]) => ({ step: `Step ${step}`, count }))
                  .sort((a, b) => {
                    const aNum = parseInt(a.step.replace("Step ", ""));
                    const bNum = parseInt(b.step.replace("Step ", ""));
                    return aNum - bNum;
                  })}
                xKey="step"
                yKey="count"
                title="Users Completing Each Step"
                color="#f59e0b"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FunnelBar({ label, rate }: { label: string; rate: number }) {
  const pct = Math.min(rate, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{rate.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

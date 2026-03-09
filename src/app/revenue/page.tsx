import { getRevenueStats, getEventStats } from "@/lib/queries";
import RevenueClient from "./revenue-client";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const [stats, eventStats] = await Promise.all([getRevenueStats(), getEventStats()]);
  return <RevenueClient stats={stats} purchaseFunnel={eventStats.purchaseFunnel} />;
}

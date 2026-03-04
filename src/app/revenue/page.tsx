import { getRevenueStats } from "@/lib/queries";
import RevenueClient from "./revenue-client";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const stats = await getRevenueStats();
  return <RevenueClient stats={stats} />;
}

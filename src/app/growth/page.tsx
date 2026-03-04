import { getGrowthStats } from "@/lib/queries";
import GrowthClient from "./growth-client";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  const stats = await getGrowthStats();
  return <GrowthClient stats={stats} />;
}

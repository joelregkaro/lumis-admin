import { getEngagementStats } from "@/lib/queries";
import EngagementClient from "./engagement-client";

export const dynamic = "force-dynamic";

export default async function EngagementPage() {
  const stats = await getEngagementStats();
  return <EngagementClient stats={stats} />;
}

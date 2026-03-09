import { getEngagementStats, getEventStats } from "@/lib/queries";
import EngagementClient from "./engagement-client";

export const dynamic = "force-dynamic";

export default async function EngagementPage() {
  const [stats, eventStats] = await Promise.all([getEngagementStats(), getEventStats()]);
  return (
    <EngagementClient
      stats={stats}
      eventData={{
        screenBreakdown: eventStats.screenBreakdown,
        topFeatureEvents: eventStats.topEvents.filter(
          (e) => !["screen_viewed", "sign_in", "sign_up", "sign_out"].includes(e.name)
        ).slice(0, 10),
      }}
    />
  );
}

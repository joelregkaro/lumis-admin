import { getGrowthStats, getEventStats } from "@/lib/queries";
import GrowthClient from "./growth-client";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  const [stats, eventStats] = await Promise.all([getGrowthStats(), getEventStats()]);
  return (
    <GrowthClient
      stats={stats}
      eventData={{
        signUpMethods: eventStats.signUpMethods,
        onboardingSteps: eventStats.onboardingSteps,
      }}
    />
  );
}

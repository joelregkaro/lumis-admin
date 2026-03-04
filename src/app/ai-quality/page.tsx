import { getAIQualityStats, getRecentSessions } from "@/lib/queries";
import AIQualityClient from "./ai-quality-client";

export const dynamic = "force-dynamic";

export default async function AIQualityPage() {
  const [quality, sessions] = await Promise.all([
    getAIQualityStats(),
    getRecentSessions(50),
  ]);
  return <AIQualityClient quality={quality} sessions={sessions} />;
}

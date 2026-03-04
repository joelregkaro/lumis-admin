import { getWellbeingStats } from "@/lib/queries";
import WellbeingClient from "./wellbeing-client";

export const dynamic = "force-dynamic";

export default async function WellbeingPage() {
  const stats = await getWellbeingStats();
  return <WellbeingClient stats={stats} />;
}

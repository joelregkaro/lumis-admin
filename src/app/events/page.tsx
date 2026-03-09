import { getEventStats } from "@/lib/queries";
import EventsClient from "./events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const stats = await getEventStats();
  return <EventsClient stats={stats} />;
}

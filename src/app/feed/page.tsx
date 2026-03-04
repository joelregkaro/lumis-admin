import { getRecentActivity } from "@/lib/queries";
import FeedClient from "./feed-client";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const activity = await getRecentActivity(50);
  return <FeedClient initialActivity={activity} />;
}

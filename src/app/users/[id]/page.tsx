import { getUserDetail } from "@/lib/queries";
import UserDetailClient from "./user-detail-client";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getUserDetail(id);

  if (!detail.user) {
    return <p className="text-zinc-500">User not found.</p>;
  }

  return <UserDetailClient detail={detail} />;
}

"use client";
import { useRouter } from "next/navigation";
import DataTable from "@/components/data-table";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  onboarding_completed_at: string | null;
  current_streak: number;
  longest_streak: number;
  companion_name: string | null;
  push_token: string | null;
}

export default function UsersTable({ initialUsers, total }: { initialUsers: User[]; total: number }) {
  const router = useRouter();

  const columns = [
    {
      key: "display_name",
      label: "Name",
      render: (u: User) => (
        <div>
          <p className="font-medium text-white">{u.display_name || "—"}</p>
          <p className="text-xs text-zinc-500">{u.email}</p>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (u: User) => (
        <span className="text-xs">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span>
      ),
    },
    {
      key: "onboarding_completed_at",
      label: "Onboarded",
      render: (u: User) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          u.onboarding_completed_at
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-zinc-700/30 text-zinc-500"
        }`}>
          {u.onboarding_completed_at ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "current_streak",
      label: "Streak",
      render: (u: User) => (
        <span className="text-sm">
          {u.current_streak > 0 ? `🔥 ${u.current_streak}` : "0"} / {u.longest_streak}
        </span>
      ),
    },
    {
      key: "companion_name",
      label: "Companion",
      render: (u: User) => <span className="text-sm text-zinc-400">{u.companion_name || "Default"}</span>,
    },
    {
      key: "push_token",
      label: "Push",
      render: (u: User) => (
        <span className={`w-2 h-2 rounded-full inline-block ${u.push_token ? "bg-emerald-400" : "bg-zinc-600"}`} />
      ),
      sortable: false,
    },
  ];

  return (
    <div>
      <DataTable data={initialUsers} columns={columns} onRowClick={(u) => router.push(`/users/${u.id}`)} />
      {total > initialUsers.length && (
        <p className="text-xs text-zinc-600 mt-3">Showing {initialUsers.length} of {total}</p>
      )}
    </div>
  );
}

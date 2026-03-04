import { getUsersList } from "@/lib/queries";
import UsersTable from "./users-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { users, total } = await getUsersList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} total users</p>
      </div>
      <UsersTable initialUsers={users} total={total} />
    </div>
  );
}

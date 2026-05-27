import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserActions } from "@/components/admin/UserActions";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ q?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q, role } = await searchParams;

  let query = supabase
    .from("users")
    .select("*, subscription:subscriptions(*), exam_attempts(count)")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (role) query = query.eq("role", role);

  const { data: users } = await query;
  const userList = users ?? [];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <span className="text-sm text-gray-400">{userList.length} users</span>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select name="role" defaultValue={role ?? ""} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">User</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Role</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Subscription</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Exams</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Joined</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-right p-4 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {userList.map((user: {
                id: string;
                name?: string;
                email: string;
                role: string;
                is_banned: boolean;
                created_at: string;
                subscription?: { status?: string } | null;
                exam_attempts: { count: number }[];
              }) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name ?? "—"}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.role === "ADMIN" ? "danger" : user.role === "INSTRUCTOR" ? "info" : "default"}>{user.role}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      user.subscription?.status === "ACTIVE" ? "success" :
                      user.subscription?.status === "TRIAL" ? "warning" : "default"
                    }>
                      {user.subscription?.status ?? "FREE"}
                    </Badge>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{user.exam_attempts[0]?.count ?? 0}</td>
                  <td className="p-4 text-gray-400 text-xs">{formatDate(new Date(user.created_at))}</td>
                  <td className="p-4">
                    <Badge variant={user.is_banned ? "danger" : "success"}>
                      {user.is_banned ? "Banned" : "Active"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <UserActions userId={user.id} isBanned={user.is_banned} role={user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

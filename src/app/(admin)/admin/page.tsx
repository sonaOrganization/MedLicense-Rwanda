import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, CreditCard, BarChart2, TrendingUp, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const [
    { count: userCount },
    { count: examCount },
    { count: questionCount },
    { data: recentPayments },
    { data: recentUsers },
    { data: allCompletedPayments },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*, user:users(name, email)").order("created_at", { ascending: false }).limit(5),
    supabase.from("users").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("payments").select("amount").eq("status", "completed"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["ACTIVE", "TRIAL"]),
  ]);

  const totalRevenue = allCompletedPayments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) ?? 0;

  const stats = [
    { label: "Total Users", value: (userCount ?? 0).toLocaleString(), icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Active Subscriptions", value: (activeSubscriptions ?? 0).toLocaleString(), icon: UserCheck, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Total Exams", value: (examCount ?? 0).toLocaleString(), icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Total Questions", value: (questionCount ?? 0).toLocaleString(), icon: BarChart2, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} RWF`, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Growth", value: "+12%", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  ];

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className={`inline-flex p-2.5 rounded-xl ${bg} ${color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Users</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(recentUsers ?? []).map((user: { id: string; name?: string; role: string; created_at: string }) => (
                <div key={user.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(new Date(user.created_at))}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === "ADMIN" ? "danger" : "default"}>{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(recentPayments ?? []).map((payment: { id: string; plan: string; amount: number; currency: string; status: string; created_at: string; user: { name?: string } }) => (
                <div key={payment.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.user.name}</p>
                    <p className="text-xs text-gray-400">{payment.plan} · {formatDate(new Date(payment.created_at))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{payment.amount.toLocaleString()} {payment.currency}</p>
                    <Badge variant={payment.status === "completed" ? "success" : "warning"}>{payment.status}</Badge>
                  </div>
                </div>
              ))}
              {(recentPayments ?? []).length === 0 && (
                <p className="p-4 text-sm text-gray-400 text-center">No payments yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ status?: string; plan?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { status, plan } = await searchParams;

  let query = supabase
    .from("payments")
    .select("*, user:users(name, email)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (plan) query = query.eq("plan", plan);

  const { data: payments } = await query;
  const paymentList = payments ?? [];

  const completed = paymentList.filter((p: { status: string }) => p.status === "completed");
  const pending = paymentList.filter((p: { status: string }) => p.status === "pending");
  const totalRevenue = completed.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

  const stats = [
    {
      label: "Total Revenue",
      value: `${totalRevenue.toLocaleString()} RWF`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: CheckCircle,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Pending",
      value: pending.length,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Total Transactions",
      value: paymentList.length,
      icon: CreditCard,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <p className="text-sm text-gray-400 mt-0.5">All subscription transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          name="plan"
          defaultValue={plan ?? ""}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="trial">Trial</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">User</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Plan</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Provider</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paymentList.map((p: {
                id: string;
                plan: string;
                amount: number;
                currency: string;
                provider: string;
                status: string;
                created_at: string;
                user: { name?: string; email: string };
              }) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="p-4">
                    <p className="font-medium text-gray-900 dark:text-white">{p.user?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{p.user?.email}</p>
                  </td>
                  <td className="p-4 capitalize text-gray-700 dark:text-gray-300">{p.plan}</td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {p.amount.toLocaleString()} {p.currency}
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 capitalize">{p.provider}</td>
                  <td className="p-4">
                    <Badge variant={
                      p.status === "completed" ? "success" :
                      p.status === "pending" ? "warning" : "danger"
                    }>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs text-gray-400">{formatDate(new Date(p.created_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {paymentList.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No payments yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

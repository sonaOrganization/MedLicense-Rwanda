import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaymentButtons } from "@/components/dashboard/PaymentButtons";
import { ActivatePaymentButton } from "@/components/admin/ActivatePaymentButton";
import { PLANS } from "@/lib/plans";

interface TrackedCallback { at: string; source: string; outcome: string; missing?: string[] }

const OUTCOME_LABELS: Record<string, string> = {
  activated: "Activated",
  already_activated: "Already activated",
  status_not_paid: "Not paid (status)",
  invalid_settlement_details: "Rejected: incomplete details",
  payment_details_mismatch: "Rejected: amount/currency differ",
  transaction_mismatch: "Rejected: different transaction",
  payment_not_pending: "Rejected: payment not pending",
  activation_error: "Failed: database error",
};

/** The most recent provider callback recorded on this payment by the webhook. */
function lastCallback(metadata: unknown): TrackedCallback | null {
  const callbacks = (metadata as { callbacks?: TrackedCallback[] } | null)?.callbacks;
  return Array.isArray(callbacks) && callbacks.length > 0 ? callbacks[callbacks.length - 1] : null;
}

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
  // Admin test payments are not real revenue.
  const totalRevenue = completed
    .filter((p: { plan: string }) => p.plan !== PLANS.test.id)
    .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

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

      {/* Test payment */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">{PLANS.test.name}</h2>
              <Badge variant="default">{PLANS.test.badge}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pay {PLANS.test.price.toLocaleString()} {PLANS.test.currency} through AfriPay to confirm checkout and activation work. It appears in the table below and is excluded from Total Revenue.
            </p>
          </div>
          <div className="w-full sm:w-56 sm:shrink-0">
            <PaymentButtons plan={PLANS.test} />
          </div>
        </CardContent>
      </Card>

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
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="test">Test</option>
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
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">AfriPay callback</th>
                <th className="p-4"></th>
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
                metadata: unknown;
                user: { name?: string; email: string };
              }) => {
                const callback = lastCallback(p.metadata);
                return (
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
                  <td className="p-4 text-xs">
                    {callback ? (
                      <div className="space-y-0.5">
                        <p className={callback.outcome === "activated" || callback.outcome === "already_activated"
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "font-medium text-red-600 dark:text-red-400"}>
                          {OUTCOME_LABELS[callback.outcome] ?? callback.outcome}
                        </p>
                        <p className="text-gray-400">
                          {new Date(callback.at).toLocaleString("en-GB", { timeZone: "Africa/Kigali", dateStyle: "short", timeStyle: "short" })} · {callback.source}
                        </p>
                        {callback.missing && callback.missing.length > 0 && (
                          <p className="text-gray-400">Missing: {callback.missing.join(", ")}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">{p.status === "completed" ? "—" : "None received"}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {p.status === "pending" && (
                      <ActivatePaymentButton
                        paymentId={p.id}
                        label={`${p.amount.toLocaleString()} ${p.currency} (${p.plan}) for ${p.user?.name ?? p.user?.email ?? "this student"}`}
                      />
                    )}
                  </td>
                </tr>
                );
              })}
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

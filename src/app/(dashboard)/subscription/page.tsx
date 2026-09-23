import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaymentButtons } from "@/components/dashboard/PaymentButtons";
import { PaymentSuccessBanner } from "@/components/dashboard/PaymentSuccessBanner";
import { PlanCard, PremiumFeatureList } from "@/components/pricing/PlanCard";
import { PLAN_LIST, getPlan } from "@/lib/plans";

interface Props { searchParams: Promise<{ paid?: string; success?: string }> }

function daysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000));
}

export default async function SubscriptionPage({ searchParams }: Props) {
  const { paid, success } = await searchParams;
  const justPaid = paid === "true" || success === "true";
  const session = await auth();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", session!.user.id)
    .maybeSingle();
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", session!.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const paymentList = payments ?? [];
  const isActive    = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";
  const activePlan  = getPlan(subscription?.plan);
  const remaining   = isActive && subscription?.end_date ? daysLeft(subscription.end_date) : null;

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your plan and billing</p>
      </div>

      {justPaid && <PaymentSuccessBanner />}

      {/* Current status */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="min-w-[12rem] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {isActive ? `${activePlan?.name ?? "Premium"} plan` : "Current plan"}
                </h2>
                <Badge variant={isActive ? "success" : "default"}>{subscription?.status ?? "FREE"}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {isActive && subscription?.end_date
                  ? `Access until ${formatDate(new Date(subscription.end_date))} · does not auto-renew`
                  : subscription?.end_date
                    ? `Expired on ${formatDate(new Date(subscription.end_date))}`
                    : "Free access — premium exams are locked"}
              </p>
            </div>
            {remaining !== null && (
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular-nums text-teal-700 dark:text-teal-400">{remaining}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{remaining === 1 ? "day left" : "days left"}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      {!isActive && (
        <section className="space-y-5 sm:space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose your access window</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Both plans unlock the full platform. Pay once — nothing renews automatically.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {PLAN_LIST.map((plan) => (
              <PlanCard key={plan.id} plan={plan} action={<PaymentButtons plan={plan} />} />
            ))}
          </div>

          <PremiumFeatureList />

          <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:gap-6 sm:text-sm dark:text-gray-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secure payment via Afripay
            </span>
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Mobile Money and card accepted
            </span>
          </div>
        </section>
      )}

      {/* Payment history */}
      {paymentList.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Payment History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">Plan</th>
                      <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentList.map((p: { id: string; created_at: string; plan: string; amount: number; currency: string; status: string }) => (
                      <tr key={p.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                        <td className="p-4 text-gray-700 dark:text-gray-300">{formatDate(new Date(p.created_at))}</td>
                        <td className="p-4 capitalize text-gray-700 dark:text-gray-300">{getPlan(p.plan)?.name ?? p.plan}</td>
                        <td className="p-4 tabular-nums text-gray-700 dark:text-gray-300">
                          {p.amount.toLocaleString()} {p.currency}
                        </td>
                        <td className="p-4">
                          <Badge variant={p.status === "completed" ? "success" : p.status === "pending" ? "warning" : "danger"}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

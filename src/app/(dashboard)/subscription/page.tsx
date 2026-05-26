import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Shield, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaymentButtons } from "@/components/dashboard/PaymentButtons";

const plans = [
  {
    id: "monthly",
    name: "Premium Monthly",
    price: 15000,
    currency: "RWF",
    period: "month",
    features: ["2500+ practice questions", "Unlimited mock exams", "Video tutorials", "Detailed analytics", "Study notes PDF", "Priority support"],
    popular: true,
  },
  {
    id: "annual",
    name: "Premium Annual",
    price: 120000,
    currency: "RWF",
    period: "year",
    features: ["Everything in Monthly", "Flashcard system", "Offline study notes", "Early feature access", "1-on-1 support sessions"],
    popular: false,
    badge: "Save 33%",
  },
];

export default async function SubscriptionPage() {
  const session = await auth();
  const subscription = await prisma.subscription.findUnique({ where: { userId: session!.user.id } });
  const payments = await prisma.payment.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your plan and billing</p>
      </div>

      {/* Current status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Current Plan</h3>
                <Badge variant={isActive ? "success" : "default"}>
                  {subscription?.status ?? "FREE"}
                </Badge>
              </div>
              {subscription?.endDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {isActive ? `Renews on ${formatDate(subscription.endDate)}` : `Expired on ${formatDate(subscription.endDate)}`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      {!isActive && (
        <>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upgrade Your Plan</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.popular ? "border-indigo-500 shadow-lg" : ""}>
                <CardContent className="p-6">
                  {plan.popular && (
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">Most Popular</div>
                  )}
                  {plan.badge && (
                    <Badge variant="success" className="mb-2">{plan.badge}</Badge>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {plan.price.toLocaleString()} <span className="text-base font-normal text-gray-400">{plan.currency}/{plan.period}</span>
                  </div>
                  <ul className="space-y-2 my-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <PaymentButtons planId={plan.id} amount={plan.price} currency={plan.currency} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment security note */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4 text-green-500" />
            Secure payment via Mobile Money, Card, or Afripay
          </div>
        </>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment History</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                    <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Plan</th>
                    <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                    <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="p-4 text-gray-700 dark:text-gray-300">{formatDate(p.createdAt)}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300 capitalize">{p.plan}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">{p.amount.toLocaleString()} {p.currency}</td>
                      <td className="p-4">
                        <Badge variant={p.status === "completed" ? "success" : p.status === "pending" ? "warning" : "danger"}>
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

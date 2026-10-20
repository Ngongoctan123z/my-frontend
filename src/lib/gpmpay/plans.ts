export const PAYMENT_PLANS = {
  plus: { name: 'VNDocs Plus', amount: 50_000, days: 30, dailyLimit: 50 },
  pro: { name: 'VNDocs Pro', amount: 149_000, days: 30, dailyLimit: 200 },
} as const
export type PaidPlan = keyof typeof PAYMENT_PLANS
export function paidPlan(value: unknown): value is PaidPlan { return value === 'plus' || value === 'pro' }

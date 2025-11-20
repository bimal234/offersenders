
import type { Plan } from './types';
import { PlanId } from './types';

export const PRICING_PLANS: Plan[] = [
  {
    id: PlanId.Basic,
    name: 'Basic',
    price: 59.99,
    currency: 'NZ$',
    smsIncluded: 200,
    features: ['200 SMS/month', 'Customer Management', 'Campaign Scheduling', 'Basic Reporting'],
  },
  {
    id: PlanId.Intermediate,
    name: 'Intermediate',
    price: 99.99,
    currency: 'NZ$',
    smsIncluded: 500,
    features: ['500 SMS/month', 'All Basic Features', 'CSV Import', 'Delivery Reports'],
  },
  {
    id: PlanId.Pro,
    name: 'Pro',
    price: 149.99,
    currency: 'NZ$',
    smsIncluded: 1000,
    features: ['1000 SMS/month', 'All Intermediate Features', 'Priority Support', 'API Access'],
  },
];


import React from 'react';
import type { Plan } from '../../types';
import { PlanId } from '../../types';
import { Button } from '../ui/Button';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface PricingCardProps {
  plan: Plan;
  currentPlanId: PlanId;
  onSelectPlan: (planId: PlanId) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ plan, currentPlanId, onSelectPlan }) => {
  const isCurrentPlan = plan.id === currentPlanId;
  const isPopular = plan.id === PlanId.Intermediate;

  return (
    <div className={`relative bg-white border rounded-lg shadow-sm p-8 flex flex-col ${isCurrentPlan ? 'border-indigo-500' : 'border-gray-200'} ${isPopular ? 'border-2' : ''}`}>
        {isPopular && <div className="absolute top-0 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 text-sm font-semibold tracking-wide rounded-full">Most Popular</div>}
      <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
      <div className="mt-4 flex items-baseline text-gray-900">
        <span className="text-4xl font-extrabold tracking-tight">{plan.currency}{plan.price}</span>
        <span className="ml-1 text-xl font-semibold">/month</span>
      </div>
      <p className="mt-5 text-lg text-gray-500">{plan.smsIncluded} SMS included</p>
      
      <ul role="list" className="mt-6 space-y-4 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex space-x-3">
            <CheckCircleIcon className="flex-shrink-0 h-6 w-6 text-green-500" />
            <span className="text-sm text-gray-500">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button
        onClick={() => onSelectPlan(plan.id)}
        disabled={isCurrentPlan}
        className="mt-8 w-full"
        variant={isPopular ? 'primary' : 'secondary'}
      >
        {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
      </Button>
    </div>
  );
};

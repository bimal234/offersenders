import React, { useState } from 'react';
import { PRICING_PLANS } from '../constants';
import type { PlanId, Plan } from '../types';
import { PricingCard } from '../components/subscription/PricingCard';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface SubscriptionProps {
    currentPlanId: PlanId;
    onPlanChange: (planId: PlanId) => Promise<void>;
}

export const Subscription: React.FC<SubscriptionProps> = ({ currentPlanId, onPlanChange }) => {
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);

  const handleConfirmPurchase = async () => {
    if (modalPlan) {
      await onPlanChange(modalPlan.id);
      setModalPlan(null);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-8">
       {modalPlan && (
        <Modal
          isOpen={!!modalPlan}
          onClose={() => setModalPlan(null)}
          title={`Upgrade to ${modalPlan.name} Plan`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalPlan(null)}>Cancel</Button>
              <Button onClick={handleConfirmPurchase}>Confirm Purchase for {modalPlan.currency}{modalPlan.price}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-600">You are about to subscribe to the <strong>{modalPlan.name}</strong> plan for <strong>{modalPlan.currency}{modalPlan.price}/month</strong>. Please enter your payment details below.</p>
            <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
                <input type="text" id="card-number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="•••• •••• •••• 4242" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input type="text" id="expiry-date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="MM / YY" />
                </div>
                <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                    <input type="text" id="cvc" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="123" />
                </div>
            </div>
             <p className="text-xs text-gray-500 text-center">This is a simulation. No real payment will be processed.</p>
          </div>
        </Modal>
      )}

      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Flexible pricing for your business
        </h2>
        <p className="mt-4 text-xl text-gray-500">
          Choose a plan that fits your needs. Cancel or change anytime.
        </p>
      </div>

      <div className="mt-12 max-w-lg mx-auto grid gap-8 lg:grid-cols-3 lg:max-w-none">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlanId={currentPlanId}
            onSelectPlan={() => setModalPlan(plan)}
          />
        ))}
      </div>

      <div className="mt-10 text-center text-sm text-gray-500">
        <p>Payments are securely processed by Stripe. We do not store your card details.</p>
      </div>
    </main>
  );
};
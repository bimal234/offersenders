import React from 'react';
import type { Plan, Campaign, Page } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { CampaignIcon } from '../components/icons/CampaignIcon';
import { CustomerIcon } from '../components/icons/CustomerIcon';
import { AlertTriangleIcon } from '../components/icons/AlertTriangleIcon';
import { Button } from '../components/ui/Button';

interface DashboardProps {
  plan: Plan;
  smsUsed: number;
  smsLimit: number;
  customerCount: number;
  campaigns: Campaign[];
  announcement?: string;
  onNavigate: (page: Page) => void;
}

const Banner: React.FC<{
    level: 'warning' | 'danger';
    title: string;
    children: React.ReactNode;
}> = ({ level, title, children }) => {
    const baseClasses = 'border-l-4 p-4 rounded-md shadow-sm mb-6';
    const levelClasses = {
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
        danger: 'bg-red-50 border-red-400 text-red-700'
    };
    const iconColor = {
        warning: 'text-yellow-400',
        danger: 'text-red-400'
    };
    
    return (
        <div className={`${baseClasses} ${levelClasses[level]}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertTriangleIcon className={`h-5 w-5 ${iconColor[level]}`} />
                </div>
                <div className="ml-3">
                    <p className="font-bold">{title}</p>
                    <div className="text-sm mt-1">{children}</div>
                </div>
            </div>
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ plan, smsUsed, smsLimit, customerCount, campaigns, announcement, onNavigate }) => {
  const smsRemaining = smsLimit - smsUsed;
  const usagePercentage = Math.round((smsUsed / smsLimit) * 100);
  const nextCampaign = campaigns.find(c => new Date(c.scheduled_at) > new Date());
  
  const hasReachedLimit = smsUsed >= smsLimit;
  const isApproachingLimit = usagePercentage >= 80 && !hasReachedLimit;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      {announcement && (
        <div className="bg-indigo-600 text-white p-4 rounded-md shadow-lg mb-6 text-center">
            <p className="font-semibold">{announcement}</p>
        </div>
      )}

      {hasReachedLimit && (
        <Banner level="danger" title="Monthly SMS Limit Reached">
            <p>You have used all your SMS credits for this month. To continue sending campaigns, please upgrade your plan.</p>
            <div className="mt-2">
                <Button variant="danger" onClick={() => onNavigate('subscription')}>
                    Upgrade Plan
                </Button>
            </div>
        </Banner>
      )}

      {isApproachingLimit && (
        <Banner level="warning" title="Approaching SMS Limit">
            <p>You have used {usagePercentage}% of your monthly SMS credits. Consider upgrading your plan to avoid service interruption.</p>
            <div className="mt-2">
                <Button variant="secondary" onClick={() => onNavigate('subscription')}>
                    View Plans
                </Button>
            </div>
        </Banner>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Plan" value={plan.name} icon={<CampaignIcon />} />
        <StatCard title="Total Customers" value={customerCount.toString()} icon={<CustomerIcon />} />
        <StatCard title="SMS Remaining" value={Math.max(0, smsRemaining).toString()} icon={<CampaignIcon />} />
        <StatCard title="Next Campaign" value={nextCampaign ? new Date(nextCampaign.scheduled_at).toLocaleDateString() : 'None'} icon={<CampaignIcon />} />
      </div>

      <div className="mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly SMS Usage</h3>
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-base font-medium text-indigo-700">{smsUsed} / {smsLimit}</span>
              <span className="text-sm font-medium text-indigo-700">{usagePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-colors ${hasReachedLimit ? 'bg-red-500' : isApproachingLimit ? 'bg-yellow-500' : 'bg-indigo-600'}`} 
                style={{ width: `${usagePercentage > 100 ? 100 : usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Campaigns</h3>
                <Button variant="secondary" onClick={() => onNavigate('campaigns')}>View All</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent On</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMS Used</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(campaign.scheduled_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.smsUsed || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        </div>
      </div>
    </main>
  );
};
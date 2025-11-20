
import React from 'react';
import type { Page } from '../../types';
import { DashboardIcon } from '../icons/DashboardIcon';
import { CampaignIcon } from '../icons/CampaignIcon';
import { CustomerIcon } from '../icons/CustomerIcon';
import { BillingIcon } from '../icons/BillingIcon';
import { LogoutIcon } from '../icons/LogoutIcon';
import { SettingsIcon } from '../icons/SettingsIcon';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout }) => {
  const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { page: 'campaigns', label: 'Campaigns', icon: <CampaignIcon className="w-5 h-5" /> },
    { page: 'customers', label: 'Customers', icon: <CustomerIcon className="w-5 h-5" /> },
    { page: 'subscription', label: 'Subscription', icon: <BillingIcon className="w-5 h-5" /> },
    { page: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-indigo-600">OfferSender</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            isActive={currentPage === item.page}
            onClick={() => onNavigate(item.page)}
          />
        ))}
      </nav>
      <div className="px-4 py-4 mt-auto">
        <NavItem
            icon={<LogoutIcon className="w-5 h-5" />}
            label="Logout"
            isActive={false}
            onClick={onLogout}
        />
      </div>
    </aside>
  );
};

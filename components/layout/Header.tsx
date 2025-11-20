import React from 'react';
import type { Page } from '../../types';

interface HeaderProps {
    page: Page;
    businessName: string;
}

const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    campaigns: 'Campaigns',
    customers: 'Customers',
    subscription: 'Subscription & Billing',
    settings: 'Settings',
};

export const Header: React.FC<HeaderProps> = ({ page, businessName }) => {
    return (
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">{pageTitles[page]}</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">{businessName}</span>
                    <img
                        className="h-8 w-8 rounded-full"
                        src="https://picsum.photos/100"
                        alt="User avatar"
                    />
                </div>
            </div>
        </header>
    );
};
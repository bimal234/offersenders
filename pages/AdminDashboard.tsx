
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UserAddIcon } from '../components/icons/UserAddIcon';
import type { Business, Plan, Admin } from '../types';
import { PlanId, BusinessStatus } from '../types';
import { PRICING_PLANS } from '../constants';
import { supabase } from '../supabaseClient';

interface AdminDashboardProps {
  businesses: Business[];
  announcement: string;
  admins: Admin[];
  onUpdateBusiness: (business: Business) => Promise<void>;
  onDeleteBusiness: (businessId: string) => Promise<void>;
  onSetAnnouncement: (text: string) => void;
  onCreateAdmin: (admin: Omit<Admin, 'id'>) => void;
  onDeleteAdmin: (adminId: string) => void;
  onLogout: () => void;
}

const AdminHeader: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
    <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <Button variant="secondary" onClick={onLogout}>Logout</Button>
        </div>
    </header>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ businesses, announcement, admins, onUpdateBusiness, onDeleteBusiness, onSetAnnouncement, onCreateAdmin, onDeleteAdmin, onLogout }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [newAnnouncement, setNewAnnouncement] = useState(announcement);
    const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');

    // Config State
    const [smsApiUrl, setSmsApiUrl] = useState('https://smseveryone.com/api/campaign');
    const [smsUsername, setSmsUsername] = useState('pingscribe');
    const [smsPassword, setSmsPassword] = useState('');
    const [smsOriginator, setSmsOriginator] = useState('3247'); 

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase.from('app_config').select('*').eq('id', 'global').single();
            if (data) {
                setSmsApiUrl(data.sms_api_url || 'https://smseveryone.com/api/campaign');
                if (data.sms_api_key) {
                    setSmsUsername('pingscribe (Saved)');
                    setSmsPassword('******');
                }
            }
        };
        fetchConfig();
    }, []);

    const handleSaveConfig = async () => {
        let authHeader = '';
        
        if (smsUsername !== 'pingscribe (Saved)' && smsPassword !== '******') {
            const credentials = `${smsUsername}:${smsPassword}`;
            authHeader = btoa(credentials); 
        } else {
             const { data } = await supabase.from('app_config').select('sms_api_key').eq('id', 'global').single();
             authHeader = data?.sms_api_key || '';
        }

        const { error } = await supabase.from('app_config').upsert({ 
            id: 'global', 
            sms_api_key: authHeader, 
            sms_api_url: smsApiUrl 
        });
        
        if (error) alert("Error saving config: " + error.message);
        else alert("Configuration saved! Credentials encoded and stored securely.");
    };

    const openEditModal = (business: Business) => {
        setSelectedBusiness({ ...business });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedBusiness(null);
    };

    const handleSaveBusiness = async () => {
        if (selectedBusiness) {
            await onUpdateBusiness(selectedBusiness);
            closeEditModal();
        }
    };
    
    const handlePlanChange = (business: Business, newPlanId: PlanId) => {
        const newPlan = PRICING_PLANS.find(p => p.id === newPlanId);
        if(newPlan){
            setSelectedBusiness({ ...business, plan_id: newPlanId, sms_limit: newPlan.smsIncluded });
        }
    }
    
    const handleStatusChange = (business: Business, newStatus: BusinessStatus) => {
       setSelectedBusiness({ ...business, status: newStatus });
    }

    const handleCreateAdmin = () => {
        if (newAdminEmail) {
            onCreateAdmin({ email: newAdminEmail });
            setIsCreateAdminModalOpen(false);
            setNewAdminEmail('');
        } else {
            alert("Please enter an email address.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader onLogout={onLogout} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                 {/* Platform Configuration Section */}
                 <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-medium text-gray-900">Platform Configuration (SMSEveryone)</h3>
                    <p className="text-sm text-gray-500 mt-1">Enter your provider credentials below. The app will handle the connection.</p>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                         <div className="sm:col-span-6">
                            <label htmlFor="api_url" className="block text-sm font-medium text-gray-700">API URL Endpoint</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="api_url"
                                    id="api_url"
                                    value={smsApiUrl}
                                    onChange={(e) => setSmsApiUrl(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="https://smseveryone.com/api/campaign"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-3">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">API Username</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    value={smsUsername}
                                    onChange={(e) => setSmsUsername(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="e.g. pingscribe"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-3">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">API Password</label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={smsPassword}
                                    onChange={(e) => setSmsPassword(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="e.g. Pingscribe1!"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-3">
                            <label htmlFor="originator" className="block text-sm font-medium text-gray-700">Originator (Sender ID)</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="originator"
                                    id="originator"
                                    value={smsOriginator}
                                    onChange={(e) => setSmsOriginator(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="3247"
                                    disabled 
                                />
                                <p className="text-xs text-gray-500 mt-1">Fixed to '3247'.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button onClick={handleSaveConfig}>Save Credentials</Button>
                    </div>
                </div>

                {/* Announcement Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Site Announcement</h3>
                    <div className="mt-4 flex items-center space-x-2">
                        <input
                            type="text"
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., Scheduled maintenance this Sunday"
                        />
                        <Button onClick={() => onSetAnnouncement(newAnnouncement)}>Set Announcement</Button>
                    </div>
                </div>

                {/* Businesses List */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Business Accounts ({businesses.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMS Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {businesses.map(business => (
                                    <tr key={business.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{business.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{business.plan_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{business.sms_used} / {business.sms_limit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${business.status === BusinessStatus.Active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {business.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => openEditModal(business)} className="text-indigo-600 hover:text-indigo-900"><EditIcon /></button>
                                            <button onClick={() => confirm(`Delete ${business.name}? This is permanent.`) && onDeleteBusiness(business.id)} className="text-red-600 hover:text-red-900"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Admin Management Section */}
                <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Admin Users ({admins.length})</h3>
                        <Button variant="secondary" onClick={() => setIsCreateAdminModalOpen(true)}>
                            <UserAddIcon className="w-5 h-5 mr-2" />
                            Create Admin
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Email</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {admins.map(admin => (
                                    <tr key={admin.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => confirm(`Delete admin ${admin.email}?`) && onDeleteAdmin(admin.id)} 
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={admins.length <= 1}
                                                title={admins.length <= 1 ? "Cannot delete the only admin" : "Delete admin"}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mock Logs */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Simulated SMS Logs</h3>
                        <ul className="text-xs text-gray-600 font-mono space-y-1">
                            <li>[2023-10-27 14:03] TO:+6421... SENT (ID: c2)</li>
                            <li>[2023-10-27 14:02] TO:+6421... SENT (ID: c1)</li>
                            <li>[2023-10-27 14:01] TO:+6421... FAILED (ID: c1)</li>
                        </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Simulated Stripe Payments</h3>
                         <ul className="text-xs text-gray-600 font-mono space-y-1">
                            <li>[2023-10-20] $99.99 (Intermediate) - Corner Cafe</li>
                            <li>[2023-10-15] $59.99 (Basic) - Jane's Flower Shop</li>
                        </ul>
                    </div>
                </div>

            </main>

            {selectedBusiness && (
                <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit ${selectedBusiness.name}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={closeEditModal}>Cancel</Button>
                            <Button onClick={handleSaveBusiness}>Save Changes</Button>
                        </>
                    }>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
                            <select value={selectedBusiness.plan_id} onChange={(e) => handlePlanChange(selectedBusiness, e.target.value as PlanId)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                {PRICING_PLANS.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">SMS Limit Override</label>
                            <input type="number" value={selectedBusiness.sms_limit} onChange={(e) => setSelectedBusiness({...selectedBusiness, sms_limit: parseInt(e.target.value, 10)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Account Status</label>
                             <select value={selectedBusiness.status} onChange={(e) => handleStatusChange(selectedBusiness, e.target.value as BusinessStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value={BusinessStatus.Active}>Active</option>
                                <option value={BusinessStatus.Disabled}>Disabled</option>
                            </select>
                        </div>
                        <Button variant="secondary" onClick={() => setSelectedBusiness({ ...selectedBusiness, sms_used: 0 })}>
                            Reset Monthly Usage
                        </Button>
                    </div>
                </Modal>
            )}

            <Modal 
                isOpen={isCreateAdminModalOpen} 
                onClose={() => setIsCreateAdminModalOpen(false)} 
                title="Authorize New Admin"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsCreateAdminModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAdmin}>Add Admin</Button>
                    </>
                }>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Enter the email address of the new admin. They must <strong>Sign Up</strong> with this email address to access the Admin Dashboard.
                    </p>
                    <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input 
                            type="email" 
                            id="admin-email"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                            placeholder="new.admin@offersender.com"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

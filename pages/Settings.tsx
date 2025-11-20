
import React, { useState } from 'react';
import type { Business } from '../types';
import { Button } from '../components/ui/Button';

interface SettingsProps {
  business: Business;
  onUpdateProfile: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ business, onUpdateProfile, onUpdatePassword }) => {
  const [businessName, setBusinessName] = useState(business.name);
  const [newPassword, setNewPassword] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      await onUpdateProfile(businessName);
      alert('Profile updated successfully');
    } catch (error: any) {
      alert('Error updating profile: ' + error.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setIsLoadingPassword(true);
    try {
      await onUpdatePassword(newPassword);
      alert('Password updated successfully');
      setNewPassword('');
    } catch (error: any) {
      alert('Error updating password: ' + error.message);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Business Profile Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Business Profile</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Update your public business information.</p>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleProfileUpdate}>
              <div>
                <label htmlFor="business-name" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="business-name"
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoadingProfile}>
                {isLoadingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Security</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Ensure your account is secure by using a strong password.</p>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handlePasswordUpdate}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button type="submit" variant="secondary" disabled={isLoadingPassword || !newPassword}>
                {isLoadingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
};

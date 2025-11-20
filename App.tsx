
import React, { useState, useEffect } from 'react';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { Dashboard } from './pages/Dashboard';
import { Campaigns } from './pages/Campaigns';
import { Customers } from './pages/Customers';
import { Subscription } from './pages/Subscription';
import { Settings } from './pages/Settings';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

import type { Page, Business, Customer, Campaign, Admin, Plan } from './types';
import { PlanId, BusinessStatus, CampaignStatus, CampaignRecurrence } from './types';
import { PRICING_PLANS } from './constants';

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'login' | 'signup' | 'admin_login' | 'app' | 'admin_dashboard'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  
  // App Data State
  const [loggedInBusiness, setLoggedInBusiness] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Admin Data State
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [announcement, setAnnouncement] = useState('Welcome to the new OfferSender dashboard!');
  const [loading, setLoading] = useState(true);

  // --- SESSION & DATA FETCHING ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchDataForUser(session.user.id);
      } else {
        if (view !== 'admin_login' && view !== 'signup') {
             setView('login');
        }
      }
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchDataForUser(session.user.id);
      } else {
        setLoggedInBusiness(null);
        setCustomers([]);
        setCampaigns([]);
        if (view !== 'admin_login' && view !== 'signup') {
            setView('login');
        }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);
  
  const fetchDataForUser = async (userId: string) => {
      // 1. Check if Admin
      await fetchAdminData(userId);

      // 2. Fetch Business Data
      let retries = 3;
      let businessData = null;
      
      while (retries > 0 && !businessData) {
          const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (data) {
              businessData = data;
              break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
      }
      
      if (businessData) {
          setLoggedInBusiness(businessData);
          
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessData.id);
          if (customerError) console.error("Error fetching customers:", customerError);
          else setCustomers(customerData || []);

          const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('business_id', businessData.id);
          if (campaignError) console.error("Error fetching campaigns:", campaignError);
          else setCampaigns(campaignData || []);
      } else {
          console.log("Could not find business profile after retries.");
          setLoggedInBusiness(null);
      }
  };
  
  const fetchAdminData = async (userId: string) => {
       const { data: { user } } = await supabase.auth.getUser();
       if(user && user.email) {
            const { data: adminRecord } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', user.email)
                .single();
            
            if (adminRecord) {
                setView('admin_dashboard');
                handleAdminLoginSuccess(); 
            } else {
                if (view !== 'admin_dashboard') setView('app');
            }
       }
  }
  
  // --- AUTH HANDLERS ---
  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignup = async (businessName: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
        },
      },
    });

    if (error) {
      alert(error.message);
    } else if (data.user && !data.session) {
      alert("Signup successful! Please check your email to confirm your account before logging in.");
      setView('login');
    }
  };
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    setView('login');
  };
  
  const handleAdminLoginSuccess = async () => {
    setView('admin_dashboard');
    
    const { data: businessData, error: businessError } = await supabase.from('businesses').select('*');
    if (businessError) {
        console.error("Admin error fetching businesses:", businessError);
    } else {
        setAllBusinesses(businessData || []);
    }

    const { data: adminData, error: adminError } = await supabase.from('admin_users').select('*');
    if (!adminError && adminData) {
        setAdmins(adminData);
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
            setAdmins([{ id: user.id, email: user.email }]);
        }
    }
  };
  
  const handleAdminLogout = async () => {
      await supabase.auth.signOut();
      setView('admin_login');
  } 
  
  // --- CUSTOMER HANDLERS ---
  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'business_id'>) => {
    if (!loggedInBusiness) return;
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...customerData, business_id: loggedInBusiness.id })
      .select()
      .single();
    if (error) {
      alert(error.message);
    } else if (data) {
      setCustomers(prev => [...prev, data]);
    }
  };
  
  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
     const { data, error } = await supabase
      .from('customers')
      .update(updatedCustomer)
      .eq('id', updatedCustomer.id)
      .select()
      .single();
    if(error) {
        alert(error.message);
    } else if (data) {
        setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
    }
  };
  
  const handleDeleteCustomer = async (customerId: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      alert(error.message);
    } else {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    }
  };
  
  // --- CAMPAIGN HANDLERS ---
  const handleCreateCampaign = async (campaignData: Omit<Campaign, 'id' | 'status' | 'business_id' | 'created_at'>) => {
    if (!loggedInBusiness) return;
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ ...campaignData, business_id: loggedInBusiness.id, status: CampaignStatus.Scheduled })
      .select()
      .single();

    if (error) {
        alert(error.message);
    } else if (data) {
        setCampaigns(prev => [...prev, data]);
    }
  };

  // --- SETTINGS & PROFILE HANDLERS ---
  const handleUpdateProfile = async (name: string) => {
    if(!loggedInBusiness) return;
    const { data, error } = await supabase
        .from('businesses')
        .update({ name })
        .eq('id', loggedInBusiness.id)
        .select()
        .single();
    if (error) {
        throw error;
    } else if (data) {
        setLoggedInBusiness(data);
    }
  };

  const handleUpdatePassword = async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
  };

  const handlePlanChange = async (planId: PlanId) => {
      if(!loggedInBusiness) return;
      const plan = PRICING_PLANS.find(p => p.id === planId);
      if(!plan) return;

      const { data, error } = await supabase
          .from('businesses')
          .update({ plan_id: planId, sms_limit: plan.smsIncluded })
          .eq('id', loggedInBusiness.id)
          .select()
          .single();
      
      if (error) {
          alert(error.message);
      } else if (data) {
          setLoggedInBusiness(data);
          alert(`Successfully upgraded to ${plan.name} plan!`);
          setCurrentPage('dashboard');
      }
  }

  // --- ADMIN HANDLERS ---
  const handleUpdateBusiness = async (business: Business) => {
      const { data, error } = await supabase
          .from('businesses')
          .update({
              plan_id: business.plan_id,
              sms_limit: business.sms_limit,
              status: business.status,
              sms_used: business.sms_used
          })
          .eq('id', business.id)
          .select()
          .single();
      
      if (error) alert(error.message);
      else {
          setAllBusinesses(prev => prev.map(b => b.id === business.id ? data : b));
      }
  };

  const handleDeleteBusiness = async (businessId: string) => {
      const { error } = await supabase.from('businesses').delete().eq('id', businessId);
      if(error) alert(error.message);
      else setAllBusinesses(prev => prev.filter(b => b.id !== businessId));
  };

  const handleSetAnnouncement = (text: string) => {
      setAnnouncement(text);
      alert("Announcement updated (local state only for demo)");
  }

  const handleCreateAdmin = async (admin: Omit<Admin, 'id'>) => {
      const { data, error } = await supabase.from('admin_users').insert(admin).select().single();
      if(error) alert(error.message);
      else setAdmins(prev => [...prev, data]);
  }

  const handleDeleteAdmin = async (adminId: string) => {
      const { error } = await supabase.from('admin_users').delete().eq('id', adminId);
      if(error) alert(error.message);
      else setAdmins(prev => prev.filter(a => a.id !== adminId));
  }

  // --- SENDING UTILS ---
  const getAuthHeader = (pass: string) => {
      const user = 'pingscribe';
      const password = pass.trim();
      return btoa(`${user}:${password}`);
  };

  const sendSMS = async (phone: string, msg: string, auth: string): Promise<{ success: boolean, status: number, text: string }> => {
        // Format phone number - ensure it's in international format
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        // If starts with 0, replace with country code (assuming NZ = 64)
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '64' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('64') && !formattedPhone.startsWith('61')) {
            // If no country code, assume NZ (64)
            formattedPhone = '64' + formattedPhone;
        }

        // SMSEveryone API payload format
        const payloadObj = { 
            Message: msg,
            Originator: '3247', // Sender number
            Destinations: [formattedPhone],
            Action: 'create'
        };

        // REORDERED STRATEGIES:
        // 1. CORS Anywhere (PRIORITY for Online Preview): This prevents hanging. It fails fast (403) if locked, allowing user to unlock.
        // 2. Local Proxy (FALLBACK): Great for VS Code, but often hangs in Cloud Preview.
        // 3. Direct: Fail safe.
        const strategies = [
            {
                name: 'CORS Anywhere (Priority)',
                url: 'https://cors-anywhere.herokuapp.com/https://smseveryone.com/api/campaign',
                headers: { 
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                timeout: 10000 // Longer timeout for the proxy
            },
            { 
                name: 'Local Proxy (VS Code)', 
                url: '/sms-proxy/api/campaign',
                headers: { 
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 3000 // Very short timeout to prevent hanging in cloud
            },
            {
                name: 'Direct Fallback',
                url: 'https://smseveryone.com/api/campaign',
                headers: { 
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 3000
            }
        ];

        let lastResult = { success: false, status: 0, text: 'No strategies tried' };

        // Try strategies in order
        for (const strategy of strategies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), strategy.timeout); 

                // console.log(`Trying strategy: ${strategy.name}`); 
                const response = await fetch(strategy.url, {
                    method: 'POST',
                    headers: strategy.headers,
                    body: JSON.stringify(payloadObj),
                    signal: controller.signal,
                    cache: 'no-store',
                    credentials: 'omit'
                });
                
                clearTimeout(timeoutId);
                const text = await response.text();

                // If we hit the CORS lock, return immediately so UI can show unlock button
                if (response.status === 403 && text.includes('corsdemo')) {
                     return { success: false, status: 403, text };
                }
                
                // If Auth failed, no point trying other proxies
                if (response.status === 401) {
                    return { success: false, status: 401, text };
                }
                
                // Check if response is successful (200 OK) and API returned Code: 0
                if (response.ok) {
                    try {
                        const jsonResponse = JSON.parse(text);
                        // SMSEveryone API returns Code: 0 for success
                        if (jsonResponse.Code === 0) {
                            return { success: true, status: response.status, text };
                        } else {
                            // API returned an error code (e.g., -111, -117, -202)
                            return { success: false, status: response.status, text: jsonResponse.Message || text };
                        }
                    } catch {
                        // If response is not JSON but status is OK, consider it success
                        return { success: true, status: response.status, text };
                    }
                }

                lastResult = { success: false, status: response.status, text };

            } catch (err: any) {
                // console.log(`Strategy ${strategy.name} failed: ${err.message}`);
                // Continue to next strategy
            }
        }

        // Return the last error encountered
        return lastResult;
  };

  // --- CONNECTION TESTER ---
  const handleTestConnection = async (passwordUser: string): Promise<{ success: boolean; message: string; needsUnlock?: boolean }> => {
      if (!passwordUser) return { success: false, message: 'Password required' };
      
      const auth = getAuthHeader(passwordUser);
      // Send dummy message to verify connection
      const result = await sendSMS('64000000000', 'Ping Test', auth);
      
      if (result.status === 403 && result.text.includes('corsdemo')) {
          return { success: false, message: 'Proxy Locked', needsUnlock: true };
      }
      
      if (result.status === 401) {
          return { success: false, message: 'Incorrect Password (401)' };
      }

      if (result.status === 0) {
           return { success: false, message: 'Network Blocked - Check internet connection' };
      }
      
      // Check if response is 200 OK and API returned Code: 0 (success)
      if (result.status === 200) {
          try {
              const jsonResponse = JSON.parse(result.text);
              if (jsonResponse.Code === 0) {
                  return { success: true, message: 'Connection Verified!' };
              } else {
                  // API returned an error code
                  return { success: false, message: jsonResponse.Message || `API Error: Code ${jsonResponse.Code}` };
              }
          } catch {
              // If not JSON but status is 200, consider it success
              return { success: true, message: 'Connection Verified!' };
          }
      }
      
      // 400 Bad Request might still mean connection works (just bad request format)
      if (result.status === 400) {
          return { success: true, message: 'Connection Verified (400 - check request format)' };
      }

      // Handle 500 errors with more detail
      if (result.status === 500) {
          // Try to parse error message from response
          let errorMsg = 'Server Error (500)';
          try {
              const errorJson = JSON.parse(result.text);
              if (errorJson.error || errorJson.message) {
                  errorMsg = `Server Error: ${errorJson.error || errorJson.message}`;
              }
          } catch {
              // If not JSON, check if there's useful text
              if (result.text && result.text.length < 200) {
                  errorMsg = `Server Error: ${result.text.substring(0, 100)}`;
              }
          }
          return { success: false, message: errorMsg };
      }

      // For other errors, provide status and try to get error details
      let errorMsg = `Error ${result.status}`;
      try {
          const errorJson = JSON.parse(result.text);
          if (errorJson.error || errorJson.message) {
              errorMsg = `${errorJson.error || errorJson.message} (${result.status})`;
          }
      } catch {
          if (result.text && result.text.length < 100) {
              errorMsg = `${result.text} (${result.status})`;
          }
      }
      
      return { success: false, message: errorMsg };
  };

  // --- BULK SENDER LOGIC ---
  const handleBulkSend = async (
      message: string, 
      smsCount: number,
      passwordUser: string, 
      onProgress: (processed: number, total: number, success: number, failed: number, lastError?: string) => void,
      onLog: (msg: string) => void
  ) => {
    if (!loggedInBusiness) return { success: 0, failed: 0 };
    
    let successCount = 0;
    let failedCount = 0;
    const total = customers.length;
    const AUTH = getAuthHeader(passwordUser);

    onLog("Initializing Sender v15 (Prioritized Relay)...");
    
    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('02')) cleanPhone = '64' + cleanPhone.substring(1);
        
        onLog(`[${i+1}/${total}] Sending to ${cleanPhone}...`);
        
        const result = await sendSMS(cleanPhone, message, AUTH);
        
        if (result.success) {
            successCount++;
            onLog("-> SUCCESS");
        } else {
            failedCount++;
            if (result.status === 403 && result.text.includes('corsdemo')) {
                 onLog("!! PROXY LOCKED !! Unlock required.");
                 onProgress(i, total, successCount, failedCount, "PROXY_LOCK_REQUIRED");
                 return { success: successCount, failed: failedCount + (total - i - 1) };
            }
            if (result.status === 401) {
                onLog("!! AUTH FAILED !! Check password.");
                return { success: successCount, failed: failedCount + (total - i - 1) };
            }
            onLog(`-> FAILED (${result.status})`);
        }

        onProgress(i + 1, total, successCount, failedCount);
    }

    if (successCount > 0) {
        const newUsage = loggedInBusiness.sms_used + successCount;
        await supabase.from('businesses').update({ sms_used: newUsage }).eq('id', loggedInBusiness.id);
        setLoggedInBusiness(prev => prev ? ({...prev, sms_used: newUsage}) : null);
    }

    return { success: successCount, failed: failedCount };
  };

  // --- VIEW ROUTING ---
  if (loading) return <div className="flex items-center justify-center min-h-screen text-indigo-600">Loading...</div>;

  if (view === 'login') return <Login onLogin={handleLogin} onSwitchToAdmin={() => setView('admin_login')} onSwitchToSignup={() => setView('signup')} />;
  
  if (view === 'signup') return <Signup onSignup={handleSignup} onSwitchToLogin={() => setView('login')} />;

  if (view === 'admin_login') return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onSwitchToUser={() => setView('login')} />;

  if (view === 'admin_dashboard') return (
      <AdminDashboard 
        businesses={allBusinesses}
        announcement={announcement}
        admins={admins}
        onUpdateBusiness={handleUpdateBusiness}
        onDeleteBusiness={handleDeleteBusiness}
        onSetAnnouncement={handleSetAnnouncement}
        onCreateAdmin={handleCreateAdmin}
        onDeleteAdmin={handleDeleteAdmin}
        onLogout={handleAdminLogout}
      />
  );

  if (!loggedInBusiness) return <div className="p-8 text-center">Error loading business profile. Please contact support.</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header page={currentPage} businessName={loggedInBusiness.name} />
        
        {currentPage === 'dashboard' && (
          <Dashboard 
            plan={PRICING_PLANS.find(p => p.id === loggedInBusiness.plan_id) || PRICING_PLANS[0]} 
            smsUsed={loggedInBusiness.sms_used}
            smsLimit={loggedInBusiness.sms_limit}
            customerCount={customers.length}
            campaigns={campaigns}
            announcement={announcement}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'campaigns' && (
          <Campaigns 
             campaigns={campaigns}
             smsUsed={loggedInBusiness.sms_used}
             smsLimit={loggedInBusiness.sms_limit}
             customerCount={customers.length}
             onBulkSend={handleBulkSend}
             onTestConnection={handleTestConnection}
             onCreateCampaign={handleCreateCampaign}
          />
        )}

        {currentPage === 'customers' && (
          <Customers 
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {currentPage === 'subscription' && (
            <Subscription 
                currentPlanId={loggedInBusiness.plan_id}
                onPlanChange={handlePlanChange}
            />
        )}

        {currentPage === 'settings' && (
            <Settings 
                business={loggedInBusiness}
                onUpdateProfile={handleUpdateProfile}
                onUpdatePassword={handleUpdatePassword}
            />
        )}
      </div>
    </div>
  );
};

export default App;

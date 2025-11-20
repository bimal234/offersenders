
import React, { useState, useRef, useEffect } from 'react';
import type { Campaign, Page } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CampaignRecurrence, CampaignStatus } from '../types';

interface CampaignsProps {
  campaigns: Campaign[];
  smsUsed: number;
  smsLimit: number;
  customerCount: number;
  onBulkSend: (
      message: string, 
      smsCount: number,
      onProgress: (processed: number, total: number, success: number, failed: number, lastError?: string) => void,
      onLog: (msg: string) => void
  ) => Promise<{ success: number; failed: number }>;
  onTestConnection: () => Promise<{ success: boolean; message: string; needsUnlock?: boolean }>;
  onCreateCampaign: (campaignData: Omit<Campaign, 'id' | 'status' | 'business_id' | 'created_at' | 'customers' | 'smsUsed'>) => Promise<void>;
}

const getStatusBadge = (status: CampaignStatus) => {
  const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  const statusClasses = {
    [CampaignStatus.Draft]: "bg-gray-100 text-gray-800",
    [CampaignStatus.Scheduled]: "bg-blue-100 text-blue-800",
    [CampaignStatus.Sending]: "bg-yellow-100 text-yellow-800",
    [CampaignStatus.Sent]: "bg-green-100 text-green-800",
    [CampaignStatus.Failed]: "bg-red-100 text-red-800",
  };
  return `${baseClasses} ${statusClasses[status]}`;
};

export const Campaigns: React.FC<CampaignsProps> = ({ campaigns, smsUsed, smsLimit, customerCount, onBulkSend, onTestConnection, onCreateCampaign }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    content: '',
    scheduled_at: new Date().toISOString().substring(0, 16),
    recurrence: CampaignRecurrence.OneTime
  });

  const [bulkMessage, setBulkMessage] = useState('');
  
  // Test Connection State
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [sendingProgress, setSendingProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastError, setLastError] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProxyLocked, setIsProxyLocked] = useState(false);
  
  const smsRemaining = smsLimit - smsUsed;
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Auto-test connection when bulk modal opens
  useEffect(() => {
    if (isBulkModalOpen && testStatus === 'idle') {
      handleTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBulkModalOpen]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateCampaign(newCampaign);
    setCreateModalOpen(false);
    setNewCampaign({ title: '', content: '', scheduled_at: new Date().toISOString().substring(0, 16), recurrence: CampaignRecurrence.OneTime });
  };

  const addLog = (msg: string) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleCloseBulkModal = () => {
      if (isSending) {
          if (window.confirm("Sending is in progress. Are you sure you want to STOP and close?")) {
             setBulkModalOpen(false);
             window.location.reload(); 
          }
      } else {
          setBulkModalOpen(false);
          setIsFinished(false);
          setLogs([]);
          setBulkMessage('');
          setIsProxyLocked(false);
          setTestStatus('idle');
          setTestMessage('');
      }
  };

  const handleUnlockProxy = () => {
      window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
      setTestMessage("After unlocking, click 'Verify Credentials' again.");
      setIsProxyLocked(false); 
  };
  
  const handleTest = async () => {
      setTestStatus('testing');
      setTestMessage('Verifying connection...');
      setIsProxyLocked(false);

      // SAFETY TIMER: Force stop after 10 seconds no matter what
      let isTimedOut = false;
      const safetyTimer = setTimeout(() => {
          isTimedOut = true;
          setTestStatus('failed');
          setTestMessage('Verification Timed Out. Try again.');
      }, 10000);

      try {
          const result = await onTestConnection();
          
          if (!isTimedOut) {
              clearTimeout(safetyTimer); // Clear the safety timer if request finished
              
              if (result.success) {
                  setTestStatus('success');
                  setTestMessage(result.message);
              } else {
                  setTestStatus('failed');
                  setTestMessage(result.message);
                  if (result.needsUnlock) {
                      setIsProxyLocked(true);
                  }
              }
          }
      } catch (err: any) {
          if (!isTimedOut) {
             clearTimeout(safetyTimer);
             setTestStatus('failed');
             setTestMessage('Connection Error. Check internet.');
          }
      }
  };

  const handleConfirmBulkSend = async () => {
    if (customerCount > smsRemaining) {
      alert("Not enough SMS credits remaining.");
      return;
    }
    
    if (testStatus === 'failed') {
        if(!window.confirm("Connection verification failed. Are you sure you want to try sending anyway?")) return;
    }
    
    if (testStatus === 'testing') {
        alert("Please wait for connection verification to complete.");
        return;
    }

    setIsSending(true);
    setIsFinished(false);
    setIsProxyLocked(false);
    setSendingProgress(0);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailedCount(0);
    setLastError('');
    if (logs.length === 0) setLogs(['Starting bulk send process...']);
    else addLog('Restarting send process...');
    
    try {
        const result = await onBulkSend(
            bulkMessage, 
            customerCount,
            (processed, total, success, failed, errorMsg) => {
                setProcessedCount(processed);
                setSuccessCount(success);
                setFailedCount(failed);
                const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
                setSendingProgress(percentage);
                if (errorMsg) {
                    setLastError(errorMsg);
                    if (errorMsg === "PROXY_LOCK_REQUIRED") {
                        setIsProxyLocked(true);
                        setIsSending(false); 
                    }
                }
            },
            addLog
        );
        
        if (!isProxyLocked) {
            addLog(`----------------------------------------`);
            addLog(`PROCESS COMPLETE.`);
            addLog(`Final Success: ${result.success}`);
            addLog(`Final Failed: ${result.failed}`);
            setIsFinished(true);
        }

    } catch (error: any) {
        console.error(error);
        addLog(`CRITICAL APP ERROR: ${error.message}`);
        setIsFinished(true);
    } finally {
        if (!isProxyLocked) setIsSending(false);
    }
  };

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewModalOpen(true);
  };

  return (
    <main className="flex-1 overflow-y-auto p-8">
      {/* View Campaign Modal */}
      {selectedCampaign && (
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title={selectedCampaign.title}>
            <div className="space-y-4 text-sm">
                <div>
                    <dt className="font-medium text-gray-500">Status</dt>
                    <dd className="mt-1"><span className={getStatusBadge(selectedCampaign.status)}>{selectedCampaign.status}</span></dd>
                </div>
                <div>
                    <dt className="font-medium text-gray-500">Message Content</dt>
                    <dd className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{selectedCampaign.content}</dd>
                </div>
            </div>
        </Modal>
      )}

      {/* Create Campaign Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        title="Create New Campaign"
        footer={<>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-campaign-form">Create Campaign</Button>
        </>}
      >
        <form id="create-campaign-form" onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Campaign Title</label>
            <input type="text" id="title" value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Message Content</label>
            <textarea id="content" value={newCampaign.content} onChange={e => setNewCampaign({...newCampaign, content: e.target.value})} required rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700">Schedule Time</label>
            <input type="datetime-local" id="scheduled_at" value={newCampaign.scheduled_at} onChange={e => setNewCampaign({...newCampaign, scheduled_at: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
           <div>
            <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">Recurrence</label>
            <select id="recurrence" value={newCampaign.recurrence} onChange={e => setNewCampaign({...newCampaign, recurrence: e.target.value as CampaignRecurrence})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              {Object.values(CampaignRecurrence).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* Bulk Send Modal */}
      <Modal 
        isOpen={isBulkModalOpen} 
        onClose={handleCloseBulkModal} 
        title="Send One-Time Bulk SMS"
        footer={<>
            {!isSending && !isFinished && !isProxyLocked && (
                <Button variant="secondary" onClick={handleCloseBulkModal}>Cancel</Button>
            )}
            
            {(isProxyLocked) && (
                <Button onClick={handleUnlockProxy} className="bg-blue-500 hover:bg-blue-600 text-white w-full">
                    Unlock Proxy (Click Here)
                </Button>
            )}

            {isSending && (
                <Button variant="danger" onClick={handleCloseBulkModal}>Force Stop</Button>
            )}

            {!isSending && !isFinished && !isProxyLocked && (
                <Button onClick={handleConfirmBulkSend} disabled={!bulkMessage.trim() || testStatus === 'testing'}>
                    Send to {customerCount} Customers
                </Button>
            )}

            {isFinished && (
                 <Button onClick={handleCloseBulkModal}>Close Window</Button>
            )}
        </>}
       >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This will send to <strong>{customerCount}</strong> customers via <strong>SMSEveryone</strong>.</p>
          
          {/* Connection Status Section */}
          <div className={`p-3 rounded border ${testStatus === 'success' ? 'bg-green-50 border-green-200' : testStatus === 'failed' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-700">Connection Status</label>
                  {testStatus === 'testing' && (
                      <span className="text-xs text-gray-500">Verifying...</span>
                  )}
              </div>
              
              {/* Status Feedback */}
              {testMessage && (
                  <div className="mt-2">
                      <div className={`text-xs font-bold ${
                          testStatus === 'success' ? 'text-green-700' : 
                          testStatus === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                          {testMessage}
                      </div>
                      {testStatus === 'failed' && testMessage.includes('not configured') && (
                          <div className="mt-2 text-xs text-gray-600">
                              <strong>Note:</strong> Please contact your administrator to configure SMS API credentials in the Admin Dashboard.
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div>
            <label htmlFor="bulk-message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea id="bulk-message" value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Enter message..." disabled={isSending || isFinished} />
          </div>
          
          {/* Progress Section */}
          {(isSending || isFinished || logs.length > 0) && (
             <div className="space-y-2 mt-4 border-t pt-4">
                <ProgressBar progress={sendingProgress} />
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>{isFinished ? 'Finished' : 'Sending...'} {sendingProgress}%</span>
                    <span>{processedCount}/{customerCount}</span>
                </div>
                 <div className="flex space-x-4 text-xs font-semibold mt-1">
                    <span className="text-green-600">Success: {successCount}</span>
                    <span className="text-red-600">Failed: {failedCount}</span>
                </div>
                
                <div className="mt-2 bg-gray-900 text-green-400 p-2 rounded text-xs font-mono h-32 overflow-y-auto whitespace-pre-wrap" ref={logContainerRef}>
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
                
                {(isSending || isFinished) && failedCount > 0 && (
                    <div className="mt-4 p-2 bg-gray-100 border rounded text-xs text-gray-700">
                        <strong>Manual Fallback (Last Resort):</strong><br/>
                        If automated sending failed, you can run this in your terminal:<br/>
                        <code className="block bg-black text-white p-2 mt-1 rounded overflow-x-auto">
                            {`curl -X POST "https://smseveryone.com/api/campaign" \\
                            -H "Authorization: Basic [YOUR_AUTH]" \\
                            -H "Content-Type: application/json" \\
                            -d '{"Message": "Your message", "Originator": "3247", "Destinations": ["64..."], "Action": "create"}'`}
                        </code>
                    </div>
                )}
             </div>
          )}
        </div>
      </Modal>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Campaigns ({campaigns.length})</h2>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setBulkModalOpen(true)}>Send Bulk SMS</Button>
          <Button onClick={() => setCreateModalOpen(true)}>Create Campaign</Button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMS Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     <span className={getStatusBadge(campaign.status)}>{campaign.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(campaign.scheduled_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.smsUsed || '--'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleViewCampaign(campaign)} className="text-indigo-600 hover:text-indigo-900">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Mail, RefreshCw, CheckCircle2, Clock, Inbox, ShieldCheck, FileText, Trash2 } from 'lucide-react';
import { toast } from '../store/toastStore';

export default function GmailIntegration() {
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [cvList, setCvList] = useState([]);
  const [lastSynced, setLastSynced] = useState('Just now');
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [importingId, setImportingId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Gmail connected successfully via Google OAuth 2.0!');
      window.history.replaceState({}, '', window.location.pathname);
    }

    const fetchGmailStatus = async () => {
      try {
        const response = await api.get('/gmail/status');
        setConnected(response.data.connected);
        setGoogleEmail(response.data.email || '');
      } catch (error) {
        console.error('Gmail status error:', error);
      }
    };

    fetchGmailStatus();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data.jobs || []);
      } catch (error) {
        console.error('Jobs fetch error:', error);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const fetchDiscoveredCVs = async () => {
      try {
        const response = await api.get('/gmail/discovered');
        const scannedCVs = response.data.cvs.map((cv) => ({
          id: cv.id,
          messageId: cv.message_id,
          attachment: {
            filename: cv.filename,
            attachmentId: cv.attachment_id,
          },
          sender: cv.sender,
          subject: cv.subject || 'No subject',
          file: cv.filename,
          date: cv.email_date
            ? new Date(cv.email_date).toLocaleDateString()
            : 'Unknown date',
          status: cv.status === 'imported' ? 'Imported' : 'Ready to import',
          job: cv.status === 'imported' ? 'Imported' : 'Not imported',
        }));

        setCvList(scannedCVs);
      } catch (error) {
        console.error('Discovered CV fetch error:', error);
      }
    };

    fetchDiscoveredCVs();

    // Auto-refresh list every 15 seconds so newly discovered emails appear directly without needing manual page refresh
    const pollInterval = setInterval(fetchDiscoveredCVs, 15000);
    return () => clearInterval(pollInterval);
  }, [connected]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await api.get('/gmail/scan', { timeout: 60000 });
      const response = await api.get('/gmail/discovered');

      const scannedCVs = response.data.cvs.map((cv) => ({
        id: cv.id,
        messageId: cv.message_id,
        attachment: {
          filename: cv.filename,
          attachmentId: cv.attachment_id,
        },
        sender: cv.sender,
        subject: cv.subject || 'No subject',
        file: cv.filename,
        date: cv.email_date
          ? new Date(cv.email_date).toLocaleDateString()
          : 'Unknown date',
        status: cv.status === 'imported' ? 'Imported' : 'Ready to import',
        job: cv.status === 'imported' ? 'Imported' : 'Not imported',
      }));

      setCvList(scannedCVs);
      if (scannedCVs.length === 0) {
        toast.info('Scan complete: No new PDF or DOCX candidate attachments found in recent emails.');
      } else {
        toast.success(`Discovered ${scannedCVs.length} candidate attachments in your inbox!`);
      }
      setLastSynced('Just now');
    } catch (error) {
      console.error('Gmail sync error:', error);
      toast.error('Failed to scan Gmail inbox.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearDiscovered = async () => {
    if (!window.confirm('Are you sure you want to clear the discovered list? This will remove all unimported items and allow you to scan only your incoming Inbox.')) {
      return;
    }
    try {
      await api.delete('/gmail/discovered');
      setCvList([]);
      toast.success('Discovered list cleared. Click "Scan Now" to fetch only incoming Inbox CVs.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear discovered list.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Gmail Ingestion & Email Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Connect your Google Workspace or Gmail account via OAuth 2.0 to automatically monitor and screen incoming CV attachments.
        </p>
      </div>

      {/* Connection Card */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-100 shadow-sm">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Google Workspace / Gmail</h2>
                {connected && (
                  <span className="badge-green text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {connected
                  ? `Active Mailbox: ${googleEmail}`
                  : 'Authorize inbox read access to enable automated resume collection'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {connected ? (
              <>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="btn-secondary text-xs sm:text-sm !px-4 !py-2 flex items-center gap-2 shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                  {isSyncing ? 'Scanning Inbox...' : 'Scan Now'}
                </button>
                {cvList.length > 0 && (
                  <button
                    onClick={handleClearDiscovered}
                    className="btn-ghost text-xs sm:text-sm !text-gray-500 hover:!text-red-600 hover:!bg-red-50 border border-gray-200 hover:border-red-200 flex items-center gap-1.5"
                    title="Clear discovered list"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear List
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      await api.delete('/gmail/disconnect');
                      setConnected(false);
                      setGoogleEmail('');
                      setCvList([]);
                      toast.info('Gmail disconnected.');
                    } catch (error) {
                      console.error('Gmail disconnect error:', error);
                      toast.error('Failed to disconnect Gmail.');
                    }
                  }}
                  className="btn-ghost text-xs sm:text-sm !text-red-600 hover:!bg-red-50 border border-transparent hover:border-red-200"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const response = await api.get('/gmail/connect');
                    window.location.href = response.data.url;
                  } catch (error) {
                    console.error('Gmail connection error:', error);
                    toast.error('Failed to start Gmail connection.');
                  }
                }}
                className="btn-primary text-xs sm:text-sm !px-5 !py-2.5 flex items-center gap-2 shadow-sm"
              >
                <Mail className="w-4 h-4" /> Connect Gmail Account
              </button>
            )}
          </div>
        </div>

        {connected && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-gray-100 text-xs sm:text-sm">
            <div className="flex items-center gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Last Synchronized</p>
                <p className="font-bold text-gray-800">{lastSynced}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
              <Inbox className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Discovered Attachments</p>
                <p className="font-bold text-gray-800">{cvList.length} Resumes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-emerald-700 font-semibold uppercase">Polling Worker</p>
                <p className="font-bold text-emerald-700">5-minute cron active</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discovered CVs List */}
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/60">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900">
              Discovered Email Attachments ({cvList.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select a target position to import and route candidate CVs into the AI screening queue
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="select-field text-xs sm:text-sm w-full sm:min-w-[240px]"
            >
              <option value="">Select target job opening...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {cvList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/50 transition"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {item.subject}
                    </p>
                    <span className="badge-indigo text-[10px]">
                      {item.job}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    From: <span className="text-gray-800 font-medium">{item.sender}</span> · File: <span className="font-semibold text-gray-800">{item.file}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                <span className="text-xs text-gray-400">{item.date}</span>
                <span className={`badge text-xs ${item.status === 'Imported' ? 'badge-green' : 'badge-yellow'}`}>
                  {item.status}
                </span>

                <button
                  onClick={async () => {
                    if (!selectedJobId) {
                      toast.warning('Please select a target job opening from the dropdown first.');
                      return;
                    }

                    try {
                      setImportingId(item.id);
                      await api.post('/gmail/import', {
                        jobId: selectedJobId,
                        messageId: item.messageId,
                        attachment: item.attachment,
                      });

                      setCvList((prev) =>
                        prev.map((cv) =>
                          cv.id === item.id
                            ? {
                              ...cv,
                              status: 'Imported',
                              job: jobs.find((job) => job.id === selectedJobId)?.title || 'Imported',
                            }
                            : cv
                        )
                      );
                      toast.success(`Imported ${item.file} into AI screening queue!`);
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to import CV.');
                    } finally {
                      setImportingId(null);
                    }
                  }}
                  disabled={!selectedJobId || item.status === 'Imported' || importingId === item.id}
                  className="btn-primary text-xs !px-3.5 !py-1.5 disabled:opacity-50"
                >
                  {item.status === 'Imported'
                    ? 'Imported'
                    : importingId === item.id
                      ? 'Queueing...'
                      : 'Import to AI'}
                </button>
              </div>
            </div>
          ))}

          {cvList.length === 0 && (
            <div className="p-8 sm:p-12 text-center text-gray-400 text-xs sm:text-sm">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No email attachments discovered</p>
              <p className="text-gray-400 mt-1 max-w-sm mx-auto">
                {connected
                  ? 'Click "Scan Now" above to check your Gmail inbox for new candidate resumes.'
                  : 'Connect your Gmail account to begin scanning candidate resumes.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

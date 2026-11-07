import React, { useState, useEffect } from 'react';
import { User, Bell, Sliders, Check, AlertCircle, Lock } from 'lucide-react';
import api from '../api/client';
import useAuthStore from '../store/authStore';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [activeTab, setActiveTab] = useState('profile');
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: 'Acme Recruiting Co.',
    role: user?.role || 'Lead Recruiter',
    currentPassword: '',
    newPassword: '',
  });

  const [preferences, setPreferences] = useState({
    autoScore: true,
    emailAlerts: true,
    minMatchThreshold: 75,
  });

    // Fetch real current user profile from PostgreSQL
    useEffect(() => {
      const fetchUserProfile = async () => {
        try {
          const response = await api.get('/auth/me');
          if (response.data.user) {
            const dbUser = response.data.user;
            setProfile((prev) => ({
              ...prev,
              name: dbUser.name || prev.name,
              email: dbUser.email || prev.email,
              role: dbUser.role || prev.role,
            }));
            updateUser(dbUser);
          }
        } catch (err) {
          console.error('Failed to load user profile from backend:', err);
        }
      };

      fetchUserProfile();
    }, [updateUser]);

    const handleSaveProfile = async (e) => {
      e.preventDefault();
      setSaving(true);
      setSavedMessage('');
      setErrorMessage('');

      try {
        const payload = {
          name: profile.name.trim(),
        };

        if (profile.newPassword) {
          payload.currentPassword = profile.currentPassword;
          payload.newPassword = profile.newPassword;
        }

        const response = await api.put('/auth/profile', payload);

        if (response.data.user) {
          updateUser(response.data.user);
        }

        setSavedMessage(response.data.message || 'Profile saved successfully!');
        setProfile((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
        setTimeout(() => setSavedMessage(''), 4000);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Failed to update profile.');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            System & Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage your live recruiter credentials in PostgreSQL, AI screening parameters, and system alerts.
          </p>
        </div>

        {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-2 sm:gap-4 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
            >
              <User className="w-4 h-4" /> Recruiter Profile
            </button>
            <button
              onClick={() => setActiveTab('screening')}
              className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${activeTab === 'screening'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
            >
              <Sliders className="w-4 h-4" /> AI Evaluation Criteria
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${activeTab === 'notifications'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
            >
              <Bell className="w-4 h-4" /> System Alerts
            </button>
          </div>

            {/* Alerts */}
            {savedMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{savedMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {activeTab === 'profile' && (
                  <div className="card p-5 sm:p-6 space-y-5">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-gray-900">
                          Account Credentials & Profile
                        </h2>
                        <p className="text-xs text-gray-400">Stored directly in your PostgreSQL database</p>
                      </div>
                      <span className="badge-indigo text-[11px]">Role: {profile.role}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="input-field"
                          placeholder="Your Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Work Email (Read Only)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={profile.email}
                          className="input-field !bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      </div>

                      {/* Change Password Section */}
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-gray-500" /> Change Password (Optional)
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">Leave blank if you do not wish to modify your password</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={profile.currentPassword}
                              onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                              className="input-field"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={profile.newPassword}
                              onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                              className="input-field"
                              placeholder="At least 8 characters"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
        )}

                    {activeTab === 'screening' && (
                        <div className="card p-5 sm:p-6 space-y-5">
                          <h2 className="text-sm sm:text-base font-bold text-gray-900 border-b pb-3">
                            Automated AI Screening Parameters
                          </h2>

                          <div className="space-y-4">
                              <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">Automatic Asynchronous Evaluation</p>
                                  <p className="text-xs text-gray-500">
                                    Immediately dispatch uploaded CVs to RabbitMQ workers for AI analysis without manual confirmation.
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={preferences.autoScore}
                                  onChange={(e) => setPreferences({ ...preferences, autoScore: e.target.checked })}
                                  className="w-4 h-4 text-indigo-600 rounded mt-1 sm:mt-0"
                                />
                          </div>

                              <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                                  <span>Minimum Recommendation Threshold</span>
                                  <span className="text-indigo-600 font-extrabold">{preferences.minMatchThreshold}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="50"
                                  max="95"
                                  value={preferences.minMatchThreshold}
                                  onChange={(e) => setPreferences({ ...preferences, minMatchThreshold: Number(e.target.value) })}
                                  className="w-full accent-indigo-600 cursor-pointer"
                                />
                                <p className="text-[11px] text-gray-400">
                                  Candidates scoring at or above this score are flagged as "Recommended".
                                </p>
                              </div>
                            </div>
                          </div>
        )}

                          {activeTab === 'notifications' && (
                                <div className="card p-5 sm:p-6 space-y-5">
                                  <h2 className="text-sm sm:text-base font-bold text-gray-900 border-b pb-3">
                                    Notification Channels
                                  </h2>
                                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                                    <div>
                                      <p className="text-sm font-bold text-gray-900">Email Alerts on High-Match Candidates</p>
                                      <p className="text-xs text-gray-500">
                                        Receive an email digest whenever a candidate scores $\ge$85% on a job opening.
                                      </p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={preferences.emailAlerts}
                                      onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                                      className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                  </div>
                                </div>
        )}

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                      type="submit"
                                      disabled={saving}
                                      className="btn-primary text-xs sm:text-sm !px-5 !py-2.5 shadow-sm"
                                    >
                                      {saving ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                              </form>
                            </div>
                          );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Shield,
  CreditCard,
  User,
  Lock,
  Smartphone,
  Monitor,
  LogOut,
  ChevronRight,
  Save,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface NotificationRow {
  id: string;
  activity: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

type NotificationChannel = 'email' | 'sms' | 'push';

const INITIAL_NOTIFICATIONS: NotificationRow[] = [
  { id: '1', activity: 'New Booking Requests', email: true, sms: true, push: true },
  { id: '2', activity: 'Trip Reminders', email: true, sms: false, push: true },
  { id: '3', activity: 'Messages from Neighbors', email: true, sms: false, push: true },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      style={{ height: '1.375rem', width: '2.5rem' }}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>(INITIAL_NOTIFICATIONS);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'notifications' | 'profile' | 'security'>('profile');

  useEffect(() => {
    api.getMe().then((data) => {
      const user = data as { firstName?: string; lastName?: string; phone?: string; bio?: string; username: string };
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone(user.phone ?? '');
      setBio(user.bio ?? '');
      setUsername(user.username ?? '');
    }).catch(console.error);
  }, []);

  function toggleNotification(id: string, channel: NotificationChannel) {
    setNotifications((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [channel]: !row[channel] } : row)),
    );
  }

  async function handleProfileSave() {
    try {
      setProfileLoading(true);
      setProfileError('');
      await api.updateMe({ firstName, lastName, phone, bio });
      setProfileMsg('Profile saved successfully.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword) {
      setPasswordError('Both fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    try {
      setPasswordLoading(true);
      setPasswordError('');
      await api.updatePassword({ currentPassword, newPassword });
      setPasswordMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  }

  const navLinks = [
    { id: 'profile' as const, icon: User, label: 'Profile' },
    { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
    { id: 'security' as const, icon: Shield, label: 'Security' },
    { id: 'payments' as const, icon: CreditCard, label: 'Payments' },
  ];

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || username.charAt(0).toUpperCase() || 'U';
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : username;

  return (
    <AppLayout>
      <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 py-8 gap-6">
        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              {initials}
            </div>
            <div className="font-semibold text-gray-900">{displayName}</div>
            <div className="text-xs text-gray-500 mt-0.5">Settings &amp; Privacy</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {navLinks.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as typeof activeSection)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                  activeSection === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeSection === id ? 'text-blue-600' : 'text-gray-400'}`} />
                {label}
                {activeSection === id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Profile</h1>
              <p className="text-sm text-gray-500 mb-6">Update your personal information.</p>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                {profileError && <p className="text-red-600 text-xs mb-3">{profileError}</p>}
                {profileMsg && <p className="text-green-600 text-xs mb-3">{profileMsg}</p>}
                <button
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Notifications</h1>
              <p className="text-sm text-gray-500 mb-6">Manage how you receive updates.</p>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 w-1/2">
                          Activity
                        </th>
                        {(['Email', 'SMS', 'Push'] as const).map((ch) => (
                          <th key={ch} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                            {ch}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {notifications.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 text-sm text-gray-900">{row.activity}</td>
                          {(['email', 'sms', 'push'] as NotificationChannel[]).map((ch) => (
                            <td key={ch} className="px-4 py-3.5 text-center">
                              <div className="flex justify-center">
                                <Toggle
                                  checked={row[ch]}
                                  onChange={() => toggleNotification(row.id, ch)}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Security</h1>
              <p className="text-sm text-gray-500 mb-6">Keep your account secure.</p>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {/* 2FA */}
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Two-Factor Authentication</div>
                        <div className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</div>
                      </div>
                    </div>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700 whitespace-nowrap ml-4">
                      Set up 2FA →
                    </button>
                  </div>

                  {/* Change password */}
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Change Password</div>
                        <div className="text-xs text-gray-500 mt-0.5">Use a strong, unique password</div>
                      </div>
                    </div>
                    <div className="space-y-3 max-w-sm">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {passwordError && <p className="text-red-600 text-xs">{passwordError}</p>}
                      {passwordMsg && <p className="text-green-600 text-xs">{passwordMsg}</p>}
                      <button
                        onClick={handlePasswordChange}
                        disabled={passwordLoading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Active Sessions</h2>
                  <p className="text-xs text-gray-500">You are currently logged in on these devices.</p>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Current Browser</div>
                      <div className="text-xs text-gray-400">Active Now</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    CURRENT SESSION
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

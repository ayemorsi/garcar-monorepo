'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, UserCheck, Wifi, RefreshCw, Building2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface AppSettings {
  registrationOpen: boolean;
  requireApproval: boolean;
}

interface PendingUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  building?: string;
  createdAt: string;
  verificationData?: {
    verificationDocument?: string;
    apartment?: string;
  };
}

interface OnlineUser {
  _id: string;
  username: string;
  lastSeen: string;
  role: string;
}

interface Building {
  _id: string;
  name: string;
  address: string;
  active: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string>('');
  const [approvingId, setApprovingId] = useState<string>('');
  const [deletingBuildingId, setDeletingBuildingId] = useState<string>('');
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '' });
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, p, o, b] = await Promise.all([
        api.adminGetSettings() as Promise<AppSettings>,
        api.adminGetPendingUsers() as Promise<PendingUser[]>,
        api.adminGetOnlineUsers() as Promise<OnlineUser[]>,
        api.adminGetBuildings() as Promise<Building[]>,
      ]);
      setSettings(s);
      setPendingUsers(p);
      setOnlineUsers(o);
      setBuildings(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      api.adminGetOnlineUsers()
        .then((o) => setOnlineUsers(o as OnlineUser[]))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function updateSetting(key: keyof AppSettings, value: boolean) {
    if (!settings) return;
    setSavingKey(key);
    try {
      const updated = await api.adminUpdateSettings({ [key]: value }) as AppSettings;
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    } finally {
      setSavingKey('');
    }
  }

  async function approveUser(userId: string) {
    setApprovingId(userId);
    try {
      await api.adminApproveUser(userId);
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setApprovingId('');
    }
  }

  async function addBuilding(e: React.FormEvent) {
    e.preventDefault();
    if (!newBuilding.name || !newBuilding.address) return;
    setAddingBuilding(true);
    try {
      const b = await api.adminAddBuilding(newBuilding) as Building;
      setBuildings((prev) => [b, ...prev]);
      setNewBuilding({ name: '', address: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add building');
    } finally {
      setAddingBuilding(false);
    }
  }

  async function deleteBuilding(id: string) {
    setDeletingBuildingId(id);
    try {
      await api.adminDeleteBuilding(id);
      setBuildings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete building');
    } finally {
      setDeletingBuildingId('');
    }
  }

  async function toggleBuilding(b: Building) {
    try {
      const updated = await api.adminUpdateBuilding(b._id, { active: !b.active }) as Building;
      setBuildings((prev) => prev.map((x) => x._id === b._id ? updated : x));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update building');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-white">App Settings</h1>
            <p className="text-sm text-gray-400">Manage registration and user access</p>
          </div>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Registration Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Registration Controls</h2>
        </div>

        {/* Registration Open */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Registration Open</p>
            <p className="text-xs text-gray-400 mt-0.5">
              When OFF, new users cannot create accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savingKey === 'registrationOpen' && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <Toggle
              checked={settings?.registrationOpen ?? true}
              onChange={(v) => updateSetting('registrationOpen', v)}
              disabled={savingKey === 'registrationOpen'}
            />
          </div>
        </div>

        {/* Require Approval */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Require Approval</p>
            <p className="text-xs text-gray-400 mt-0.5">
              When ON, new accounts need admin approval before they can log in
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savingKey === 'requireApproval' && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <Toggle
              checked={settings?.requireApproval ?? false}
              onChange={(v) => updateSetting('requireApproval', v)}
              disabled={savingKey === 'requireApproval'}
            />
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Pending Approvals
          </h2>
          {pendingUsers.length > 0 && (
            <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </div>

        {pendingUsers.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No pending approvals
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {pendingUsers.map((user) => (
              <li key={user._id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  {(user.firstName || user.lastName) && (
                    <p className="text-xs text-gray-400">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
                  )}
                  {user.building && (
                    <p className="text-xs text-blue-400 mt-0.5">{user.building}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    Registered {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  {user.verificationData?.verificationDocument && (
                    <a
                      href={user.verificationData.verificationDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-400 hover:text-yellow-300 underline"
                    >
                      View Document
                    </a>
                  )}
                </div>
                <button
                  onClick={() => approveUser(user._id)}
                  disabled={approvingId === user._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {approvingId === user._id ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-3 h-3" />
                  )}
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Buildings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Apartment Buildings</h2>
          <span className="ml-auto text-xs text-gray-500">{buildings.filter(b => b.active).length} active</span>
        </div>

        {/* Add building form */}
        <form onSubmit={addBuilding} className="px-6 py-4 border-b border-gray-800 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Building name"
            value={newBuilding.name}
            onChange={(e) => setNewBuilding((n) => ({ ...n, name: e.target.value }))}
            className="flex-1 min-w-40 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Address"
            value={newBuilding.address}
            onChange={(e) => setNewBuilding((n) => ({ ...n, address: e.target.value }))}
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={addingBuilding || !newBuilding.name || !newBuilding.address}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>

        {buildings.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">No buildings yet</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {buildings.map((b) => (
              <li key={b._id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${b.active ? 'text-white' : 'text-gray-500 line-through'}`}>{b.name}</p>
                  <p className="text-xs text-gray-500 truncate">{b.address}</p>
                </div>
                <Toggle checked={b.active} onChange={() => toggleBuilding(b)} />
                <button
                  onClick={() => deleteBuilding(b._id)}
                  disabled={deletingBuildingId === b._id}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Currently Online */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Currently Online
          </h2>
          <span className="text-xs text-gray-500">(active in last 5 min)</span>
          {onlineUsers.length > 0 && (
            <span className="ml-auto bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {onlineUsers.length}
            </span>
          )}
        </div>

        {onlineUsers.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No users currently online
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {onlineUsers.map((user) => (
              <li key={user._id} className="px-6 py-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.username}</p>
                  {user.role === 'admin' && (
                    <span className="text-xs text-blue-400 font-medium">admin</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(user.lastSeen)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

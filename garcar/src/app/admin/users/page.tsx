'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserX, UserCheck, Trash2, KeyRound,
  ChevronDown, Building2, ShieldCheck, Shield,
  Copy, Check,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AdminUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  building?: string;
  role: string;
  paused: boolean;
  isVerified: boolean;
  createdAt: string;
  carCount: number;
}

interface ResetResult {
  userId: string;
  tempPassword: string;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState('');
  const [status, setStatus] = useState('');
  const [buildings, setBuildings] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (building) params.building = building;
      if (status) params.status = status;
      const data = await api.adminGetUsers(params) as AdminUser[];
      setUsers(data);
      const bset = Array.from(new Set(data.map((u) => u.building).filter(Boolean))) as string[];
      setBuildings(bset);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, building, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function togglePause(user: AdminUser) {
    setActionLoading(user._id + '-pause');
    try {
      await api.adminUpdateUser(user._id, { paused: !user.paused });
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, paused: !u.paused } : u));
    } finally {
      setActionLoading('');
    }
  }

  async function resetPassword(userId: string) {
    setActionLoading(userId + '-reset');
    try {
      const res = await api.adminResetPassword(userId) as { tempPassword: string };
      setResetResult({ userId, tempPassword: res.tempPassword });
    } finally {
      setActionLoading('');
    }
  }

  async function deleteUser(userId: string) {
    setActionLoading(userId + '-delete');
    try {
      await api.adminDeleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setConfirmDelete('');
    } finally {
      setActionLoading('');
    }
  }

  function copyPassword() {
    if (resetResult) {
      navigator.clipboard.writeText(resetResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">Manage all resident accounts</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
        </div>

        <div className="relative">
          <select
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm text-gray-300 pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm text-gray-300 px-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="unverified">Unverified</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        <span className="text-xs text-gray-500 ml-auto">{users.length} users</span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              {['User', 'Building', 'Status', 'Listings', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No users found.</td></tr>
            ) : users.map((user) => {
              const displayName = user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.username;
              const initials = displayName.slice(0, 2).toUpperCase();
              return (
                <tr key={user._id} className={`hover:bg-gray-800/40 transition-colors ${user.paused ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-100">{displayName}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {user.building || <span className="text-gray-600 italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.role === 'admin' && <Badge label="ADMIN" color="bg-yellow-900/50 text-yellow-400" />}
                      {user.paused
                        ? <Badge label="PAUSED" color="bg-red-900/50 text-red-400" />
                        : <Badge label="ACTIVE" color="bg-green-900/50 text-green-400" />}
                      {user.isVerified
                        ? <Badge label="VERIFIED" color="bg-blue-900/50 text-blue-400" />
                        : <Badge label="UNVERIFIED" color="bg-gray-700 text-gray-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-center">{user.carCount}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Pause / Unpause */}
                      <button
                        title={user.paused ? 'Unpause account' : 'Pause account'}
                        onClick={() => togglePause(user)}
                        disabled={!!actionLoading}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.paused
                            ? 'text-green-400 hover:bg-green-900/40'
                            : 'text-amber-400 hover:bg-amber-900/40'
                        }`}
                      >
                        {user.paused ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>

                      {/* Reset password */}
                      <button
                        title="Reset password"
                        onClick={() => resetPassword(user._id)}
                        disabled={!!actionLoading}
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/40 transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Promote/demote */}
                      <button
                        title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        onClick={async () => {
                          setActionLoading(user._id + '-role');
                          try {
                            await api.adminUpdateUser(user._id, { role: user.role === 'admin' ? 'user' : 'admin' });
                            setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
                          } finally { setActionLoading(''); }
                        }}
                        disabled={!!actionLoading}
                        className={`p-1.5 rounded-lg transition-colors ${user.role === 'admin' ? 'text-yellow-400 hover:bg-yellow-900/40' : 'text-gray-500 hover:bg-gray-700'}`}
                      >
                        {user.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>

                      {/* Delete */}
                      <button
                        title="Delete account"
                        onClick={() => setConfirmDelete(user._id)}
                        disabled={!!actionLoading}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {resetResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-white mb-2">Temporary Password</h3>
            <p className="text-sm text-gray-400 mb-4">Share this with the user. They should change it on next login.</p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-4">
              <code className="flex-1 text-green-400 font-mono text-sm">{resetResult.tempPassword}</code>
              <button onClick={copyPassword} className="text-gray-400 hover:text-white">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setResetResult(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-400 mb-4">
              This will permanently delete the user, all their listings, and their bookings. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete('')}
                className="flex-1 py-2 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

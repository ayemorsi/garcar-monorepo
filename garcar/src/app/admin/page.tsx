'use client';

import { useState, useEffect } from 'react';
import {
  Users, Car, CalendarCheck, DollarSign,
  UserX, ShieldCheck, Clock,
  Activity, UserPlus, PlusSquare, TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  pausedUsers: number;
  pendingVerifications: number;
  newUsersThisMonth: number;
  buildings: string[];
}

interface ActivityEvent {
  type: 'new_user' | 'booking' | 'listing';
  description: string;
  user: string;
  date: string;
}

const TYPE_STYLES: Record<string, string> = {
  new_user: 'bg-green-900/50 text-green-400',
  booking: 'bg-blue-900/50 text-blue-400',
  listing: 'bg-purple-900/50 text-purple-400',
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  new_user: UserPlus,
  booking: CalendarCheck,
  listing: PlusSquare,
};

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.adminGetStats() as Promise<AdminStats>,
      api.adminGetActivity() as Promise<ActivityEvent[]>,
    ])
      .then(([s, a]) => { setStats(s); setActivity(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform overview across all buildings</p>
      </div>

      {/* Primary stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard icon={Users} label="Total Users" value={loading ? '—' : stats?.totalUsers ?? 0}
          sub={`${stats?.newUsersThisMonth ?? 0} new this month`} color="bg-blue-900/50 text-blue-400" />
        <StatCard icon={Car} label="Listings" value={loading ? '—' : stats?.totalListings ?? 0}
          sub="Active car listings" color="bg-purple-900/50 text-purple-400" />
        <StatCard icon={CalendarCheck} label="Bookings" value={loading ? '—' : stats?.totalBookings ?? 0}
          sub="All time" color="bg-green-900/50 text-green-400" />
        <StatCard icon={DollarSign} label="Revenue" value={loading ? '—' : `$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          sub="Completed bookings" color="bg-yellow-900/50 text-yellow-400" />
      </div>

      {/* Secondary stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard icon={ShieldCheck} label="Active Users" value={loading ? '—' : stats?.activeUsers ?? 0}
          color="bg-green-900/50 text-green-400" />
        <StatCard icon={UserX} label="Paused Accounts" value={loading ? '—' : stats?.pausedUsers ?? 0}
          color="bg-red-900/50 text-red-400" />
        <StatCard icon={Clock} label="Pending Verifications" value={loading ? '—' : stats?.pendingVerifications ?? 0}
          sub="Awaiting review" color="bg-amber-900/50 text-amber-400" />
      </div>

      {/* Activity + Buildings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-5 py-4 border-b border-gray-800">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-800 max-h-80 sm:max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : activity.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No activity yet.</div>
            ) : activity.map((event, i) => {
              const Icon = TYPE_ICON[event.type] ?? Activity;
              return (
                <div key={i} className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_STYLES[event.type] ?? 'bg-gray-800 text-gray-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.user} · {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buildings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-5 py-4 border-b border-gray-800">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Buildings</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
            ) : !stats?.buildings?.length ? (
              <p className="text-sm text-gray-500 text-center py-4">No buildings set yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.buildings.map((b) => (
                  <li key={b} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-200 truncate">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

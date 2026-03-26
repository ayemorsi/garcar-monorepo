'use client';

import { useState, useEffect } from 'react';
import { UserPlus, CalendarCheck, PlusSquare, Activity, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface ActivityEvent {
  type: 'new_user' | 'booking' | 'listing';
  description: string;
  user: string;
  date: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  new_user: { icon: UserPlus, color: 'bg-green-900/50 text-green-400 border-green-800', label: 'New User' },
  booking: { icon: CalendarCheck, color: 'bg-blue-900/50 text-blue-400 border-blue-800', label: 'Booking' },
  listing: { icon: PlusSquare, color: 'bg-purple-900/50 text-purple-400 border-purple-800', label: 'Listing' },
};

export default function AdminActivityPage() {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.adminGetActivity() as ActivityEvent[];
      setActivity(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = filter ? activity.filter((e) => e.type === filter) : activity;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time platform events</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['', 'new_user', 'booking', 'listing'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === t ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            {t === '' ? 'All' : TYPE_CONFIG[t]?.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No activity yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((event, i) => {
              const cfg = TYPE_CONFIG[event.type] ?? { icon: Activity, color: 'bg-gray-800 text-gray-400 border-gray-700', label: event.type };
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-800/40 transition-colors">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">@{event.user}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

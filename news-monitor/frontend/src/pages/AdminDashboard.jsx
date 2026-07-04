import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../api/client';

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#1e40af', '#3b82f6'];

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value ?? '—'}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: userStats } = useQuery({ queryKey: ['admin-users-stats'], queryFn: () => api.get('/admin/analytics/users').then((r) => r.data) });
  const { data: searchStats } = useQuery({ queryKey: ['admin-search-stats'], queryFn: () => api.get('/admin/analytics/search').then((r) => r.data) });
  const { data: newsStats } = useQuery({ queryKey: ['admin-news-stats'], queryFn: () => api.get('/admin/analytics/news').then((r) => r.data) });
  const { data: reportStats } = useQuery({ queryKey: ['admin-report-stats'], queryFn: () => api.get('/admin/analytics/reports').then((r) => r.data) });
  const { data: systemStats } = useQuery({ queryKey: ['admin-system-stats'], queryFn: () => api.get('/admin/analytics/system').then((r) => r.data) });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Admin Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Platform-wide usage, search, and news source insights.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={userStats?.total} />
        <StatCard label="Active (7d)" value={userStats?.active} />
        <StatCard label="New (30d)" value={userStats?.newUsers} />
        <StatCard label="Reports Generated" value={reportStats?.total} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Top Searched Queries</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={searchStats?.topQueries || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="_id" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Articles by Language</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={newsStats?.byLanguage || []} dataKey="count" nameKey="_id" outerRadius={90} label>
                {(newsStats?.byLanguage || []).map((entry, idx) => (
                  <Cell key={entry._id} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Articles by Source</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={newsStats?.bySource || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Search Trend (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={searchStats?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-gray-500 text-xs">Articles Stored</p><p className="font-semibold">{systemStats?.articleCount}</p></div>
          <div><p className="text-gray-500 text-xs">Est. Storage</p><p className="font-semibold">{systemStats?.estimatedStorageMB} MB</p></div>
          <div><p className="text-gray-500 text-xs">Scheduler</p><p className="font-semibold">{systemStats?.schedulerHealth}</p></div>
        </div>
        <table className="w-full mt-4 text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Provider</th>
              <th>Enabled</th>
              <th>Priority</th>
              <th>Used Today</th>
              <th>Last Error</th>
            </tr>
          </thead>
          <tbody>
            {systemStats?.apiUsage?.map((c) => (
              <tr key={c._id} className="border-b last:border-0">
                <td className="py-2">{c.provider}</td>
                <td>{c.isEnabled ? 'Yes' : 'No'}</td>
                <td>{c.priority}</td>
                <td>{c.usedToday}</td>
                <td className="text-red-500">{c.lastError || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

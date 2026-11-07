import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Briefcase, Users, FileSearch, Target, TrendingUp, Sparkles } from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

const candidateStatusStyles = {
  pending: 'badge-yellow',
  processing: 'badge-indigo',
  completed: 'badge-green',
  failed: 'badge-red',
  invalid: 'badge-red',
};

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">
        Pending
      </span>
    );
  }

  const color =
    score >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
      score >= 80 ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
        score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
          'text-red-700 bg-red-50 border-red-200';

  return (
    <span className={`${color} border px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap`}>
      {score}%
    </span>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [jobsResponse, candidatesResponse] = await Promise.all([
          api.get('/jobs'),
          api.get('/candidates'),
        ]);

        if (!isMounted) return;
        setJobs(jobsResponse.data.jobs || []);
        setCandidates(candidatesResponse.data.candidates || []);
      } catch (error) {
        console.error('Dashboard data error:', error);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const completedCandidates = candidates.filter(
    (c) => c.processing_status === 'completed'
  );

  const averageScore = completedCandidates.length
    ? Math.round(
      completedCandidates.reduce(
        (sum, c) => sum + Number(c.overall_score || 0),
        0
      ) / completedCandidates.length
    )
    : 0;

  const dashboardStats = [
    {
      label: 'Total Job Openings',
      value: jobs.length,
      change: 'Active criteria',
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
      lightColor: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'Candidates Ingested',
      value: candidates.length,
      change: 'Total applicants',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      lightColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      label: 'CVs Screened by AI',
      value: completedCandidates.length,
      change: 'Evaluated & ranked',
      icon: FileSearch,
      color: 'from-emerald-500 to-teal-600',
      lightColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Average Match Score',
      value: `${averageScore}%`,
      change: 'Across all candidates',
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      lightColor: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  const statusColors = {
    pending: '#F59E0B',
    processing: '#6366F1',
    completed: '#10B981',
    failed: '#EF4444',
    invalid: '#9CA3AF',
  };

  const candidatesByStatus = Object.entries(
    candidates.reduce((counts, candidate) => {
      const status = candidate.processing_status || 'pending';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {})
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: statusColors[name] || '#9CA3AF',
  }));

  const applicationTrend = Object.entries(
    candidates.reduce((groups, candidate) => {
      if (!candidate.created_at) return groups;
      const date = new Date(candidate.created_at);
      const month = date.toLocaleString('en-US', { month: 'short' });
      groups[month] = (groups[month] || 0) + 1;
      return groups;
    }, {})
  ).map(([month, applications]) => ({
    month,
    applications,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero Greeting */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-5 sm:p-7 shadow-lg shadow-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/20 text-white backdrop-blur">
              System Overview
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Recruitment Intelligence Hub</h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Real-time candidate ingestion, RabbitMQ background screening pipelines, and Gemini-powered skill matching.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/cv-screening"
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-600 text-xs sm:text-sm font-bold shadow-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Upload New CVs
          </Link>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-5 flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 truncate">{s.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.lightColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{s.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line chart */}
        <div className="card p-5 lg:col-span-2 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                Monthly CV Ingestion Trends
              </h2>
              <p className="text-xs text-gray-400">
                Volume of candidate applications screened over time
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 sm:mt-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                Candidate Influx
              </span>
            </div>
          </div>

          <div className="h-[220px] sm:h-[260px] w-full min-w-0">
            {applicationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={applicationTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E5E7EB" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 8px 16px -2px rgba(0,0,0,0.08)',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366F1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No monthly candidate trend data yet
              </div>
            )}
          </div>
        </div>

        {/* Donut chart */}
        <div className="card p-5 min-w-0 flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5">Pipeline Breakdown</h2>
            <p className="text-xs text-gray-400 mb-2">Screening status distribution</p>
          </div>

          <div className="h-[170px] w-full min-w-0 flex items-center justify-center">
            {candidatesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={candidatesByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {candidatesByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-400">No candidate status data</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
            {candidatesByStatus.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }}></span>
                <span className="truncate">{s.name} <strong className="text-gray-900">({s.value})</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Recent candidates & top jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent candidates */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Recent Candidates</h2>
              <p className="text-xs text-gray-400">Latest applicants screened by AI</p>
            </div>
            <Link to="/candidates" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {[...candidates]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5)
              .map((c) => (
                <Link
                  to={`/candidate/${c.id}`}
                  key={c.id}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50/70 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {(c.full_name || 'U').split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
                        {c.full_name || 'Unknown Candidate'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{c.job_title || 'Unknown Position'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs hidden sm:inline-flex ${candidateStatusStyles[c.processing_status] || 'badge-yellow'}`}>
                      {c.processing_status}
                    </span>
                    <ScoreBadge score={c.overall_score !== null ? Number(c.overall_score) : null} />
                  </div>
                </Link>
              ))}
            {candidates.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-10">
                No candidates uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Top jobs */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Active Job Openings</h2>
              <p className="text-xs text-gray-400">Positions with the highest applicant traffic</p>
            </div>
            <Link to="/jobs" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {[...jobs]
              .map((job) => ({
                ...job,
                applicants: candidates.filter((c) => c.job_id === job.id).length,
              }))
              .sort((a, b) => b.applicants - a.applicants)
              .slice(0, 5)
              .map((j) => (
                <div key={j.id} className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{j.title}</p>
                    <p className="text-xs text-gray-500">{j.status === 'open' ? 'Active' : (j.status || 'Active')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-indigo-600">{j.applicants}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">applicants</p>
                  </div>
                </div>
              ))}
            {jobs.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-10">
                No job openings created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

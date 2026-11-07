import React, { useState, useMemo, useEffect } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { toast } from '../store/toastStore';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
  Download,
  Briefcase
} from 'lucide-react';

const statusStyle = {
  pending: 'badge-yellow',
  processing: 'badge-indigo',
  completed: 'badge-green',
  failed: 'badge-red',
  invalid: 'badge-red',
};

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap">
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
    <span className={`${color} border px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap inline-flex items-center gap-1`}>
      <Sparkles className="w-3 h-3" />
      {score}%
    </span>
  );
}

export default function Candidates() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('matchScore');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [candidatesData, setCandidatesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [error, setError] = useState('');
  const perPage = 8;

  useEffect(() => {
    let isMounted = true;

    const fetchCandidates = async (initialLoad = false) => {
      try {
        if (initialLoad) {
          setLoading(true);
        }

        const response = await api.get(
          selectedJobId ? `/candidates?jobId=${selectedJobId}` : '/candidates'
        );

        if (!isMounted) return;

        const mappedCandidates = response.data.candidates.map((c) => ({
          id: c.id,
          name: c.full_name || 'Unknown Candidate',
          email: c.email || 'No email parsed',
          role: c.job_title || 'Unassigned Position',
          location: c.location || '—',
          status: c.processing_status,
          matchScore: c.overall_score !== null ? Number(c.overall_score) : null,
          avatar: (c.full_name || 'U')
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        }));

        setCandidatesData(mappedCandidates);
        setError('');
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load candidates.');
        }
      } finally {
        if (initialLoad && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCandidates(true);
    const interval = setInterval(() => {
      fetchCandidates();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedJobId]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data.jobs || []);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      }
    };

    fetchJobs();
  }, []);

  const filtered = useMemo(() => {
    let result = candidatesData.filter((c) =>
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter ? c.status === statusFilter : true)
    );

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (sortField === 'matchScore') {
        if (valA === null) return 1;
        if (valB === null) return -1;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [candidatesData, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleDownload = async (candidateId) => {
    try {
      const response = await api.get(`/candidates/${candidateId}/resume`);
      window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download CV.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Candidate Pipeline Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time ranked applicants, score summaries, and extracted resume profiles
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs">
            Total Candidates: <strong className="text-gray-900">{filtered.length}</strong>
          </span>
          <Link
            to="/cv-screening"
            className="btn-primary text-xs !px-3.5 !py-1.5 flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Screen More
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3.5 sm:p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by candidate name, target role, or email..."
            className="input-field !pl-10"
          />
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setPage(1);
            }}
            className="select-field text-xs sm:text-sm w-full sm:w-auto"
          >
            <option value="">All Job Positions</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="select-field text-xs sm:text-sm w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="invalid">Invalid Document</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => toggleSort('matchScore')}
            className={`btn-secondary text-xs !py-2 !px-3 flex items-center justify-center gap-1.5 col-span-1 sm:col-auto ${
              sortField === 'matchScore'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 font-bold'
                : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Score ({sortDir === 'desc' ? 'High → Low' : 'Low → High'})</span>
          </button>

          <button
            onClick={() => toggleSort('name')}
            className={`btn-ghost text-xs !py-2 !px-3 flex items-center justify-center gap-1 border border-gray-200 col-span-1 sm:col-auto ${
              sortField === 'name' ? 'text-indigo-600 bg-indigo-50/50 border-indigo-200 font-bold' : ''
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Name</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-gray-500 animate-pulse">
          <p className="text-sm font-semibold">Loading candidates pipeline...</p>
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-red-600 max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Candidates List / Table */}
      {!loading && !error && (
        <div className="card overflow-hidden">
          {/* Mobile View: Cards (< md: 768px) */}
          <div className="md:hidden divide-y divide-gray-100">
            {paginated.map((c) => (
              <div key={c.id} className="p-4 space-y-3 hover:bg-gray-50/60 transition">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/candidate/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                      {c.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate hover:text-indigo-600 transition">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{c.email}</p>
                    </div>
                  </Link>
                  <ScoreBadge score={c.matchScore} />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{c.role}</span>
                  </span>
                  <span className={`badge text-[11px] ${statusStyle[c.status] || 'badge-yellow'}`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleDownload(c.id)}
                    className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5 flex-1 justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CV
                  </button>
                  <Link
                    to={`/candidate/${c.id}`}
                    className="btn-primary text-xs !py-1.5 !px-3 flex items-center gap-1 flex-1 justify-center"
                  >
                    View Analysis
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md: 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Target Position</th>
                  <th className="px-5 py-3.5">Processing Status</th>
                  <th className="px-5 py-3.5 text-center">AI Match Score</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition group">
                    <td className="px-5 py-3.5">
                      <Link to={`/candidate/${c.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">
                      <span className="truncate max-w-[220px] block">{c.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge text-xs ${statusStyle[c.status] || 'badge-yellow'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <ScoreBadge score={c.matchScore} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(c.id)}
                          className="btn-secondary text-xs !px-3 !py-1.5 inline-flex items-center gap-1.5"
                          title="Download original CV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CV
                        </button>
                        <Link
                          to={`/candidate/${c.id}`}
                          className="btn-ghost text-xs !px-3 !py-1.5 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 inline-flex items-center"
                        >
                          Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-medium text-gray-600">No candidates found matching your criteria.</p>
              <p className="text-xs text-gray-400 mt-1">Try resetting filters or uploading new resumes.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm text-gray-500 bg-gray-50/50">
              <span>
                Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-ghost !p-2 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-ghost !p-2 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

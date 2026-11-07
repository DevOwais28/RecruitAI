import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, CheckCircle2,
  XCircle, AlertTriangle, Download, Sparkles, Trash2,
  Briefcase, GraduationCap, ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from '../store/toastStore';

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    const fetchCandidate = async (initial = false) => {
      try {
        const response = await api.get('/candidates');

        if (!isMounted) return;

        const c = response.data.candidates?.find(
          (item) => item.id === id
        );

        if (!c) {
          setCandidate(null);
          return;
        }

        const isStillProcessing =
          c.processing_status === 'pending' ||
          c.processing_status === 'processing';

        setCandidate({
          id: c.id,
          name: c.full_name || 'Unknown Candidate',
          email: c.email || 'No email extracted',
          phone: c.phone || 'No phone extracted',
          role: c.job_title || 'Unassigned Role',
          location: c.location || 'Not specified',
          status: c.processing_status,
          appliedDate: new Date(c.created_at).toLocaleDateString(),
          matchScore: c.overall_score !== null
            ? Number(c.overall_score)
            : null,
          avatar: (c.full_name || 'U')
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          mandatoryMatched: c.matched_mandatory_skills || [],
          missingMandatory: c.missing_mandatory_skills || [],
          preferredMatched: c.matched_preferred_skills || [],
          explanation: c.explanation,
          recommendation: c.recommendation,
          skills: c.skills || [],
          education: c.education,
          experienceYears: c.experience_years,
        });

        // If completed or failed, stop polling
        if (!isStillProcessing && pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      } catch {
        if (isMounted) setError('Failed to load candidate details.');
      } finally {
        if (initial && isMounted) setLoading(false);
      }
    };

    fetchCandidate(true);

    pollInterval = setInterval(() => {
      fetchCandidate(false);
    }, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="card p-12 text-center text-gray-500 animate-pulse max-w-xl mx-auto">
        <p className="font-semibold text-sm">Loading candidate evaluation profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center text-red-600 max-w-lg mx-auto">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <p className="text-gray-500 mb-4 font-medium">Candidate not found</p>
        <Link to="/candidates" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Candidates Directory
        </Link>
      </div>
    );
  }

  const scoreColor =
    candidate.matchScore === null
      ? 'text-gray-500 bg-gray-100 border-gray-200'
      : candidate.matchScore >= 90
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : candidate.matchScore >= 80
          ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
          : candidate.matchScore >= 60
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-red-700 bg-red-50 border-red-200';

  const recommendationLabel =
    candidate.status === 'invalid'
      ? 'INVALID DOCUMENT'
      : candidate.recommendation
        ? candidate.recommendation.replaceAll('_', ' ').toUpperCase()
        : 'AWAITING AI EVALUATION';

  const recommendationColor =
    candidate.recommendation === 'recommended'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : candidate.recommendation === 'consider'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : candidate.recommendation === 'not_recommended'
          ? 'bg-red-50 text-red-800 border-red-200'
          : 'bg-gray-50 text-gray-600 border-gray-200';

  const handleDelete = async () => {
    if (!window.confirm(
      `Are you sure you want to delete ${candidate.name}? This will remove the parsed candidate record.`
    )) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');
      await api.delete(`/candidates/${id}`);
      navigate('/candidates');
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || 'Failed to delete candidate.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/candidates/${id}/resume`);
      window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download CV.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar: Back & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/candidates"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-indigo-600 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Candidates Directory
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownload}
            className="btn-secondary text-xs !px-3.5 !py-2 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Download CV
          </button>
          <button
            onClick={() => toast.success(`Interview invitation prepared for ${candidate.name} (${candidate.email})`)}
            className="btn-primary text-xs !px-3.5 !py-2 flex items-center gap-1.5 shadow-xs"
          >
            Schedule Interview
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition disabled:opacity-50"
            title="Delete Candidate"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
          {deleteError}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-extrabold shadow-md shadow-indigo-100 flex-shrink-0">
              {candidate.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {candidate.name}
                </h1>
                <span className="badge-indigo text-[11px] font-semibold">{candidate.status}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mt-0.5">{candidate.role}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{candidate.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{candidate.phone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>Applied {candidate.appliedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* AI Score Badge Box */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3.5 sm:p-4 rounded-xl border bg-gray-50/70 sm:min-w-[140px] text-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Match Score
            </span>
            <div className={`text-2xl sm:text-3xl font-extrabold px-3 py-1 rounded-xl border ${scoreColor}`}>
              {candidate.status === 'invalid'
                ? 'Invalid'
                : candidate.matchScore === null
                  ? 'Pending'
                  : `${candidate.matchScore}%`}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 sm:gap-6 mt-6 border-t border-gray-100 pt-3 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'analysis'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            AI Screening Analysis & Logic
          </button>
          <button
            onClick={() => setActiveTab('cv')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'cv'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Extracted Qualifications & CV Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {candidate.status === 'invalid' ? (
        <div className="card p-8 sm:p-10 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Document Ineligible / Not a CV
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            This uploaded file was analyzed by the parser and determined not to be a legitimate resume or CV.
            AI scoring was skipped to prevent skewing recruitment rankings.
          </p>
        </div>
      ) : activeTab === 'analysis' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mandatory Skills */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Mandatory Requirements
            </h2>

            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Matched Mandatory Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.mandatoryMatched?.length > 0 ? (
                  candidate.mandatoryMatched.map((s, i) => (
                    <span key={i} className="badge-green text-xs flex items-center gap-1 py-1 px-2.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No mandatory requirements matched</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Missing Mandatory Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.missingMandatory?.length > 0 ? (
                  candidate.missingMandatory.map((s, i) => (
                    <span key={i} className="badge-red text-xs flex items-center gap-1 py-1 px-2.5">
                      <XCircle className="w-3 h-3 text-red-600" /> {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All mandatory requirements fulfilled!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" /> Preferred & Bonus Skills
            </h2>

            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Bonus Technologies Found
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.preferredMatched?.length > 0 ? (
                  candidate.preferredMatched.map((s, i) => (
                    <span key={i} className="badge-indigo text-xs flex items-center gap-1 py-1 px-2.5">
                      <CheckCircle2 className="w-3 h-3 text-indigo-600" /> {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No preferred bonus skills detected</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
              <p>
                Bonus skills grant positive weighting to the candidate's overall score without disqualifying them if omitted.
              </p>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI Evaluation Breakdown
            </h2>
            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {candidate.explanation || 'AI analysis is currently executing in background worker...'}
              </p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              AI Hiring Recommendation
            </h2>

            <div>
              <span className={`inline-flex px-3 py-1.5 rounded-xl border text-xs font-extrabold ${recommendationColor}`}>
                {recommendationLabel}
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {candidate.recommendation === 'recommended' &&
                'Candidate matches all critical requirements and holds strong qualifying experience. Strongly recommended for interview.'}
              {candidate.recommendation === 'consider' &&
                'Candidate satisfies the minimum threshold (≥50%) but has gaps in some preferred areas. Recruiter manual review suggested.'}
              {candidate.recommendation === 'not_recommended' &&
                'Candidate scored below the consideration threshold (<50%) or missed critical mandatory competencies.'}
              {!candidate.recommendation && 'Awaiting AI pipeline evaluation.'}
            </p>
          </div>
        </div>
      ) : (
        /* CV Preview Tab */
        <div className="card p-5 sm:p-8 bg-gray-50 border border-gray-200/80">
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 text-gray-800 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{candidate.name}</h2>
              <p className="text-indigo-600 font-bold text-sm mt-0.5">{candidate.role}</p>
              <p className="text-xs text-gray-400 mt-1">
                {candidate.email} · {candidate.phone} · {candidate.location}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2.5">
                Extracted Technical Competencies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills?.length > 0 ? (
                  candidate.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="badge bg-slate-100 text-slate-800 text-xs px-2.5 py-1 border border-slate-200/60"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No skills extracted.</p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                Education & Experience
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5 font-medium">Education</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                    {candidate.education || 'Not extracted'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5 font-medium">Experience</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    {candidate.experienceYears != null
                      ? `${candidate.experienceYears} years`
                      : 'Not extracted'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, X, Briefcase, Edit2, Trash2, GraduationCap } from 'lucide-react';
import api from '../api/client';
import { createPortal } from 'react-dom';
import { toast } from '../store/toastStore';

const statusStyle = {
  Active: 'badge-green',
  Paused: 'badge-yellow',
  Closed: 'badge-red'
};

export default function Jobs() {
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    minExperience: 0,
    educationRequired: '',
    mandatorySkills: ['React', 'TypeScript'],
    preferredSkills: ['Next.js'],
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');

        const jobs = response.data.jobs.map((job) => ({
          ...job,
          mandatorySkills: job.mandatory_skills || [],
          preferredSkills: job.preferred_skills || [],
          status: job.status === 'open' ? 'Active' : (job.status || 'Active'),
          department: job.department || 'Engineering',
          location: job.location || 'Remote',
          applicants: 0,
          posted: new Date(job.created_at).toLocaleDateString(),
        }));

        setJobsList(jobs);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const departments = [...new Set(jobsList.map((j) => j.department).filter(Boolean))];
  const filtered = jobsList.filter((j) => {
    return (
      j.title.toLowerCase().includes(search.toLowerCase()) &&
      (filterDept ? j.department === filterDept : true) &&
      (filterStatus ? j.status === filterStatus : true)
    );
  });

  const addSkill = (type) => setNewJob((p) => ({ ...p, [type]: [...p[type], ''] }));
  
  const handleEdit = (job) => {
    setEditingJobId(job.id);
    setNewJob({
      title: job.title || '',
      description: job.description || '',
      minExperience: job.min_experience ?? 0,
      educationRequired: job.education_required || '',
      mandatorySkills: job.mandatory_skills?.length ? job.mandatory_skills : [''],
      preferredSkills: job.preferred_skills?.length ? job.preferred_skills : [''],
    });
    setShowForm(true);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job opening? Associated candidate screenings will remain in the database.')) {
      return;
    }

    try {
      await api.delete(`/jobs/${jobId}`);
      setJobsList((prev) => prev.filter((job) => job.id !== jobId));
      toast.success('Job opening deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const updateSkill = (type, i, v) => {
    const arr = [...newJob[type]];
    arr[i] = v;
    setNewJob((p) => ({ ...p, [type]: arr }));
  };

  const removeSkill = (type, i) =>
    setNewJob((p) => ({ ...p, [type]: p[type].filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: newJob.title.trim(),
        description: newJob.description,
        minExperience: Number(newJob.minExperience),
        educationRequired: newJob.educationRequired || null,
        mandatorySkills: newJob.mandatorySkills.map((s) => s.trim()).filter(Boolean),
        preferredSkills: newJob.preferredSkills.map((s) => s.trim()).filter(Boolean),
      };

      setSaving(true);

      const response = editingJobId
        ? await api.put(`/jobs/${editingJobId}`, payload)
        : await api.post('/jobs', payload);

      const job = response.data.job;

      const created = {
        ...job,
        mandatorySkills: job.mandatory_skills || [],
        preferredSkills: job.preferred_skills || [],
        status: job.status === 'open' ? 'Active' : (job.status || 'Active'),
        department: 'Engineering',
        location: 'Remote',
        applicants: 0,
        posted: 'Just now',
      };

      setJobsList((prev) =>
        editingJobId
          ? prev.map((item) => (item.id === job.id ? created : item))
          : [created, ...prev]
      );
      toast.success(editingJobId ? 'Job opening updated successfully' : 'Job opening created successfully');
      setShowForm(false);
      setEditingJobId(null);
      setNewJob({
        title: '',
        description: '',
        minExperience: 0,
        educationRequired: '',
        mandatorySkills: [''],
        preferredSkills: [''],
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-14 w-full bg-gray-200/70 rounded-2xl"></div>
        <div className="h-12 w-full bg-gray-200/60 rounded-xl"></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="card p-5 h-56 bg-gray-100/70"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center text-red-600 max-w-lg mx-auto">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Job Openings & AI Criteria
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Define mandatory vs preferred skills, education requirements, and minimum experience for automated AI scoring.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingJobId(null);
            setNewJob({
              title: '',
              description: '',
              minExperience: 0,
              educationRequired: '',
              mandatorySkills: ['JavaScript', 'Node.js'],
              preferredSkills: ['Docker'],
            });
            setShowForm(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Opening
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-3.5 sm:p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role title, technologies, or keywords..."
            className="input-field !pl-10"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2.5">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="select-field w-full sm:w-auto"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-field w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Job list */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="card p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {job.title}
                </h3>
                <span className={`badge text-xs flex-shrink-0 ${statusStyle[job.status] || 'badge-green'}`}>
                  {job.status}
                </span>
              </div>

              {job.description && (
                <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
                  {job.description}
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-4 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Min {job.min_experience ?? 0} yrs experience
                </span>
                {job.education_required && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                    {job.education_required}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Mandatory Skills (Must)
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600">
                    {job.mandatorySkills?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {job.mandatorySkills?.length > 0 ? (
                    job.mandatorySkills.map((s, i) => (
                      <span key={i} className="badge-indigo text-[11px] py-0.5 px-2">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">None specified</span>
                  )}
                </div>
              </div>

              {job.preferredSkills?.length > 0 && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Preferred (Bonus)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {job.preferredSkills.map((s, i) => (
                      <span key={i} className="badge bg-slate-100 text-slate-700 text-[11px] py-0.5 px-2 border border-slate-200/60">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/80">
                <button
                  onClick={() => handleEdit(job)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 sm:p-12 text-center max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 mb-1">
            {jobsList.length === 0 ? 'No job openings yet' : 'No matching jobs found'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {jobsList.length === 0
              ? 'Create your first job specification to start screening resumes with AI.'
              : 'Try clearing your search terms or filters.'}
          </p>
          {jobsList.length > 0 && (
            <button
              onClick={() => {
                setSearch('');
                setFilterDept('');
                setFilterStatus('');
              }}
              className="btn-ghost text-xs border border-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Job Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-3 sm:p-4">
          <div className="card w-full max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingJobId ? 'Edit Job Opening' : 'Create Job Opening'}
                </h2>
                <p className="text-xs text-gray-400">Configure AI evaluation criteria and mandatory skill gates</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingJobId(null);
                }}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Job Position Title *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Full-Stack Developer (Node & React)"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Role Description & Expectations
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Briefly describe key responsibilities and expectations..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="input-field"
                    value={newJob.minExperience}
                    onChange={(e) => setNewJob({ ...newJob, minExperience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Education Required
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. Bachelor's in CS or equivalent"
                    value={newJob.educationRequired}
                    onChange={(e) => setNewJob({ ...newJob, educationRequired: e.target.value })}
                  />
                </div>
              </div>

              {/* Mandatory Skills */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Mandatory Skills
                    </label>
                    <span className="text-[11px] text-gray-500">Candidate MUST have these to score high</span>
                  </div>
                  <span className="badge-indigo text-[11px]">
                    {newJob.mandatorySkills.filter(Boolean).length} Required
                  </span>
                </div>
                <div className="space-y-2">
                  {newJob.mandatorySkills.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input-field !py-2 text-xs sm:text-sm"
                        placeholder={`Mandatory skill #${i + 1} (e.g. TypeScript)`}
                        value={s}
                        onChange={(e) => updateSkill('mandatorySkills', i, e.target.value)}
                      />
                      {newJob.mandatorySkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkill('mandatorySkills', i)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSkill('mandatorySkills')}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  + Add another mandatory skill
                </button>
              </div>

              {/* Preferred Skills */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Preferred / Bonus Technologies
                    </label>
                    <span className="text-[11px] text-gray-500">Gives candidate bonus weighting</span>
                  </div>
                  <span className="badge bg-slate-100 text-slate-700 text-[11px]">
                    {newJob.preferredSkills.filter(Boolean).length} Preferred
                  </span>
                </div>
                <div className="space-y-2">
                  {newJob.preferredSkills.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input-field !py-2 text-xs sm:text-sm"
                        placeholder={`Bonus technology #${i + 1} (e.g. Redis, RabbitMQ)`}
                        value={s}
                        onChange={(e) => updateSkill('preferredSkills', i, e.target.value)}
                      />
                      {newJob.preferredSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkill('preferredSkills', i)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSkill('preferredSkills')}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  + Add another preferred skill
                </button>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingJobId(null);
                  }}
                  className="btn-ghost text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs sm:text-sm"
                >
                  {saving
                    ? 'Saving Criteria...'
                    : editingJobId
                      ? 'Update Job Criteria'
                      : 'Publish Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

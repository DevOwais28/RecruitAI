import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  Upload, FileText, X, CheckCircle2, Loader2,
  Sparkles, ArrowRight, AlertCircle, RefreshCw, Layers
} from 'lucide-react';

export default function CVScreening() {
  const [selectedJob, setSelectedJob] = useState('');
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data.jobs || []);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      }
    };

    fetchJobs();
  }, []);

  // Poll candidate status automatically every 3s
  useEffect(() => {
    const hasPending = files.some(
      (f) => f.status === 'submitted' || f.status === 'processing'
    );

    if (!hasPending || !selectedJob) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/candidates?jobId=${selectedJob}`);
        const candidates = response.data.candidates || [];

        setFiles((prev) =>
          prev.map((fileItem) => {
            if (!fileItem.candidateId) return fileItem;

            const matchedCandidate = candidates.find(
              (c) => c.id === fileItem.candidateId
            );

            if (!matchedCandidate) return fileItem;

            if (matchedCandidate.processing_status === 'completed') {
              return {
                ...fileItem,
                status: 'completed',
                score:
                  matchedCandidate.overall_score !== null
                    ? Number(matchedCandidate.overall_score)
                    : null,
              };
            }

            if (matchedCandidate.processing_status === 'invalid') {
              return { ...fileItem, status: 'invalid' };
            }

            if (matchedCandidate.processing_status === 'failed') {
              return {
                ...fileItem,
                status: 'failed',
                error: 'AI Evaluation Failed',
              };
            }

            return fileItem;
          })
        );
      } catch (err) {
        console.error('Failed to poll candidate status:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [files, selectedJob]);

  const addFiles = (newFiles) => {
    setUploadError('');
    setUploadSuccess('');

    const selectedFiles = Array.from(newFiles);

    const valid = selectedFiles.filter((f) => {
      const extension = f.name.split('.').pop().toLowerCase();
      return (
        (extension === 'pdf' || extension === 'docx') &&
        f.size <= 10 * 1024 * 1024
      );
    });

    if (valid.length < selectedFiles.length) {
      setUploadError(
        'Some files were rejected. Only PDF and DOCX files up to 10 MB are accepted.'
      );
    }

    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        status: 'queued',
        score: null,
      })),
    ]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  }, []);

  const handleProcess = async () => {
    if (!selectedJob || files.length === 0) return;

    setProcessing(true);
    setProcessedCount(0);
    setUploadError('');
    setUploadSuccess('');

    let successCount = 0;

    const filesToUpload = files.filter(
      (item) => item.status === 'queued' || item.status === 'failed'
    );

    for (const item of filesToUpload) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'uploading' } : f
        )
      );
      try {
        const formData = new FormData();
        formData.append('resume', item.file);
        formData.append('jobId', selectedJob);

        const response = await api.post('/candidates/upload', formData);

        successCount++;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                ...f,
                status: 'submitted',
                candidateId: response.data.candidate?.id,
              }
              : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                ...f,
                status: 'failed',
                error: error.response?.data?.message || 'Upload failed',
              }
              : f
          )
        );
      }

      setProcessedCount((count) => count + 1);
    }

    setProcessing(false);

    if (successCount > 0) {
      setUploadSuccess(
        `${successCount} CV(s) uploaded to Cloud Storage & submitted to RabbitMQ queue for AI processing.`
      );
    }

    if (successCount < filesToUpload.length) {
      setUploadError('Some CV uploads failed. Review their individual statuses below.');
    }
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const resetQueue = () => {
    setFiles([]);
    setProcessedCount(0);
    setUploadError('');
    setUploadSuccess('');
  };

  const isAllDone =
    files.length > 0 &&
    files.every((f) =>
      ['submitted', 'completed', 'invalid', 'failed'].includes(f.status)
    );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          CV Screening & Batch Ingestion
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Upload 10–15 resumes (PDF/DOCX) at once. The AI parses skills, matches requirements, and scores each candidate asynchronously.
        </p>
      </div>

      {/* Step 1: Target Position Selection */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <label className="text-sm font-bold text-gray-900">
            Select Target Job Opening
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-3 ml-7">
          The AI will evaluate mandatory & preferred requirements defined for this position.
        </p>
        <div className="ml-0 sm:ml-7">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="select-field w-full sm:max-w-md font-medium"
          >
            <option value="">Choose an active job opening...</option>
            {jobs
              .filter((job) => job.status === 'open' || job.status === 'Active')
              .map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Step 2: Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('cv-file-picker').click()}
        className={`card border-2 border-dashed p-6 sm:p-10 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50/60'
        }`}
      >
        <input
          id="cv-file-picker"
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <p className="text-sm sm:text-base font-bold text-gray-900 mb-1">
          Tap or drag & drop candidate CVs here
        </p>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Supports <strong className="text-gray-700">PDF</strong> and <strong className="text-gray-700">DOCX</strong> files up to 10 MB each.
          Batch uploads of 10–15 CVs recommended.
        </p>
      </div>

      {/* Step 3: Screening Queue & Status */}
      {files.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  Batch Queue ({files.length} {files.length === 1 ? 'candidate' : 'candidates'})
                </h2>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAllDone
                  ? 'All CVs ingested and processing in background workers'
                  : selectedJob
                    ? 'Ready for upload and RabbitMQ queue ingestion'
                    : '⚠️ Select a target job opening in Step 1 to proceed'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
              {!isAllDone && (
                <button
                  onClick={handleProcess}
                  disabled={!selectedJob || processing}
                  className="btn-primary text-xs sm:text-sm !py-2 !px-4 w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ingesting ({processedCount}/{files.length})...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Start AI Screening
                    </>
                  )}
                </button>
              )}
              {isAllDone && (
                <button
                  onClick={resetQueue}
                  className="btn-secondary text-xs sm:text-sm !py-2 !px-3.5 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Screen Another Batch
                </button>
              )}
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="p-3.5 bg-red-50 border-b border-red-100 text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Upload Success */}
          {uploadSuccess && (
            <div className="p-3.5 bg-emerald-50 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
              <Link
                to="/candidates"
                className="btn-primary text-xs !px-3.5 !py-1.5 self-start sm:self-auto flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                View Directory <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Files List */}
          <div className="divide-y divide-gray-100">
            {files.map((item) => (
              <div
                key={item.id}
                className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {(item.file.size / 1024).toFixed(1)} KB · {item.file.name.split('.').pop().toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'completed' ? (
                    <span className="badge-green text-xs flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Score: {item.score != null ? `${item.score}%` : 'Done'}
                    </span>
                  ) : item.status === 'invalid' ? (
                    <span className="badge-red text-xs flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Invalid Doc
                    </span>
                  ) : item.status === 'submitted' ? (
                    <span className="badge-indigo text-xs flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      AI Scoring...
                    </span>
                  ) : item.status === 'uploading' ? (
                    <span className="badge text-xs bg-indigo-100 text-indigo-700 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading...
                    </span>
                  ) : item.status === 'failed' ? (
                    <span className="badge-red text-xs">
                      Failed
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="badge text-xs bg-gray-100 text-gray-600">
                        Queued
                      </span>
                      {!processing && (
                        <button
                          onClick={() => removeFile(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

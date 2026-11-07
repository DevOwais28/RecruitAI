import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Users, FileSearch, Mail, BarChart3, Shield, ArrowRight,
  CheckCircle2, Zap, Menu, X, ArrowUpRight
} from 'lucide-react';

const features = [
  { icon: FileSearch, title: 'AI-Powered CV Screening', desc: 'Automatically analyze and rank candidates based on job requirements using advanced AI matching.' },
  { icon: Users, title: 'Smart Candidate Management', desc: 'Track, filter, and manage your entire candidate pipeline from a single intuitive dashboard.' },
  { icon: Mail, title: 'Gmail Integration', desc: 'Automatically import CVs from your Gmail inbox and process them without manual uploads.' },
  { icon: BarChart3, title: 'Analytics & Insights', desc: 'Get real-time analytics on your hiring pipeline, time-to-hire, and candidate quality metrics.' },
  { icon: Shield, title: 'Skills Gap Analysis', desc: 'Identify mandatory and preferred skill matches, missing requirements, and candidate strengths.' },
  { icon: Zap, title: 'Instant Processing', desc: 'Process hundreds of CVs in minutes with our background job queue and get results instantly.' },
];

const stats = [
  { value: '10x', label: 'Faster Screening' },
  { value: '95%', label: 'Match Accuracy' },
  { value: '500+', label: 'Companies Trust Us' },
  { value: '1M+', label: 'CVs Processed' },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Recruit<span className="text-indigo-600">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#stats" className="text-sm text-gray-600 hover:text-gray-900 transition">Why Us</a>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm !px-5 !py-2">Get Started Free</Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/login" className="text-sm text-gray-700 font-medium px-2 py-1">Sign In</Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-700 hover:text-indigo-600 py-1"
            >
              Features
            </a>
            <a
              href="#stats"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-700 hover:text-indigo-600 py-1"
            >
              Why Us
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/signup" className="btn-primary text-center">Get Started Free</Link>
              <Link to="/login" className="btn-secondary text-center">Sign In to Dashboard</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI-Powered Recruitment & CV Screening</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Hire Smarter,<br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Stop drowning in resumes. Our AI screens, scores, and ranks candidates against your specific job criteria in seconds —
            so you hire the best talent faster.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/signup" className="btn-primary text-base w-full sm:w-auto !px-8 !py-3 flex items-center justify-center gap-2 shadow-indigo-200">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base w-full sm:w-auto !px-8 !py-3 flex items-center justify-center gap-2">
              Live Demo Preview <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Gmail sync included</span>
          </div>
        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-12 sm:mt-16">
          <div className="bg-gradient-to-b from-indigo-50 to-white rounded-2xl border border-indigo-100 p-1 sm:p-2 shadow-2xl shadow-indigo-100/60">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-3 text-xs text-gray-400 font-mono hidden sm:inline">recruitai.app/dashboard</span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live System
                </span>
              </div>
              <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: 'Active Jobs', val: '24', change: '+3 this week' },
                    { label: 'Active Candidates', val: '1,847', change: '+127 new' },
                    { label: 'CVs Screened', val: '3,291', change: '89 today' },
                    { label: 'Avg Match Score', val: '87%', change: 'High confidence' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                      <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.val}</p>
                      <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">{s.change}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-left">
                  <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-semibold text-gray-800">Top Matched Applicants</p>
                      <span className="text-[11px] text-indigo-600 font-medium">Ranked by AI</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Sarah Chen', role: 'Senior Frontend Engineer', score: '94%', tag: 'Strong Match' },
                        { name: 'Emily Zhang', role: 'Backend Engineer', score: '92%', tag: 'All Skills Matched' },
                        { name: 'Maria Garcia', role: 'Product Designer', score: '91%', tag: 'Portfolio Verified' },
                      ].map((cand, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 text-xs">
                          <div>
                            <span className="font-semibold text-gray-900">{cand.name}</span>
                            <span className="text-gray-400 ml-2 hidden sm:inline">{cand.role}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="badge-indigo text-[10px] hidden sm:inline">{cand.tag}</span>
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{cand.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 mb-2">Screening Queue</p>
                      <div className="space-y-1.5 text-xs text-gray-500">
                        <div className="flex justify-between"><span>Batch #419</span><span className="text-emerald-600">Completed</span></div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full w-full"></div></div>
                        <div className="flex justify-between pt-2"><span>Gmail Import</span><span className="text-indigo-600">Active</span></div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full w-3/4 animate-pulse"></div></div>
                      </div>
                    </div>
                    <Link to="/dashboard" className="mt-4 text-center btn-primary text-xs !py-2">
                      Explore Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-14 sm:py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-indigo-200 text-xs sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Everything you need to hire top talent</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Powerful features engineered for modern recruitment teams who value speed, accuracy, and fairness.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f, i) => (
              <div key={i} className="card p-6 group hover:border-indigo-200">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <f.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Ready to transform your hiring workflow?
          </h2>
          <p className="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8">
            Get started in 60 seconds with our intuitive platform. No setup fees, no complex integrations.
          </p>
          <Link to="/signup" className="btn-primary text-base !px-8 sm:!px-10 !py-3 sm:!py-3.5 inline-flex items-center gap-2">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Recruit<span className="text-indigo-400">AI</span></span>
          </div>
          <p className="text-xs sm:text-sm">&copy; 2024 RecruitAI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

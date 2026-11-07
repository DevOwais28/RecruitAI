import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut, Menu, X, LayoutDashboard,
  Briefcase, Users, FileSearch, Mail, Settings, Sparkles, ChevronDown
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const mobileNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/cv-screening', label: 'CV Screening', icon: FileSearch },
  { to: '/gmail', label: 'Gmail Sync', icon: Mail },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs Management',
  '/candidates': 'Candidates Directory',
  '/cv-screening': 'CV Screening & Ingestion',
  '/gmail': 'Gmail Integration',
  '/settings': 'System Settings',
};

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const userName = user?.name || 'Recruiter';
  const userEmail = user?.email || 'recruiter@company.com';
  const userRole = user?.role || 'Hiring Lead';

  const userInitials = userName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const title = location.pathname.startsWith('/candidate/')
    ? 'Candidate Evaluation'
    : (pageTitles[location.pathname] || 'RecruitAI');

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur border-b border-gray-200/80 flex items-center justify-between px-3.5 sm:px-6 sticky top-0 z-30">
        {/* Left side: hamburger on mobile, breadcrumb/title on desktop */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 text-gray-700 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <Link to="/dashboard" className="md:hidden flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-extrabold text-gray-900 tracking-tight">
              Recruit<span className="text-indigo-600">AI</span>
            </span>
          </Link>

          {/* Desktop Page Title */}
          <div className="hidden md:flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
            <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Engine Online
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/cv-screening"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/60 transition shadow-xs"
          >
            <FileSearch className="w-3.5 h-3.5" />
            Screen CVs
          </Link>

          <div className="w-px h-6 bg-gray-200 mx-0.5 hidden sm:block"></div>

          {/* User profile with dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdown(!profileDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100/80 transition"
              aria-label="User profile options"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-indigo-50">
                {userInitials}
              </div>
              <div className="hidden lg:block text-left max-w-[130px]">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">{userName}</p>
                <p className="text-[11px] text-gray-500 truncate leading-tight">{userRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{userName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" /> Account Settings
                    </Link>
                    <Link
                      to="/gmail"
                      onClick={() => setProfileDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition"
                    >
                      <Mail className="w-4 h-4 text-gray-400" /> Gmail Integration
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={() => { setProfileDropdown(false); handleSignOut(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-950 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white tracking-tight">
                  Recruit<span className="text-indigo-400">AI</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User card in mobile drawer */}
            <div className="p-4 mx-3 mt-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
              {mobileNavItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition
                      ${active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800/80">
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

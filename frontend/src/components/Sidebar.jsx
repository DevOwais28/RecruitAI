import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, FileSearch, Mail, Settings,
  Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/jobs',      label: 'Jobs',           icon: Briefcase },
  { to: '/candidates',label: 'Candidates',     icon: Users },
  { to: '/cv-screening', label: 'CV Screening',icon: FileSearch },
  { to: '/gmail',     label: 'Gmail Sync',     icon: Mail },
  { to: '/settings',  label: 'Settings',       icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} hidden md:flex flex-col bg-slate-950 text-white transition-all duration-300 ease-in-out border-r border-slate-800/80 z-20 select-none`}>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-slate-800/80 ${collapsed ? 'justify-center px-0' : 'px-5'}`}>
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white leading-none">
                Recruit<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                Recruitment OS
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group
                ${active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }
                ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Collapse toggle */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-10 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors gap-2 text-xs font-medium"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

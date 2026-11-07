import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { LayoutDashboard, Briefcase, Users, FileSearch, Mail } from 'lucide-react';

const mobileBottomNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/cv-screening', label: 'Screen CVs', icon: FileSearch },
  { to: '/gmail', label: 'Gmail', icon: Mail },
];

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50/80 overflow-hidden font-sans">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Quick Navigation Bar (Bottom Dock) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1.5 flex items-center justify-around z-30 shadow-lg">
          {mobileBottomNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                  active
                    ? 'text-indigo-600 font-bold'
                    : 'text-gray-400 hover:text-gray-700 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg transition-transform ${active ? 'bg-indigo-50 scale-110' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

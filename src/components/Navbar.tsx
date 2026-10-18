import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Film,
  Building,
  ChevronDown,
  User,
  LogOut,
  Shield,
  Plus,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onOpenProfile: () => void;
  onOpenNewWorkspace: () => void;
  onOpenPlatformAdmin?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({
  onOpenProfile,
  onOpenNewWorkspace,
  onOpenPlatformAdmin,
  activeTab,
  setActiveTab,
}) => {
  const { currentBusiness, userMemberships, currentRole, switchBusiness, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const roleBadgeColor = {
    owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    finance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    staff: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const roleLabel = {
    owner: 'Owner',
    admin: 'Admin',
    finance: 'Finance / Akuntan',
    staff: 'Staff Produksi',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand & Business Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            onClick={() => setActiveTab('invoices')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 p-[1px] shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Film className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black tracking-tight text-white flex items-center">
                Cine<span className="text-sky-400">Invoice</span>
              </span>
            </div>
          </div>

          {/* Business Switcher Dropdown */}
          {currentBusiness && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-left transition"
              >
                <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Building className="w-3 h-3" />
                </div>
                <div className="max-w-[120px] sm:max-w-[180px] truncate">
                  <div className="text-xs font-bold text-white truncate">{currentBusiness.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="capitalize">{currentBusiness.type}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-medium">
                      {currentRole ? roleLabel[currentRole] : 'Member'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Ganti Workspace Bisnis
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {userMemberships.map((mem) => {
                      const isActive = mem.businessId === currentBusiness.id;
                      return (
                        <button
                          key={mem.businessId}
                          onClick={() => {
                            setDropdownOpen(false);
                            if (!isActive) switchBusiness(mem.businessId);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition ${
                            isActive
                              ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate">{mem.businessId === currentBusiness.id ? currentBusiness.name : `Workspace #${mem.businessId.slice(-5)}`}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{mem.role}</div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewWorkspace();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-sky-400 hover:bg-slate-800 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Bisnis / UMKM Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center / Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 p-1 rounded-2xl">
          {[
            { id: 'invoices', label: 'Invoices' },
            { id: 'clients', label: 'Klien' },
            { id: 'services', label: 'Katalog Jasa' },
            { id: 'reports', label: 'Laporan Finansial' },
            { id: 'team', label: 'Tim' },
            { id: 'settings', label: 'Pengaturan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton variant="compact" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-200 max-w-[100px] truncate">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  {currentRole && (
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        roleBadgeColor[currentRole] || ''
                      }`}
                    >
                      {roleLabel[currentRole]}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Profil & Akun</span>
                  </button>

                  {onOpenPlatformAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPlatformAdmin();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Shield className="w-3.5 h-3.5 text-sky-400" />
                      <span>SaaS Platform Admin</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

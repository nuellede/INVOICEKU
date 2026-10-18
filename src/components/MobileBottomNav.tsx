import React from 'react';
import { FileText, Users, Film, BarChart3, Settings } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Klien', icon: Users },
    { id: 'services', label: 'Jasa', icon: Film },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Bisnis', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? 'bg-sky-500/15 text-sky-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

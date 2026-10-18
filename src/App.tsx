import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { ClientManager } from './components/ClientManager';
import { ServiceCatalogManager } from './components/ServiceCatalogManager';
import { FinancialReports } from './components/FinancialReports';
import { TeamManager } from './components/TeamManager';
import { BusinessSettings } from './components/BusinessSettings';
import { UserProfileModal } from './components/UserProfileModal';
import { PlatformAdminModal } from './components/PlatformAdminModal';
import { SharedInvoiceView } from './components/SharedInvoiceView';
import { Invoice, Client, Business } from './types';
import { Film } from 'lucide-react';

function MainApp() {
  const { user, currentBusiness, currentRole, loading, isOnboardingNeeded, reloadCurrentBusiness } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('invoices');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // Sub-views & Modals
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Invoice | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [platformAdminOpen, setPlatformAdminOpen] = useState(false);
  const [forceNewWorkspaceWizard, setForceNewWorkspaceWizard] = useState(false);

  // Check URL query parameters for public share token: ?token=xyz
  const [sharedToken, setSharedToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token');
    }
    return null;
  });

  // Handle shared token view
  if (sharedToken) {
    return (
      <SharedInvoiceView
        token={sharedToken}
        onExit={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setSharedToken(null);
        }}
      />
    );
  }

  // Loading Splash Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1px] shadow-2xl shadow-indigo-500/20 animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[23px] flex items-center justify-center">
            <Film className="w-8 h-8 text-sky-400" />
          </div>
        </div>
        <h2 className="text-lg font-black text-white mt-4 tracking-tight flex items-center gap-1.5">
          Cine<span className="text-sky-400">Invoice</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Menyiapkan workspace SaaS video production...</p>
      </div>
    );
  }

  // Not Authenticated -> Public Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode);
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authInitialMode}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Authenticated but No Workspace -> Onboarding Wizard
  if (isOnboardingNeeded || forceNewWorkspaceWizard) {
    return (
      <>
        <OnboardingWizard />
        <OfflineIndicator />
      </>
    );
  }

  // Missing Business Workspace Fallback
  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">Tidak Ada Bisnis Aktif</h2>
          <p className="text-xs text-slate-400">
            Anda belum terdaftar dalam bisnis video manapun. Buat workspace baru sekarang.
          </p>
          <button
            onClick={() => setForceNewWorkspaceWizard(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
          >
            Mulai Wizard Bisnis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-20 md:pb-6">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setShowCreateInvoice(false);
          setEditingInvoice(null);
          setActiveTab(tab);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenNewWorkspace={() => setForceNewWorkspaceWizard(true)}
        onOpenPlatformAdmin={() => setPlatformAdminOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1">
        {/* Create / Edit Invoice View */}
        {showCreateInvoice || editingInvoice ? (
          <InvoiceForm
            business={currentBusiness}
            userId={user.uid}
            existingInvoice={editingInvoice}
            onCancel={() => {
              setShowCreateInvoice(false);
              setEditingInvoice(null);
            }}
            onSaveSuccess={(inv) => {
              setShowCreateInvoice(false);
              setEditingInvoice(null);
              setSelectedInvoiceForDetail(inv);
            }}
          />
        ) : (
          <>
            {activeTab === 'invoices' && (
              <InvoiceList
                business={currentBusiness}
                onOpenCreate={() => setShowCreateInvoice(true)}
                onOpenDetail={(inv) => setSelectedInvoiceForDetail(inv)}
                onEditInvoice={(inv) => setEditingInvoice(inv)}
              />
            )}

            {activeTab === 'clients' && (
              <ClientManager
                businessId={currentBusiness.id}
                onSelectClientForInvoice={(client: Client) => {
                  setShowCreateInvoice(true);
                }}
              />
            )}

            {activeTab === 'services' && (
              <ServiceCatalogManager businessId={currentBusiness.id} />
            )}

            {activeTab === 'reports' && (
              <FinancialReports business={currentBusiness} />
            )}

            {activeTab === 'team' && (
              <TeamManager
                business={currentBusiness}
                currentUserId={user.uid}
                currentUserRole={currentRole}
              />
            )}

            {activeTab === 'settings' && (
              <BusinessSettings
                business={currentBusiness}
                onBusinessUpdated={() => reloadCurrentBusiness()}
              />
            )}
          </>
        )}
      </main>

      {/* Invoice Detail Modal */}
      {selectedInvoiceForDetail && (
        <InvoiceDetailModal
          invoice={selectedInvoiceForDetail}
          business={currentBusiness}
          userId={user.uid}
          onClose={() => setSelectedInvoiceForDetail(null)}
          onInvoiceUpdated={(updated) => {
            setSelectedInvoiceForDetail(updated);
          }}
          onEditInvoice={() => {
            const inv = selectedInvoiceForDetail;
            setSelectedInvoiceForDetail(null);
            setEditingInvoice(inv);
          }}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Platform Admin Modal */}
      <PlatformAdminModal
        isOpen={platformAdminOpen}
        onClose={() => setPlatformAdminOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setShowCreateInvoice(false);
          setEditingInvoice(null);
          setActiveTab(tab);
        }}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

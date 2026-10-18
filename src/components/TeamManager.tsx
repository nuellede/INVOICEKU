import React, { useState, useEffect } from 'react';
import { Business, Member, MemberRole, Invitation } from '../types';
import {
  getBusinessMembers,
  createInvitation,
  updateMemberRole,
  removeMember,
  revokeInvitation,
} from '../services/db';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Check,
  X,
  AlertCircle,
  Clock,
  Crown,
} from 'lucide-react';

interface Props {
  business: Business;
  currentUserId: string;
  currentUserRole: MemberRole | null;
}

export const TeamManager: React.FC<Props> = ({
  business,
  currentUserId,
  currentUserRole,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('staff');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUserRole === 'owner';
  const canManageTeam = isOwner || currentUserRole === 'admin';

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getBusinessMembers(business.id);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [business.id]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError('Email anggota tim wajib diisi.');
      return;
    }
    setError(null);
    setInviteSuccess(null);
    setSubmittingInvite(true);

    try {
      await createInvitation(
        business.id,
        business.name,
        inviteEmail.trim(),
        inviteRole,
        { uid: currentUserId, email: business.ownerEmail }
      );

      setInviteSuccess(
        `Undangan berhasil dibuat untuk ${inviteEmail}. Saat user login dengan email tersebut, akses akan otomatis terhubung.`
      );
      setInviteEmail('');
      setInviteRole('staff');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim undangan tim.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!isOwner) {
      alert('Hanya Owner yang memiliki izin mengubah hak akses peran tim.');
      return;
    }
    try {
      await updateMemberRole(business.id, memberId, newRole);
      await fetchMembers();
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah hak akses.');
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!isOwner) {
      alert('Hanya Owner yang dapat mengeluarkan anggota.');
      return;
    }

    // Protection: Prevent removal of the last owner
    if (member.role === 'owner') {
      const ownerCount = members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        alert('Tidak dapat menghapus Owner terakhir dalam bisnis ini.');
        return;
      }
    }

    if (confirm(`Keluarkan ${member.name} (${member.email}) dari workspace ini?`)) {
      try {
        await removeMember(business.id, member.userId);
        await fetchMembers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const roleBadge = {
    owner: { label: 'Owner (Pemilik)', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    admin: { label: 'Admin Studio', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    finance: { label: 'Finance / Akuntan', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    staff: { label: 'Staff Produksi', bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Anggota Tim & Hak Akses Bisnis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola kolaborasi tim produksi video untuk workspace <strong className="text-white">{business.name}</strong>.
          </p>
        </div>

        {canManageTeam && (
          <button
            onClick={() => {
              setInviteSuccess(null);
              setError(null);
              setInviteModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Undang Anggota Tim</span>
          </button>
        )}
      </div>

      {/* Permissions Guide Info Box */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-white flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-sky-400" /> Matriks Peran & Hak Akses (RBAC)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <strong className="text-amber-400 block mb-0.5">Owner</strong>
            Akses total seluruh modul, manajemen tim, pengaturan pajak, dan laporan laba.
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <strong className="text-indigo-400 block mb-0.5">Admin</strong>
            Kelola invoice, klien, katalog jasa, dan operasional harian produksi.
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <strong className="text-emerald-400 block mb-0.5">Finance</strong>
            Rekonsiliasi pembayaran kas masuk, monitor piutang, dan export laporan Excel.
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <strong className="text-slate-300 block mb-0.5">Staff</strong>
            Melihat penugasan jasa video dan membuat draft invoice untuk ditinjau.
          </div>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Memuat anggota tim...</div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            return (
              <div
                key={member.userId}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{member.name}</h4>
                      {isCurrentUser && (
                        <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-md">
                          (Anda)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500" /> {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Role Selector or Display */}
                  {isOwner && !isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as MemberRole)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="finance">Finance</option>
                      <option value="staff">Staff</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                        roleBadge[member.role].bg
                      }`}
                    >
                      {roleBadge[member.role].label}
                    </span>
                  )}

                  {isOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      title="Keluarkan dari Bisnis"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                <span>Undang Anggota Tim Baru</span>
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {inviteSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Anggota Tim <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="rekan@studio.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Anggota dapat mendaftar gratis di CineInvoice menggunakan email ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Hak Akses (Role)
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Admin (Kelola invoice, klien, dan katalog)</option>
                  <option value="finance">Finance / Akuntan (Pencatatan pembayaran & laporan)</option>
                  <option value="staff">Staff (Draft invoice & melihat jasa)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submittingInvite ? 'Membuat Undangan...' : 'Kirim Undangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile } from '../services/db';
import {
  User,
  Mail,
  Shield,
  Key,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, profile, userMemberships, currentBusiness, logout, sendPasswordReset, resendVerification } =
    useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      if (profile) {
        const updated = {
          ...profile,
          displayName: displayName.trim(),
          photoURL: photoURL.trim(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(updated);
        setSuccess('Profil berhasil diperbarui.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResetPassword = async () => {
    if (!user.email) return;
    try {
      await sendPasswordReset(user.email);
      setSuccess(`Tautan ganti kata sandi telah dikirim ke ${user.email}.`);
    } catch (err) {
      console.error(err);
      setError('Gagal mengirim tautan ganti kata sandi.');
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setError(null);
    try {
      await resendVerification();
      setSuccess('Email verifikasi telah dikirim ulang ke inbox Anda.');
    } catch (err) {
      console.error(err);
      setError('Gagal mengirim email verifikasi. Coba lagi dalam beberapa saat.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Profil Pengguna & Keamanan</h3>
              <p className="text-[11px] text-slate-400">Pengaturan akun dan verifikasi email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
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

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Email Verification Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Status Verifikasi Email:</span>
            {user.emailVerified ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Belum Terverifikasi
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-300 truncate max-w-[200px]">{user.email}</span>
            {!user.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="text-sky-400 hover:underline text-[11px] font-semibold"
              >
                {resendingEmail ? 'Mengirim...' : 'Kirim Ulang'}
              </button>
            )}
          </div>
        </div>

        {/* Profile Update Form */}
        <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Tampilan</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">URL Foto Profil (Opsional)</label>
            <input
              type="text"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://.../avatar.jpg"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Memberships overview */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Workspace Bisnis Terdaftar ({userMemberships.length})
            </label>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {userMemberships.map((m) => (
                <div
                  key={m.businessId}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <span className="text-white font-medium truncate">
                    {m.businessId === currentBusiness?.id ? currentBusiness.name : `Workspace #${m.businessId.slice(-6)}`}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSendResetPassword}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Ganti Kata Sandi</span>
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {isUpdating ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

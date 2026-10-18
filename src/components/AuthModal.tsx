import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { WorkspaceType } from '../types';
import { Film, Mail, Lock, Eye, EyeOff, User, Building, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<WorkspaceType>('freelancer');
  const [businessName, setBusinessName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setError('Email dan kata sandi wajib diisi.');
          setIsSubmitting(false);
          return;
        }
        await loginWithEmail(email.trim(), password);
        onClose();
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Nama lengkap wajib diisi.');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim()) {
          setError('Email wajib diisi.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Kata sandi minimal 6 karakter.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Konfirmasi kata sandi tidak cocok.');
          setIsSubmitting(false);
          return;
        }
        if (!agreeTerms) {
          setError('Anda harus menyetujui Ketentuan Layanan dan Kebijakan Privasi.');
          setIsSubmitting(false);
          return;
        }

        const finalBizName = businessName.trim() || (accountType === 'freelancer' ? `${displayName} Creative` : `${displayName} Production`);

        await registerWithEmail(email.trim(), password, displayName.trim(), accountType, finalBizName);
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setError('Masukkan email Anda untuk reset password.');
          setIsSubmitting(false);
          return;
        }
        await sendPasswordReset(email.trim());
        setSuccessMessage('Tautan reset kata sandi telah dikirim ke email Anda.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('auth/invalid-credential') || errMsg.includes('auth/wrong-password') || errMsg.includes('auth/user-not-found')) {
        setError('Email atau kata sandi tidak valid. Silakan periksa kembali.');
      } else if (errMsg.includes('auth/email-already-in-use')) {
        setError('Email ini sudah terdaftar. Silakan pilih Masuk atau reset kata sandi.');
      } else if (errMsg.includes('auth/weak-password')) {
        setError('Kata sandi terlalu lemah. Gunakan minimal 6 karakter.');
      } else if (errMsg.includes('auth/invalid-email')) {
        setError('Format email tidak valid.');
      } else {
        setError(errMsg || 'Terjadi kesalahan pada sistem autentikasi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Gagal masuk dengan Google. Pastikan popup tidak diblokir browser.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Film className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {mode === 'login' ? 'Masuk ke CineInvoice' : mode === 'register' ? 'Buat Akun SaaS Baru' : 'Reset Kata Sandi'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? 'Akses dashboard invoice dan laporan finansial Anda'
                : mode === 'register'
                ? 'Daftar workspace mandiri freelancer atau UMKM studio'
                : 'Instruksi reset akan dikirimkan ke email terdaftar'}
            </p>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipe Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('freelancer')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                      accountType === 'freelancer'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" /> Freelancer
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Individu mandiri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('umkm')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                      accountType === 'umkm'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-sky-400" /> UMKM / Studio
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Bisnis & multi-tim</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Dimas Pratama"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Bisnis / Brand</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={accountType === 'freelancer' ? 'Contoh: Dimas Cine Labs' : 'Contoh: Lumina Studio Films'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-600"
              />
            </div>
          </div>

          {/* Password (for login and register) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('forgot');
                    }}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-600"
                />
              </div>
            </div>
          )}

          {/* Agreement Checkbox (register only) */}
          {mode === 'register' && (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="termsCheck"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="termsCheck" className="text-[11px] text-slate-400 leading-tight">
                Saya menyetujui <span className="text-indigo-400">Ketentuan Layanan</span> dan{' '}
                <span className="text-indigo-400">Kebijakan Privasi</span> data SaaS CineInvoice.
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 active:scale-98"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Memproses...</span>
            ) : mode === 'login' ? (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Daftar & Buat Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>Kirim Tautan Reset</span>
            )}
          </button>
        </form>

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-semibold">Atau</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </>
        )}

        {/* Mode Switcher Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('register');
                }}
                className="font-semibold text-sky-400 hover:underline"
              >
                Daftar Gratis
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('login');
                }}
                className="font-semibold text-sky-400 hover:underline"
              >
                Masuk ke Akun
              </button>
            </p>
          ) : (
            <p>
              Ingat kata sandi?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('login');
                }}
                className="font-semibold text-sky-400 hover:underline"
              >
                Kembali ke Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

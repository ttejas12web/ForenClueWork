import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import { Lock, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const isMinLength = newPassword.length >= 8;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isMinLength) {
      return setError('Password must be at least 8 characters long.');
    }
    if (newPassword === 'Forenclue@2026') {
      return setError('Please choose a new password that is different from the default initial password.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match. Please verify.');
    }

    setLoading(true);
    try {
      if (user) {
        const token = localStorage.getItem('auth_token');
        const res = await apiFetch('/api/auth/update-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ newPassword })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update password');
        }
        
        setUser({ ...user, tempPasswordChanged: true });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await apiFetch('/api/auth/skip-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok && user) {
        setUser({ ...user, tempPasswordChanged: true });
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100">
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/15 blur-xl scale-125 pointer-events-none" />
            <div className="relative h-16 w-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-xl shadow-slate-900/10 border border-slate-100 ring-1 ring-slate-900/5">
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7yfh9aP-3k7exKSgvW9ynV7lb9j62shvwJrpkiEi_9yiWUSxntW5Poc-MOXQCA0fd635VLo8C35glEPFtlSByqxDDepzEAX6D5T4SzFX-8fyKDIoo7_wV3EXH6u-UDF6P344Q4RRlRFY-qfqITWnuSXa7feb89eDlR9SCODoodogdY89rBez2K7fOiQI/s372/4b5616a4-6069-44a7-ba52-88f965165067.png"
                alt="ForenClue Logo"
                className="h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Account Security Setup
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 max-w-xs leading-relaxed">
            Welcome to the ForenClue Workspace! To secure your account, please set a new personal password to replace the default password.
          </p>
        </div>

        {/* User Identity Banner */}
        {user && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Logged in as</p>
              <p className="font-bold text-slate-800">{user.name}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {user.forenclueId}
              </span>
            </div>
          </div>
        )}

        {/* Password Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 flex items-start">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-xs transition-all"
                  placeholder="Enter secure password (min. 8 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-xs transition-all"
                  placeholder="Re-type new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Indicators */}
          <div className="space-y-1 pt-1 text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className={`h-3.5 w-3.5 ${isMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className={isMinLength ? 'text-emerald-700 font-medium' : ''}>At least 8 characters long</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className={`h-3.5 w-3.5 ${isMatching ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className={isMatching ? 'text-emerald-700 font-medium' : ''}>Passwords match exactly</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading || !isMinLength || !isMatching}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md shadow-blue-600/20 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {loading ? 'Securing Account...' : 'Update Password & Enter Workspace'}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={skipping || loading}
              className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {skipping ? 'Entering...' : 'Keep Default Password for Now & Continue →'}
            </button>
          </div>
        </form>

        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          ForenClue Security System • Confidential & Protected
        </div>
      </div>
    </div>
  );
};

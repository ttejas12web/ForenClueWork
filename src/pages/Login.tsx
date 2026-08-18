import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import { Fingerprint, Lock, Mail, AlertCircle, Shield, ArrowRight, UserCheck } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ForenClue Workspace
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Your Partner In Forensic Precision!
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 flex items-start">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="identifier">
                Email address or ForenClue ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-xs transition-all"
                  placeholder="e.g. FC-ADMIN-2026-001 or admin@forenclue.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-xs transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md shadow-blue-600/20 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {loading ? 'Authenticating...' : 'Sign in to Workspace'}
            </button>
          </div>
        </form>



        <div className="text-center text-[10px] text-slate-400">
          Internal ForenClue System • Authorized Personnel Only
        </div>
      </div>
    </div>
  );
};

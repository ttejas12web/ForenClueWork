import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authenticateWithFirestore } from '../lib/firestoreService';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authenticateWithFirestore(identifier, password);
      const token = `fc_token_${user.id}_${Date.now()}`;
      login(token, user as unknown as User);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Desktop Background Animations */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Floating animated blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            {/* Backdrop glow / shadow */}
            <div className="absolute inset-0 rounded-2xl bg-blue-600/15 blur-xl scale-125 pointer-events-none" />
            <div className="relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-slate-900/10 border border-slate-100 ring-1 ring-slate-900/5">
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7yfh9aP-3k7exKSgvW9ynV7lb9j62shvwJrpkiEi_9yiWUSxntW5Poc-MOXQCA0fd635VLo8C35glEPFtlSByqxDDepzEAX6D5T4SzFX-8fyKDIoo7_wV3EXH6u-UDF6P344Q4RRlRFY-qfqITWnuSXa7feb89eDlR9SCODoodogdY89rBez2K7fOiQI/s372/4b5616a4-6069-44a7-ba52-88f965165067.png"
                alt="ForenClue Logo"
                className="h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)] transition-transform hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ForenClue Workspace
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Your Partner In Forensic Precision!
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => handleLogin(e)}>
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
                  placeholder="e.g. employee@forenclue.in or FC-EMP-2026-001"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-xs transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              id="login-submit-btn"
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

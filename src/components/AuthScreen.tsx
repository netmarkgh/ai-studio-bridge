import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

export function AuthScreen({ initialMode = 'login' }: { initialMode?: 'login' | 'register' | 'reset' | 'update' }) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'update'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bizName, setBizName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            name,
            biz_name: bizName,
            role: 'member',
            status: 'inactive', 
            currency: 'GHS',
          });
          if (profileError) throw profileError;
        }
      } else if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else if (mode === 'reset') {
        const redirectTo = window.location.origin + window.location.pathname;
        console.log('Supabase Recovery Redirect URL:', redirectTo);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo,
        });
        if (resetError) throw resetError;
        setSuccess('Password reset link sent! Check your email.');
      } else if (mode === 'update') {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });
        if (updateError) throw updateError;
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => {
          // Clear signals and reload to fresh state
          window.location.href = window.location.origin + window.location.pathname;
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e0c] relative overflow-hidden p-6">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(22,163,115,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(22,163,115,.06)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(22,163,115,.1)_0%,transparent_68%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="text-center mb-8">
          <div className="text-4xl font-semibold text-brand tracking-tighter leading-none">NMG</div>
          <div className="text-xs text-white/30 mt-2 uppercase tracking-widest">Community Invoice Platform</div>
        </div>

        <div className="bg-[#1a1a17] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-medium text-white mb-6">
            {mode === 'register' ? 'Create your account' : mode === 'reset' ? 'Recover account' : mode === 'update' ? 'Set new password' : 'Sign in'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-brand/10 border border-brand/30 rounded-lg p-3 text-brand text-sm mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1.5 ml-1">Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1.5 ml-1">Business</label>
                    <input 
                      type="text" 
                      required
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors"
                      placeholder="Business name"
                    />
                  </div>
                </div>
              </>
            )}

            {mode !== 'update' && (
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  disabled={mode === 'update'}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors disabled:opacity-50"
                  placeholder="you@email.com"
                />
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider">
                    {mode === 'update' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-[10px] text-brand hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand transition-colors pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-brand text-white font-medium py-3 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand/20"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {mode === 'register' ? 'Create Account' : mode === 'reset' ? 'Send Recovery Link' : mode === 'update' ? 'Update Password' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/30">
            {mode === 'register' ? (
              <p>Already have an account? <button onClick={() => setMode('login')} className="text-brand hover:underline">Sign in</button></p>
            ) : mode === 'reset' ? (
              <p>Remembered your password? <button onClick={() => setMode('login')} className="text-brand hover:underline">Sign in</button></p>
            ) : mode === 'update' ? (
              <p>Go back to <button onClick={() => setMode('login')} className="text-brand hover:underline">Sign in</button></p>
            ) : (
              <p>New to NMG? <button onClick={() => setMode('register')} className="text-brand hover:underline">Create account</button></p>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-[10px] text-white/10 font-mono tracking-widest uppercase">
          Authorized members only
        </div>
      </motion.div>
    </div>
  );
}

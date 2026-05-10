import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card border border-border p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative text-center space-y-2">
          <div className="inline-flex mb-4">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">รวยจังโว้ย</h1>
          <p className="text-gray-500 font-medium">
            {isForgotPassword 
              ? 'Reset your account password' 
              : (isSignUp ? 'Create your professional portfolio' : 'Sign in to your dashboard')}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full bg-sidebar border border-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!isForgotPassword && (
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full bg-sidebar border border-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {isSignUp && (
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-sidebar border border-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all shadow-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(!isForgotPassword);
                setMessage(null);
              }}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
            >
              {isForgotPassword ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsForgotPassword(false);
              setMessage(null);
            }}
            className="text-sm font-medium text-gray-500 hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

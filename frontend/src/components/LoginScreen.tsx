import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { ScreenType, UserProfile } from '../types';
import { api } from '../services/api';
import { NutriLenseLogo, LeafyBackgroundDecorations } from './NutriLenseLogo';

interface LoginScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginScreen({ onNavigate, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const result = await api.signIn(email, password);
      await onLoginSuccess({
        name: result.user.name || result.user.email.split('@')[0],
        email: result.user.email,
        age: 0,
        gender: 'Other',
        height: 0,
        weight: 0,
        healthConditions: [],
        dietaryPreferences: [],
      });
      onNavigate('ai');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-4 py-8 bg-gradient-to-b from-[#daefcc] to-[#f3f9f0] text-slate-850 overflow-y-auto">
      
      {/* Background Leaves */}
      <LeafyBackgroundDecorations />

      {/* Main Login card as defined in WhatsApp Screenshots */}
      <div className="relative z-10 w-full max-w-[340px] bg-white rounded-[28px] shadow-[0_12px_36px_rgba(89,155,56,0.15)] px-6 py-8 flex flex-col border border-[#e2edd8]/50">
        
        {/* NutriLense Camera Leaf Logo */}
        <NutriLenseLogo 
          size={84} 
          showText={true} 
          textSizeClass="text-3xl font-extrabold tracking-tight text-[#111111]"
          className="mb-6"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[11px] leading-tight text-center">
              {error}
            </div>
          )}

          {/* Email input matching image perfectly */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#e1e6e0] rounded-xl text-xs focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none text-slate-800 transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Password Input matching image perfectly */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="login-password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 bg-white border border-[#e1e6e0] rounded-xl text-xs focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none text-slate-800 transition-all font-medium placeholder-slate-400"
            />
            {/* Eye toggle on the right */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot Password link exactly styled right-aligned */}
          <div className="flex justify-end -mt-1.5">
            <button
              type="button"
              className="text-[11px] font-semibold text-[#599b38] hover:text-[#427429] transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login button: Solid black rounded-xl block */}
          <motion.button
            id="btn-login-submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#111311] hover:bg-black text-white font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Logging In...</span>
              </span>
            ) : (
              <span>Login</span>
            )}
          </motion.button>
        </form>

        {/* Or divider line matching image */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-[#ebf0ea]"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-405 font-medium select-none text-slate-400 uppercase tracking-widest">or</span>
          <div className="flex-grow border-t border-[#ebf0ea]"></div>
        </div>

        {/* Bottom Navigation Toggle exactly matching the mockup */}
        <div className="text-center">
          <span className="text-[11.5px] text-slate-500 font-semibold">Don’t have an account? </span>
          <button
            onClick={() => onNavigate('register')}
            className="text-[11.5px] font-bold text-[#599b38] hover:text-[#427429] cursor-pointer"
          >
            Register Here
          </button>
        </div>

      </div>
    </div>
  );
}

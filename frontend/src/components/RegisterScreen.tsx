import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, ChevronLeft } from 'lucide-react';
import { ScreenType, UserProfile } from '../types';
import { NutriLenseLogo, LeafyBackgroundDecorations } from './NutriLenseLogo';
import {api} from '../services/api';

interface RegisterScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onRegisterSuccess: (user: UserProfile) => void;
}

export default function RegisterScreen({ onNavigate, onRegisterSuccess }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Please provide your full name');
      return;
    }
    if (!email) {
      setError('Please provide your email address');
      return;
    }
    if (!password) {
      setError('Please select a password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await api.signUp(name, email, password);
      await onRegisterSuccess({
        name,
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
      setError(cause instanceof Error ? cause.message : 'Unable to create the account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-4 py-6 bg-gradient-to-b from-[#daefcc] to-[#f3f9f0] text-slate-850 overflow-y-auto">
      
      {/* Background Decorator Leaves */}
      <LeafyBackgroundDecorations />

      {/* Main card matching login design */}
      <div className="relative z-10 w-full max-w-[340px] bg-white rounded-[28px] shadow-[0_12px_36px_rgba(89,155,56,0.15)] px-6 py-6 flex flex-col border border-[#e2edd8]/50">
        
        {/* NutriLense Camera Leaf Logo */}
        <NutriLenseLogo 
          size={72} 
          showText={true} 
          textSizeClass="text-2xl font-extrabold tracking-tight text-[#111111]"
          className="mb-4"
        />

        <div className="text-center mb-4">
          <h3 className="text-sm font-bold text-slate-700">Create New Account</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Start snapping meals to reveal nutrition</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[10px] leading-tight text-center">
              {error}
            </div>
          )}

          {/* Full Name field */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="w-3.5 h-3.5" />
            </span>
            <input
              id="register-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e1e6e0] rounded-xl text-xs focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none text-slate-800 transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Email field */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="w-3.5 h-3.5" />
            </span>
            <input
              id="register-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e1e6e0] rounded-xl text-xs focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none text-slate-800 transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Password field */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              id="register-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e1e6e0] rounded-xl text-xs focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none text-slate-800 transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Confirm Password field */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              id="register-confirm-password-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e1e6e0] rounded-xl text-xs focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none text-slate-800 transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Terms checkbox */}
          <div className="text-[10px] text-slate-400 flex items-start gap-1.5 mt-0.5 select-none leading-normal">
            <input type="checkbox" className="mt-0.5 rounded text-[#599b38] accent-[#599b38]" required defaultChecked />
            <span>I agree to NutriLense nutrition auditing policies</span>
          </div>

          {/* Register button: Solid black pill */}
          <motion.button
            id="btn-register-submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#111311] hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Registering...</span>
              </span>
            ) : (
              <span>Register</span>
            )}
          </motion.button>
        </form>

        {/* Separator */}
        <div className="border-t border-[#ebf0ea] my-3.5"></div>

        {/* To login link */}
        <div className="text-center">
          <span className="text-[11px] text-slate-500 font-semibold">Already have an account? </span>
          <button
            onClick={() => onNavigate('login')}
            className="text-[11px] font-bold text-[#599b38] hover:text-[#427429]"
          >
            Login Here
          </button>
        </div>

      </div>
    </div>
  );
}

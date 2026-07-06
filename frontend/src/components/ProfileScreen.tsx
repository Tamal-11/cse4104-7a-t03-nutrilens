import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, User, Save, Calendar, Shield, Sparkles, LogOut, Download } from 'lucide-react';
import { ScreenType, UserProfile } from '../types';
import { NutriLenseLogo } from './NutriLenseLogo';
import {api} from '../services/api';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onNavigate: (screen: ScreenType) => void;
  onSignOut: () => Promise<void>;
  canInstall: boolean;
  installed: boolean;
  onInstall: () => Promise<boolean>;
}

const AVAILABLE_DIETS = ['Balanced', 'High Protein', 'Keto', 'Vegan', 'Low Carb', 'Balanced Carb'];
const AVAILABLE_CONDITIONS = ['None', 'Mild Sodium Sensitivity', 'Lactose Intolerance', 'Diabetes Type 2', 'Hypertension'];

export default function ProfileScreen({ user, onUpdateUser, onNavigate, onSignOut, canInstall, installed, onInstall }: ProfileScreenProps) {
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [age, setAge] = useState(user.age);
  const [gender, setGender] = useState(user.gender);
  const [height, setHeight] = useState(user.height);
  const [weight, setWeight] = useState(user.weight);
  
  const [selectedDiets, setSelectedDiets] = useState<string[]>(user.dietaryPreferences);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(user.healthConditions);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const updated = {
      name,
      email,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      dietaryPreferences: selectedDiets,
      healthConditions: selectedConditions,
    };

    try {
      await api.updateProfile(updated);
      onUpdateUser(updated);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the profile.');
    }
  };

  const toggleDiet = (diet: string) => {
    setSelectedDiets(prev => {
      if (prev.includes(diet)) {
        return prev.filter(d => d !== diet);
      } else {
        return [...prev, diet];
      }
    });
  };

  const toggleCondition = (condition: string) => {
    if (condition === 'None') {
      setSelectedConditions([]);
      return;
    }
    setSelectedConditions(prev => {
      if (prev.includes(condition)) {
        return prev.filter(c => c !== condition);
      } else {
        return [...prev, condition];
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f2f8ed] text-slate-850 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 pb-6">
        
        {/* 1. Header Bar matching Image perfectly */}
        <div className="mx-4 mt-3 p-3 bg-white/95 rounded-[22px] shadow-[0_4px_20px_rgba(89,155,56,0.06)] border border-[#e2ebd8]/60 flex items-center justify-between">
        
        {/* Left side Logo */}
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <ChevronLeft className="w-5 h-5 text-slate-700 hover:text-slate-900" />
          <span className="text-xs font-bold text-slate-700">Back</span>
        </div>

        {/* Center Title */}
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">User Profile</span>

        {/* Balanced spacer */}
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        
        {/* User Card */}
        <div className="bg-white rounded-[24px] border border-[#e2edd8] p-5 text-center flex flex-col items-center shadow-[0_4px_16px_rgba(89,155,56,0.02)]">
          <div className="w-16 h-16 rounded-full bg-[#daeed0] text-[#3c7224] flex items-center justify-center font-black text-2xl mx-auto shadow-xs border-2 border-white select-none">
            {name ? name.slice(0, 2).toUpperCase() : 'NM'}
          </div>
          <h4 className="text-base font-extrabold text-neutral-900 mt-2">{name}</h4>
          <p className="text-[11px] text-slate-400 font-medium">{email}</p>
          
          {user.isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="mt-3.5 py-1.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 text-[10px] font-black tracking-wider uppercase rounded-full border border-purple-500/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Enter Admin Console</span>
            </button>
          )}
        </div>

        {/* Core fields */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Account metrics card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558e38] uppercase tracking-wider mb-1">
              <User className="w-4 h-4 text-[#558e38]" /> Account Coordinates
            </span>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name</label>
              <input
                id="profile-name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-800 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
              <input
                id="profile-email-input"
                type="email"
                value={email}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-50 border border-[#e3edd9] rounded-xl text-xs text-slate-500 font-bold outline-none"
              />
            </div>
          </div>

          {/* Physical specification card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558e38] uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-[#558e38]" /> Physical Biometrics
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Special preferences card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558e38] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Dietary Targets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_DIETS.map(diet => {
                const isSel = selectedDiets.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleDiet(diet)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                      isSel 
                        ? 'bg-[#599b38]/10 border-[#599b38]/30 text-[#3a6823]' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {diet}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Medical parameters card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b54a4a] uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" /> Health Warnings
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_CONDITIONS.map(cond => {
                const isSel = cond === 'None' ? selectedConditions.length === 0 : selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                      isSel 
                        ? 'bg-rose-55 hover:bg-rose-100 bg-rose-50 border-rose-300 text-rose-800' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action: Dark rounded-xl */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558e38] uppercase tracking-wider">
              <Download className="w-4 h-4" /> Install NutriLens
            </span>
            <p className="my-2 text-[10px] text-slate-500">
              {installed ? 'NutriLens is installed on this device.' : 'Install the app for quick access and offline startup.'}
            </p>
            <button
              type="button"
              disabled={!canInstall}
              onClick={() => void onInstall()}
              className="w-full rounded-xl bg-[#599b38] py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {installed ? 'App installed' : canInstall ? 'Install app' : 'Install unavailable in this browser'}
            </button>
          </div>

          {error && <p className="rounded-xl bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">{error}</p>}

          <motion.button
            id="btn-save-profile"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full mt-2 py-3.5 bg-[#111311] hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Metrics</span>
          </motion.button>

          {/* Logout Action at the bottom side */}
          <motion.button
            id="btn-logout-profile"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => void onSignOut()}
            className="w-full mt-2 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out / Logout</span>
          </motion.button>
        </form>
      </div>
      </div>

      {/* Floating Save Announcement Toast */}
      {showSavedToast && (
        <div className="fixed top-[15%] left-1/2 transform -translate-x-1/2 p-3 bg-slate-900 text-emerald-400 text-xs font-black rounded-xl shadow-xl flex items-center gap-1.5 z-55">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Metrics saved successfully!</span>
        </div>
      )}
    </div>
  );
}

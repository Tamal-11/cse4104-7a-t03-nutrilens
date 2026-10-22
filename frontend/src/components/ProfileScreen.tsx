import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronLeft, Loader2, User, Save, Calendar, Shield, Sparkles, LogOut, Download, Share, MoreVertical, HeartPulse } from 'lucide-react';
import { FoodGoal, ScreenType, UserProfile } from '../types';
import { NutriLensLogo } from './NutriLensLogo';
import {api} from '../services/api';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onNavigate: (screen: ScreenType) => void;
  onSignOut: () => Promise<void>;
  canInstall: boolean;
  installed: boolean;
  onInstall: () => Promise<boolean>;
  scanGateNotice?: string;
}

const AVAILABLE_FOOD_GOALS: FoodGoal[] = ['Lose weight', 'Gain weight', 'Eat balanced'];
const AVAILABLE_CONDITIONS = [
  'None',
  'Pregnant',
  'Diabetes',
  'High Blood Pressure',
  'Heart Problem',
];
const AVAILABLE_ALLERGIES = [
  'Shrimp / Prawns (Chingri)',
  'Crab (Kakra)',
  'Fish (Ilish, Tuna, etc.)',
  'Eggs (especially egg whites)',
  'Milk',
  'Peanuts (China Badam)',
  'Tree nuts (Cashews, Almonds, Walnuts)',
  'Wheat (Atta, Bread, Roti)',
  'Soybeans (Soy milk, Tofu)',
  'Sesame seeds (Til)',
];

export default function ProfileScreen({ user, onUpdateUser, onNavigate, onSignOut, canInstall, installed, onInstall, scanGateNotice }: ProfileScreenProps) {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [age, setAge] = useState(String(user.age || ''));
  const [gender, setGender] = useState(user.gender);
  const [height, setHeight] = useState(String(user.height || ''));
  const [weight, setWeight] = useState(String(user.weight || ''));
  
  const [foodGoal, setFoodGoal] = useState<FoodGoal>(user.foodGoal || 'Eat balanced');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(user.healthConditions.filter((condition) => condition !== 'Milk Allergy'));
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(user.allergies.map((allergy) => allergy === "Milk (cow's milk)" ? 'Milk' : allergy));
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const validateField = (field: string, value: string) => {
    const trimmed = value.trim();
    if (field === 'name') return trimmed ? '' : 'Enter your display name.';
    if (!trimmed) return `Enter your ${field === 'age' ? 'age' : field}.`;
    const number = Number(trimmed);
    if (!Number.isFinite(number)) return `Enter a valid ${field}.`;
    const ranges: Record<string, [number, number]> = { age: [13, 120], height: [50, 260], weight: [20, 500] };
    const [min, max] = ranges[field];
    return number < min || number > max ? `Enter a value from ${min} to ${max} ${field === 'height' ? 'cm' : field === 'weight' ? 'kg' : 'years'}.` : '';
  };

  const handleFieldBlur = (field: string, value: string) => {
    setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) }));
  };

  const handleFieldChange = (field: string, value: string, update: (value: string) => void) => {
    update(value);
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');
    const nextErrors = {
      name: validateField('name', name),
      age: validateField('age', age),
      height: validateField('height', height),
      weight: validateField('weight', weight),
    };
    setFieldErrors(nextErrors);
    const firstInvalidField = Object.entries(nextErrors).find(([, message]) => message)?.[0];
    if (firstInvalidField) {
      formRef.current?.querySelector<HTMLElement>(`#profile-${firstInvalidField}-input`)?.focus();
      setError('Please fix the highlighted fields and try again.');
      return;
    }
    setIsSaving(true);
    const updated = {
      name,
      email,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      foodGoal,
      healthConditions: selectedConditions,
      allergies: selectedAllergies,
      isAdmin: user.isAdmin,
    };

    try {
      await api.updateProfile(updated);
      onUpdateUser(updated);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the profile.');
    } finally {
      setIsSaving(false);
    }
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

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((current) => current.includes(allergy)
      ? current.filter((item) => item !== allergy)
      : [...current, allergy]);
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
        <form ref={formRef} onSubmit={handleSave} className="space-y-4" noValidate>
          {scanGateNotice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">{scanGateNotice}</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
          
          {/* Account metrics card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558e38] uppercase tracking-wider mb-1">
              <User className="w-4 h-4 text-[#558e38]" /> Account
            </span>
            
            <div>
              <label htmlFor="profile-name-input" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name <span className="text-rose-600">*</span></label>
              <input
                id="profile-name-input"
                type="text"
                value={name}
                autoComplete="name"
                onChange={e => handleFieldChange('name', e.target.value, setName)}
                onBlur={e => handleFieldBlur('name', e.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'profile-name-error' : undefined}
                className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-800 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
              />
              <p id="profile-name-error" className="min-h-4 pt-1 text-[11px] text-rose-700">{fieldErrors.name}</p>
            </div>

            <div>
              <label htmlFor="profile-email-input" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
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
              <Calendar className="w-4 h-4 text-[#558e38]" /> Body Info
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-age-input" className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Age <span className="text-rose-600">*</span></label>
                <input
                  id="profile-age-input"
                  type="number"
                  min="13"
                  max="120"
                  step="1"
                  inputMode="numeric"
                  autoComplete="off"
                  value={age}
                  onChange={e => handleFieldChange('age', e.target.value, setAge)}
                  onBlur={e => handleFieldBlur('age', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.age)}
                  aria-describedby={fieldErrors.age ? 'profile-age-error' : undefined}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                />
                <p id="profile-age-error" className="min-h-4 pt-1 text-[11px] text-rose-700">{fieldErrors.age}</p>
              </div>

              <div>
                <label htmlFor="profile-gender-input" className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Gender</label>
                <select
                  id="profile-gender-input"
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
                <label htmlFor="profile-height-input" className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Height (cm) <span className="text-rose-600">*</span></label>
                <input
                  id="profile-height-input"
                  type="number"
                  min="50"
                  max="260"
                  step="0.1"
                  inputMode="decimal"
                  value={height}
                  onChange={e => handleFieldChange('height', e.target.value, setHeight)}
                  onBlur={e => handleFieldBlur('height', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.height)}
                  aria-describedby={fieldErrors.height ? 'profile-height-error' : undefined}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                />
                <p id="profile-height-error" className="min-h-4 pt-1 text-[11px] text-rose-700">{fieldErrors.height}</p>
              </div>

              <div>
                <label htmlFor="profile-weight-input" className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Weight (kg) <span className="text-rose-600">*</span></label>
                <input
                  id="profile-weight-input"
                  type="number"
                  min="20"
                  max="500"
                  step="0.1"
                  inputMode="decimal"
                  value={weight}
                  onChange={e => handleFieldChange('weight', e.target.value, setWeight)}
                  onBlur={e => handleFieldBlur('weight', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.weight)}
                  aria-describedby={fieldErrors.weight ? 'profile-weight-error' : undefined}
                  className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-850 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
                />
                <p id="profile-weight-error" className="min-h-4 pt-1 text-[11px] text-rose-700">{fieldErrors.weight}</p>
              </div>
            </div>
          </div>

          {/* Special preferences card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558e38] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Food Goals
            </span>
            <label htmlFor="profile-food-goal-input" className="sr-only">Food goal</label>
            <select
              id="profile-food-goal-input"
              value={foodGoal}
              onChange={e => setFoodGoal(e.target.value as FoodGoal)}
              className="w-full px-3 py-2.5 bg-[#fafff6] border border-[#e3edd9] rounded-xl text-xs text-slate-800 font-bold focus:ring-1 focus:ring-[#519031] focus:border-[#519031] outline-none"
            >
              {AVAILABLE_FOOD_GOALS.map(goal => <option key={goal} value={goal}>{goal}</option>)}
            </select>
          </div>

          {/* Medical parameters card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b54a4a] uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" /> Health Notes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_CONDITIONS.map(cond => {
                const isSel = cond === 'None' ? selectedConditions.length === 0 : selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    aria-pressed={isSel}
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

          {/* Allergy parameters card */}
          <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b54a4a] uppercase tracking-wider mb-1">
              <HeartPulse className="w-4 h-4" /> Allergies
            </span>
            <p className="text-[10px] text-slate-500">Select any ingredients you are allergic to.</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ALLERGIES.map(allergy => {
                const isSel = selectedAllergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                      isSel
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {allergy}
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
              {installed ? 'Installed on this device.' : 'Add it to your home screen.'}
            </p>
            <button
              type="button"
              disabled={installed}
              onClick={() => {
                if (canInstall) {
                  void onInstall();
                  return;
                }
                setShowInstallHelp((value) => !value);
              }}
              className="w-full rounded-xl bg-[#599b38] py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {installed ? 'Installed' : 'Install'}
            </button>
          </div>

          <motion.button
            id="btn-save-profile"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="w-full mt-2 py-3.5 bg-[#111311] hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving' : 'Save Profile'}</span>
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
            <span>Logout</span>
          </motion.button>
        </form>
      </div>
      </div>

      {/* Floating Save Announcement Toast */}
      {showSavedToast && (
        <div className="fixed top-[15%] left-1/2 transform -translate-x-1/2 px-4 py-3 bg-slate-950 text-white text-xs font-black rounded-2xl shadow-xl flex items-center gap-2 z-55">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
            <Check className="h-4 w-4" />
          </span>
          <span>Saved</span>
        </div>
      )}
      {showInstallHelp && !installed && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef7e8] text-[#599b38]">
              <Download className="h-6 w-6" />
            </div>
            <p className="mt-3 text-center text-sm font-black text-slate-900">Install NutriLens</p>
            <div className="mt-3 text-[11px] font-bold text-slate-600">
              {isIOS ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#f6fbf2] p-3">
                  <Share className="h-5 w-5 shrink-0 text-[#599b38]" />
                  <span>Tap Share, then Add to Home Screen.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-[#f6fbf2] p-3">
                  <MoreVertical className="h-5 w-5 shrink-0 text-[#599b38]" />
                  <span>{isAndroid ? 'Tap Install app in your browser menu.' : 'Click Install app in your browser menu.'}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowInstallHelp(false)}
              className="mt-4 w-full rounded-xl bg-slate-950 py-2.5 text-xs font-extrabold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

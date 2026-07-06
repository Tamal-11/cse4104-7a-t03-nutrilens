import { motion } from 'motion/react';
import { Clipboard, Flame, Soup, AlertTriangle, LogOut, User } from 'lucide-react';
import { ScreenType, UserProfile, FoodAnalysis } from '../types';
import { NutriLenseLogo } from './NutriLenseLogo';

interface DashboardScreenProps {
  user: UserProfile;
  history: FoodAnalysis[];
  onNavigate: (screen: ScreenType) => void;
  onSelectScan: (scan: FoodAnalysis) => void;
}

export default function DashboardScreen({ user, history, onNavigate, onSelectScan }: DashboardScreenProps) {
  const totalCalories = history.reduce((sum, item) => sum + item.macros.calories, 0);
  const averageCalories = history.length ? Math.round(totalCalories / history.length) : 0;
  const healthyMeals = history.filter((item) => item.isHealthy).length;
  const highCalorieMeals = history.filter((item) => item.macros.calories >= 600).length;
  
  const handleSignOut = () => {
    onNavigate('home');
  };

  return (
    <div className="flex flex-col h-full bg-[#f2f8ed] text-slate-800 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 pb-6">
        
        {/* 1. Header Bar matching image perfectly */}
        <div className="mx-4 mt-3 p-3 bg-white/95 rounded-[22px] shadow-[0_4px_20px_rgba(89,155,56,0.06)] border border-[#e2ebd8]/60 flex items-center justify-between">
        
        {/* Left side: Logo */}
        <div className="flex items-center gap-1 cursor-pointer mx-auto sm:mx-0" onClick={() => onNavigate('home')}>
          <NutriLenseLogo size={36} showText={true} textSizeClass="text-base font-extrabold tracking-tight text-slate-900" className="flex-row gap-1.5" />
        </div>
      </div>

      {/* 2. Main Welcome Section */}
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-extrabold text-neutral-900 select-none">Welcome back!</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5 select-none">Here’s your nutrition overview.</p>
      </div>

      {/* 3. 2x2 Metric Cards Grid */}
      <div className="px-4 grid grid-cols-2 gap-3.5">
        
        {/* Total Analyses */}
        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Clipboard className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Total Analyses</span>
            <span className="text-[22px] font-black text-[#50912e] leading-tight block mt-1">{history.length}</span>
          </div>
        </div>

        {/* Average Calories */}
        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Flame className="w-4.5 h-4.5 fill-current" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Average Calories</span>
            <span className="text-[20px] font-black text-[#50912e] leading-tight block mt-1">{averageCalories} <span className="text-xs font-semibold">kcal</span></span>
          </div>
        </div>

        {/* Healthy Meals */}
        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Soup className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Healthy Meals</span>
            <span className="text-[22px] font-black text-[#50912e] leading-tight block mt-1">{healthyMeals}</span>
          </div>
        </div>

        {/* High Calories */}
        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#fdfbe9] text-[#b0a02c] flex items-center justify-center">
            <AlertTriangle className="w-4.5 h-4.5 fill-current" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">High-Calorie Meals</span>
            <span className="text-[22px] font-black text-[#b5a328] leading-tight block mt-1">{highCalorieMeals}</span>
          </div>
        </div>
      </div>

      {/* 4. Recent Analysis Section */}
      <div className="px-4 mt-5 mb-8">
        <div className="bg-white rounded-[24px] shadow-[0_6px_22px_rgba(89,155,56,0.06)] border border-[#e4eedb] p-4 flex flex-col">
          <span className="text-sm font-bold text-slate-800 ml-1">Recent Analysis</span>
          
          {/* Green Table Headers row matching screenshot perfectly */}
          <div className="mt-3 mx-0.5 rounded-xl bg-[#eef5e9] py-2 px-5 flex items-center justify-between text-[11px] font-bold text-[#456d2f] select-none">
            <span className="w-1/3">Food</span>
            <span className="w-1/3 text-center">Calories</span>
            <span className="w-1/3 text-right">Date</span>
          </div>

          {/* List items */}
          <div className="flex flex-col mt-1">
            {/* Row 1 */}
            <div 
              onClick={() => {
                // Preloaded Pizza analysis click trigger
                const pizzaScan = history.find(h => h.name.toLowerCase().includes('pizza')) || history[3];
                onSelectScan(pizzaScan);
                onNavigate('ai');
              }}
              className="py-3 px-5 flex items-center justify-between text-xs text-slate-705 font-bold cursor-pointer hover:bg-slate-50 rounded-xl transition"
            >
              <span className="w-1/3 text-[#111111] font-bold">Pizza</span>
              <span className="w-1/3 text-center text-slate-650">560</span>
              <span className="w-1/3 text-right text-slate-400 font-semibold">Today</span>
            </div>
            
            <div className="border-t border-[#f4f7f2] mx-4"></div>

            {/* Row 2 */}
            <div 
              onClick={() => {
                // Preloaded Rice/Salmon click trigger
                const riceScan = history[4]; // Sourdough with Avocado or Greek Berry
                onSelectScan(riceScan);
                onNavigate('ai');
              }}
              className="py-3 px-5 flex items-center justify-between text-xs text-slate-705 font-bold cursor-pointer hover:bg-slate-50 rounded-xl transition"
            >
              <span className="w-1/3 text-[#111111] font-bold">Rice</span>
              <span className="w-1/3 text-center text-slate-650">380</span>
              <span className="w-1/3 text-right text-slate-400 font-semibold">Yesterday</span>
            </div>
          </div>
        </div>

        {/* Action instruction shortcut */}
        <div className="mt-4 text-center">
          <button 
            onClick={() => onNavigate('ai')}
            className="text-[11px] font-bold text-[#599b38] hover:underline cursor-pointer"
          >
            + Scan another custom meal
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

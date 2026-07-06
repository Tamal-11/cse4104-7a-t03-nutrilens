import { Clipboard, Flame, Soup, Clock, Shield } from 'lucide-react';
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
  const recentAnalyses = history.slice(0, 5);
  const latestCalories = recentAnalyses[0] ? Math.round(recentAnalyses[0].macros.calories) : 0;
  
  return (
    <div className="flex flex-col h-full bg-[#f2f8ed] text-slate-800 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 pb-6">
        
        {/* 1. Header Bar matching image perfectly */}
        <div className="mx-4 mt-3 p-3 bg-white/95 rounded-[22px] shadow-[0_4px_20px_rgba(89,155,56,0.06)] border border-[#e2ebd8]/60 flex items-center justify-between">
        
        {/* Left side: Logo */}
        <div className="flex items-center gap-1 cursor-pointer mx-auto sm:mx-0" onClick={() => onNavigate('home')}>
          <NutriLenseLogo size={36} showText={true} textSizeClass="text-base font-extrabold tracking-tight text-slate-900" className="flex-row gap-1.5" />
        </div>
        {user.isAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            aria-label="Admin"
            className="rounded-xl bg-[#eef7e8] p-2 text-[#558e38] transition hover:bg-[#dcefd0]"
          >
            <Shield className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Main Welcome Section */}
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-extrabold text-neutral-900 select-none">Dashboard</h2>
      </div>

      {/* 3. 2x2 Metric Cards Grid */}
      <div className="px-4 grid grid-cols-2 gap-3.5">
        
        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Clipboard className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Scans</span>
            <span className="text-[22px] font-black text-[#50912e] leading-tight block mt-1">{history.length}</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Flame className="w-4.5 h-4.5 fill-current" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Avg kcal</span>
            <span className="text-[20px] font-black text-[#50912e] leading-tight block mt-1">{averageCalories} <span className="text-xs font-semibold">kcal</span></span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Soup className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Healthy</span>
            <span className="text-[22px] font-black text-[#50912e] leading-tight block mt-1">{healthyMeals}</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Last kcal</span>
            <span className="text-[20px] font-black text-[#50912e] leading-tight block mt-1">{latestCalories} <span className="text-xs font-semibold">kcal</span></span>
          </div>
        </div>
      </div>

      {/* 4. Recent Analysis Section */}
      <div className="px-4 mt-5 mb-8">
        <div className="bg-white rounded-[24px] shadow-[0_6px_22px_rgba(89,155,56,0.06)] border border-[#e4eedb] p-4 flex flex-col">
          <span className="text-sm font-bold text-slate-800 ml-1">Recent</span>
          
          {/* Green Table Headers row matching screenshot perfectly */}
          <div className="mt-3 mx-0.5 rounded-xl bg-[#eef5e9] py-2 px-5 flex items-center justify-between text-[11px] font-bold text-[#456d2f] select-none">
            <span className="w-1/3">Food</span>
            <span className="w-1/3 text-center">kcal</span>
            <span className="w-1/3 text-right">Date</span>
          </div>

          <div className="flex flex-col mt-1">
            {recentAnalyses.length > 0 ? (
              recentAnalyses.map((scan, index) => (
                <div key={scan.id}>
                  {index > 0 && <div className="border-t border-[#f4f7f2] mx-4"></div>}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectScan(scan);
                      onNavigate('ai');
                    }}
                    className="w-full py-3 px-5 flex items-center justify-between text-xs text-slate-705 font-bold cursor-pointer hover:bg-slate-50 rounded-xl transition"
                  >
                    <span className="w-1/3 text-left text-[#111111] font-bold truncate">{scan.name}</span>
                    <span className="w-1/3 text-center text-slate-650">{Math.round(scan.macros.calories)}</span>
                    <span className="w-1/3 text-right text-slate-400 font-semibold truncate">{scan.time}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 px-5 text-center text-xs font-semibold text-slate-400">
                No analysis history yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}

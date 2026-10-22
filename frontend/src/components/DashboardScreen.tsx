import { Clipboard, Flame, Soup, Clock, Shield, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ScreenType, UserProfile, FoodAnalysis } from '../types';
import { NutriLensLogo } from './NutriLensLogo';

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
  const [recentFilter, setRecentFilter] = useState<'all' | 'healthy' | 'unhealthy'>('all');
  const recentSectionRef = useRef<HTMLDivElement>(null);
  const recentAnalyses = history.filter((item) => {
    if (recentFilter === 'healthy') return item.classification === 'Healthy';
    if (recentFilter === 'unhealthy') return item.classification === 'Unhealthy';
    return true;
  });
  const latestCalories = recentAnalyses[0] ? Math.round(recentAnalyses[0].macros.calories) : 0;
  const formatScanDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const scansByDay = new Map<string, FoodAnalysis[]>();
    history.forEach((scan) => {
      const date = new Date(scan.time);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month) return;
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      scansByDay.set(key, [...(scansByDay.get(key) ?? []), scan]);
    });
    return {
      days: [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
      ],
      scansByDay,
    };
  }, [calendarMonth, history]);
  const selectedDayScans = selectedDate ? calendarDays.scansByDay.get(selectedDate) ?? [] : [];
  const shiftCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
  };
  const dateKey = (day: number) => `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return (
    <div className="flex flex-col h-full bg-[#f2f8ed] text-slate-800 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 pb-6">
        
        {/* 1. Header Bar matching image perfectly */}
        <div className="mx-4 mt-3 p-3 bg-white/95 rounded-[22px] shadow-[0_4px_20px_rgba(89,155,56,0.06)] border border-[#e2ebd8]/60 flex items-center justify-between">
        
        {/* Left side: Logo */}
        <div className="flex items-center gap-1 cursor-pointer mx-auto sm:mx-0" onClick={() => onNavigate('home')}>
          <NutriLensLogo size={36} showText={true} textSizeClass="text-base font-extrabold tracking-tight text-slate-900" className="flex-row gap-1.5" />
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
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Avg est. kcal</span>
            <span className="text-[20px] font-black text-[#50912e] leading-tight block mt-1">≈ {averageCalories} <span className="text-xs font-semibold">/100g</span></span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRecentFilter('healthy');
            recentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          aria-label={`Show ${healthyMeals} healthy scans in Recent`}
          className={`p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border flex items-center gap-3 text-left transition hover:bg-[#fbfdf9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38] ${recentFilter === 'healthy' ? 'border-[#8bb874] ring-1 ring-[#8bb874]' : 'border-[#e6eedf]/80'}`}
        >
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Soup className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Healthy</span>
            <span className="text-[22px] font-black text-[#50912e] leading-tight block mt-1">{healthyMeals}</span>
          </div>
        </button>

        <div className="p-3.5 bg-white rounded-[22px] shadow-[0_4px_16px_rgba(89,155,56,0.05)] border border-[#e6eedf]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eef7e8] text-[#558e38] flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold select-none leading-none">Last est. kcal</span>
            <span className="text-[20px] font-black text-[#50912e] leading-tight block mt-1">≈ {latestCalories} <span className="text-xs font-semibold">/100g</span></span>
          </div>
        </div>
      </div>

      {/* 4. Recent Analysis Section */}
      <div className="px-4 mt-5 mb-8">
        <div ref={recentSectionRef} className="scroll-mt-4 bg-white rounded-[24px] shadow-[0_6px_22px_rgba(89,155,56,0.06)] border border-[#e4eedb] p-4 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-800 ml-1">Recent</span>
            <div className="flex items-center gap-1" role="group" aria-label="Filter recent scans by health status">
              {(['all', 'healthy', 'unhealthy'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRecentFilter(filter)}
                  aria-pressed={recentFilter === filter}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#599b38] ${recentFilter === filter ? 'bg-[#599b38] text-white' : 'bg-[#f3f6f1] text-slate-600 hover:bg-[#e9f1e3]'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Green Table Headers row matching screenshot perfectly */}
          <div className="mt-3 mx-0.5 rounded-xl bg-[#eef5e9] py-2 px-5 flex items-center justify-between text-[11px] font-bold text-[#456d2f] select-none">
              <span className="w-1/3">Food · Status</span>
            <span className="w-1/3 text-center">est. kcal/100g</span>
            <span className="w-1/3 text-right">Date</span>
          </div>

          <div role="region" aria-label="Recent meal scans" tabIndex={0} className="mt-1 max-h-52 overflow-y-auto overscroll-contain pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38]">
            <div className="flex flex-col">
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
                    <span className="w-1/3 flex items-center gap-1.5 text-left text-[#111111] font-bold truncate">
                      <span aria-label={scan.classification} title={scan.classification} className={`h-2 w-2 shrink-0 rounded-full ${scan.classification === 'Healthy' ? 'bg-emerald-500' : scan.classification === 'Unhealthy' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                      <span className="truncate">{scan.name}</span>
                    </span>
                    <span className="w-1/3 text-center text-slate-650">{Math.round(scan.macros.calories)}</span>
                    <span className="w-1/3 text-right text-slate-400 font-semibold truncate">{formatScanDate(scan.time)}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 px-5 text-center text-xs font-semibold text-slate-400">
                {history.length === 0 ? 'No analysis history yet.' : `No ${recentFilter} scans found.`}
              </div>
            )}
            </div>
          </div>
        </div>

      {/* Eating pattern calendar */}
      <section aria-labelledby="eating-pattern-heading" className="mt-5">
        <div className="bg-white rounded-[24px] shadow-[0_6px_22px_rgba(89,155,56,0.06)] border border-[#e4eedb] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-[#558e38]" />
              <h3 id="eating-pattern-heading" className="text-sm font-bold text-slate-800">Eating pattern</h3>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => shiftCalendarMonth(-1)} aria-label="Previous month" className="rounded-lg border border-[#e4eedb] p-1.5 text-slate-600 hover:bg-[#f6faf3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38]"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
              <span aria-live="polite" className="min-w-28 text-center text-xs font-bold text-slate-700">{calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              <button type="button" onClick={() => shiftCalendarMonth(1)} aria-label="Next month" className="rounded-lg border border-[#e4eedb] p-1.5 text-slate-600 hover:bg-[#f6faf3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38]"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Meal logging calendar">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} role="columnheader" className="py-1 text-[10px] font-bold text-slate-400">{day}</div>)}
            {calendarDays.days.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} role="gridcell" aria-hidden="true" />;
              const key = dateKey(day);
              const scans = calendarDays.scansByDay.get(key) ?? [];
              const isSelected = selectedDate === key;
              const isToday = new Date().getFullYear() === calendarMonth.getFullYear() && new Date().getMonth() === calendarMonth.getMonth() && new Date().getDate() === day;
              return <div key={key} role="gridcell">
                <button type="button" onClick={() => setSelectedDate(isSelected ? null : key)} aria-pressed={isSelected} aria-label={`${calendarMonth.toLocaleDateString(undefined, { month: 'long' })} ${day}${scans.length ? `, ${scans.length} ${scans.length === 1 ? 'meal' : 'meals'} logged` : ', no meals logged'}`} className={`relative flex min-h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#599b38] ${isSelected ? 'bg-[#599b38] text-white' : scans.length > 0 ? 'bg-[#599b38] text-white hover:bg-[#487e2d]' : isToday ? 'border border-[#8bb874] bg-[#f6faf3] text-slate-800' : 'text-slate-700 hover:bg-[#f6faf3]'}`}>
                  {day}
                </button>
              </div>;
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Filled days have meal scans. Select a day to view its scans.</p>
          {selectedDate && <div className="mt-3 border-t border-[#eef2ea] pt-3" aria-live="polite">
            <p className="text-xs font-bold text-slate-800">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            {selectedDayScans.length ? <ul className="mt-2 space-y-1">{selectedDayScans.map((scan) => <li key={scan.id}><button type="button" onClick={() => { onSelectScan(scan); onNavigate('ai'); }} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs hover:bg-[#f6faf3] focus-visible:outline-2 focus-visible:outline-[#599b38]"><span className="truncate font-semibold text-slate-700">{scan.name}</span><span className="ml-2 shrink-0 text-slate-500">{new Date(scan.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span></button></li>)}</ul> : <p className="mt-1 text-xs text-slate-500">No meal scans logged on this day.</p>}
          </div>}
        </div>
      </section>

      </div>
    </div>
    </div>
  );
}

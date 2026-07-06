import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Activity, ChevronLeft, Clock3, RefreshCw, ScanLine, Search,
  ShieldCheck, Terminal, ToggleLeft, ToggleRight, Users,
} from 'lucide-react';
import type {AdminStats, ScreenType, UserAccount} from '../types';
import {api} from '../services/api';
import {NutriLenseLogo} from './NutriLenseLogo';

export default function AdminScreen({onNavigate}: {onNavigate: (screen: ScreenType) => void}) {
  const [currentUserId, setCurrentUserId] = useState('');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.adminOverview();
      setCurrentUserId(response.data.currentUserId);
      setUsers(response.data.users);
      setStats(response.data.stats);
      setLogs(response.data.logs);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleStatus = async (user: UserAccount) => {
    if (user.id === currentUserId) return;
    setUpdatingId(user.id);
    setError('');
    try {
      const response = await api.setUserStatus(user.id, user.status === 'Active' ? 'Suspended' : 'Active');
      setUsers((current) => current.map((item) =>
        item.id === user.id ? {...response.data, scansCount: item.scansCount} : item,
      ));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this account.');
    } finally {
      setUpdatingId('');
    }
  };

  const filtered = useMemo(() => users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [search, users]);

  const statCards = stats ? [
    {label: 'Registered users', value: stats.totalUsers, icon: Users},
    {label: 'Food scans', value: stats.totalScans, icon: ScanLine},
    {label: 'Active today', value: stats.activeUsers24h, icon: Activity},
    {label: 'API response', value: `${stats.averageResponseTime}s`, icon: Clock3},
  ] : [];

  return (
    <div className="h-full overflow-y-auto bg-[#f2f8ed] text-slate-800">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col pb-8">
        <header className="mx-4 mt-3 flex items-center justify-between rounded-[22px] border border-[#e2ebd8]/80 bg-white/95 p-3 shadow-[0_4px_20px_rgba(89,155,56,0.06)]">
          <button onClick={() => onNavigate('profile')} className="flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-[#f2f8ed]">
            <ChevronLeft className="h-4 w-4"/> Back
          </button>
          <NutriLenseLogo size={34} showText textSizeClass="text-base font-extrabold text-slate-900" className="flex-row gap-1.5"/>
          <button onClick={() => void load()} disabled={loading} aria-label="Refresh admin data" className="rounded-xl p-2 text-[#599b38] transition hover:bg-[#eef7e8] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </header>

        <main className="space-y-5 px-4 pt-5">
          <section>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#daeed0] text-[#427429]"><ShieldCheck className="h-5 w-5"/></span>
              <div>
                <h1 className="text-xl font-black text-neutral-900">Admin dashboard</h1>
                <p className="text-[11px] font-medium text-slate-500">Manage NutriLens accounts and monitor live usage.</p>
              </div>
            </div>
          </section>

          {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map(({label, value, icon: Icon}) => (
              <div key={label} className="rounded-[20px] border border-[#e2edd8] bg-white p-3.5 shadow-[0_4px_16px_rgba(89,155,56,0.04)]">
                <Icon className="mb-2 h-4 w-4 text-[#599b38]"/>
                <strong className="block text-xl font-black text-[#427429]">{value}</strong>
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
              </div>
            ))}
          </section>

          <section className="rounded-[24px] border border-[#e2edd8] bg-white p-4 shadow-[0_4px_16px_rgba(89,155,56,0.03)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#558e38]"><Users className="h-4 w-4"/>User accounts</h2>
                <p className="mt-1 text-[10px] text-slate-400">{users.length} registered accounts</p>
              </div>
              <label className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"/>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts" className="w-full rounded-xl border border-[#dfead7] bg-[#fafff6] py-2 pl-9 pr-3 text-xs font-medium outline-none focus:border-[#599b38] sm:w-56"/>
              </label>
            </div>

            <div className="space-y-2">
              {filtered.map((user) => {
                const isSelf = user.id === currentUserId;
                const isUpdating = updatingId === user.id;
                return (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8f0e2] bg-[#fbfef9] p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="truncate text-xs text-slate-800">{user.name}</strong>
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${user.role === 'Admin' ? 'bg-[#daeed0] text-[#427429]' : 'bg-slate-100 text-slate-500'}`}>{user.role}</span>
                        {isSelf && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[8px] font-black uppercase text-amber-700">You</span>}
                      </div>
                      <p className="truncate text-[10px] font-medium text-slate-400">{user.email}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{user.scansCount} completed scans</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-[9px] font-extrabold ${user.status === 'Active' ? 'text-[#599b38]' : 'text-rose-600'}`}>{user.status}</span>
                      <button
                        onClick={() => void toggleStatus(user)}
                        disabled={isSelf || isUpdating}
                        title={isSelf ? 'You cannot suspend your own account' : `Set account ${user.status === 'Active' ? 'suspended' : 'active'}`}
                        aria-label={isSelf ? 'Current admin account cannot be suspended' : `Toggle ${user.name} account status`}
                        className="rounded-xl p-1 transition hover:bg-[#eef7e8] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {user.status === 'Active' ? <ToggleRight className="h-7 w-7 text-[#599b38]"/> : <ToggleLeft className="h-7 w-7 text-slate-400"/>}
                      </button>
                    </div>
                  </div>
                );
              })}
              {!loading && filtered.length === 0 && <p className="py-10 text-center text-xs font-medium text-slate-400">No accounts found.</p>}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#e2edd8] bg-white p-4 shadow-[0_4px_16px_rgba(89,155,56,0.03)]">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#558e38]"><Terminal className="h-4 w-4"/>Recent system activity</h2>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-[#f7fbf4] p-3 font-mono text-[9px] leading-relaxed text-slate-500">
              {logs.map((log, index) => <p key={`${index}-${log}`} className="border-b border-[#e4eddf] pb-1.5 last:border-0">{log}</p>)}
              {logs.length === 0 && <p>No activity recorded.</p>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

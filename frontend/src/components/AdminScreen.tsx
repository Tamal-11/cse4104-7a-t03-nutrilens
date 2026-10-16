import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Activity, ArrowUpRight, Check, Clock3, Image as ImageIcon, KeyRound, Plus, X,
  RefreshCw, ScanLine, Search, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import type {AdminStats, ScreenType, UserAccount} from '../types';
import {api} from '../services/api';
import {NutriLensLogo} from './NutriLensLogo';

export type AdminUpload = {
  imageId: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  imageUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  foodName: string | null;
};

type AdminTab = 'users' | 'uploads' | 'ai';

export default function AdminScreen({onNavigate}: {onNavigate: (screen: ScreenType) => void}) {
  const [currentUserId, setCurrentUserId] = useState('');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [apiKeys, setApiKeys] = useState<string[]>(['']);
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [savedKeyCount, setSavedKeyCount] = useState(0);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [updatingId, setUpdatingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, uploadsResult, aiSettings] = await Promise.all([
        api.adminOverview(), api.adminUploads(), api.adminAiSettings(),
      ]);
      setCurrentUserId(overview.data.currentUserId);
      setUsers(overview.data.users);
      setStats(overview.data.stats);
      setLogs(overview.data.logs);
      setUploads(uploadsResult.data);
      setKeyConfigured(aiSettings.data.configured);
      setSavedKeyCount(aiSettings.data.keyCount);
      setApiKeys(Array.from({length: Math.max(aiSettings.data.keyCount, 1)}, () => ''));
      setModel(aiSettings.data.model);
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
      setUsers((current) => current.map((item) => item.id === user.id ? {...response.data, scansCount: item.scansCount} : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this account.');
    } finally {
      setUpdatingId('');
    }
  };

  const filteredUsers = useMemo(() => users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [search, users]);
  const filteredUploads = useMemo(() => uploads.filter((upload) =>
    `${upload.fileName} ${upload.userName} ${upload.userEmail} ${upload.foodName || ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [search, uploads]);

  const saveAiSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKeys.length || apiKeys.some((key) => key.trim().length < 10)) {
      setError('Enter at least one valid Gemini API key and remove any empty fields.');
      return;
    }
    setSavingKey(true);
    setError('');
    setNotice('');
    try {
      const result = await api.updateAdminAiSettings(apiKeys.map((key) => key.trim()), model.trim());
      setKeyConfigured(result.data.configured);
      setSavedKeyCount(result.data.keyCount);
      setModel(result.data.model);
      setApiKeys(Array.from({length: Math.max(result.data.keyCount, 1)}, () => ''));
      setNotice(`Saved ${result.data.keyCount} Gemini API key${result.data.keyCount === 1 ? '' : 's'} on the server.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save Gemini settings.');
    } finally {
      setSavingKey(false);
    }
  };

  const cards = stats ? [
    {label: 'Registered users', value: stats.totalUsers, icon: Users},
    {label: 'Food scans', value: stats.totalScans, icon: ScanLine},
    {label: 'Active today', value: stats.activeUsers24h, icon: Activity},
    {label: 'Uploaded images', value: uploads.length, icon: ImageIcon},
  ] : [];

  return (
    <div className="admin-shell h-full overflow-y-auto bg-[#f4f7f1] text-slate-800">
      <div className="mx-auto min-h-full w-full max-w-[1160px] px-4 pb-10 pt-4 sm:px-7 lg:px-9">
        <header className="flex items-center justify-between border-b border-[#dce5d6] pb-4">
          <NutriLensLogo size={36} showText textSizeClass="text-base font-extrabold text-slate-900" className="flex-row gap-2"/>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#cfdfc7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#447532] sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[#64a448]"/>Admin workspace</span>
            <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh admin data" className="rounded-lg border border-[#dce5d6] bg-white p-2.5 text-slate-500 transition hover:text-[#427429] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/></button>
            <button type="button" onClick={() => onNavigate('profile')} className="rounded-lg border border-[#dce5d6] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38]">Exit</button>
          </div>
        </header>

        <main className="pt-7">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#52833c]"><ShieldCheck className="h-3.5 w-3.5"/>NutriLens · Administration</p>
              <h1 className="text-2xl font-black tracking-tight text-[#20271e] sm:text-[30px]">Admin dashboard</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">Manage accounts, inspect food uploads and configure the analysis provider.</p>
            </div>
            <p className="text-xs text-slate-500">{new Intl.DateTimeFormat(undefined, {dateStyle: 'full'}).format(new Date())}</p>
          </section>

          {error && <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}
          {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-lg border border-[#cbdcc2] bg-white px-4 py-3 text-sm font-medium text-[#427429]"><Check className="h-4 w-4"/>{notice}</p>}

          <section aria-label="Account and usage summary" className="mt-6 grid grid-cols-2 border-y border-[#dce5d6] bg-white sm:grid-cols-4">
            {cards.map(({label, value, icon: Icon}, index) => (
              <div key={label} className={`min-h-[98px] px-4 py-4 sm:px-5 ${index > 0 ? 'border-l border-[#e6ece2]' : ''} ${index > 1 ? 'border-t sm:border-t-0' : ''}`}>
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-slate-500">{label}</span><Icon className="h-4 w-4 text-[#629348]"/></div>
                <strong className="mt-2 block text-2xl font-bold tracking-tight text-[#243122]">{value}</strong>
              </div>
            ))}
          </section>

          <section className="mt-7">
            <div role="tablist" aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b border-[#dce5d6]">
              {([
                {id: 'users', label: 'Users', count: users.length, icon: Users},
                {id: 'uploads', label: 'Food uploads', count: uploads.length, icon: ImageIcon},
                {id: 'ai', label: 'AI settings', count: null, icon: Sparkles},
              ] as const).map(({id, label, count, icon: Icon}) => (
                <button key={id} id={`admin-tab-${id}`} role="tab" aria-selected={activeTab === id} aria-controls={`admin-panel-${id}`} onClick={() => { setActiveTab(id); setSearch(''); setError(''); setNotice(''); }} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#599b38] sm:px-4 ${activeTab === id ? 'border-[#568e3b] text-[#416f2d]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Icon className="h-4 w-4"/>{label}{count !== null && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === id ? 'bg-[#e9f1e4] text-[#416f2d]' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}</button>
              ))}
            </div>

            {activeTab === 'users' && <div id="admin-panel-users" role="tabpanel" aria-labelledby="admin-tab-users" className="pt-5">
              <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center"><div><h2 className="text-base font-bold text-[#20271e]">User accounts</h2><p className="mt-1 text-xs text-slate-500">Review account activity and access.</p></div><label className="relative block sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search users" placeholder="Search name or email" className="w-full rounded-lg border border-[#dce5d6] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#63944c] focus:ring-2 focus:ring-[#63944c]/20"/></label></div>
              <div className="overflow-x-auto border-y border-[#dce5d6] bg-white"><table className="w-full min-w-[620px] text-left"><thead className="bg-[#f8faf6] text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Uploads</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Access</th></tr></thead><tbody className="divide-y divide-[#e8eee4]">{filteredUsers.map((user) => {const isSelf = user.id === currentUserId; return <tr key={user.id} className="hover:bg-[#fbfcfa]"><td className="px-4 py-3"><p className="text-sm font-semibold text-slate-800">{user.name}{isSelf && <span className="ml-2 text-[10px] font-medium text-slate-400">You</span>}</p><p className="mt-0.5 text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3 text-xs text-slate-600">{user.role}</td><td className="px-4 py-3 text-xs text-slate-600">{new Date(user.joinedDate).toLocaleDateString()}</td><td className="px-4 py-3 text-xs text-slate-600">{user.scansCount}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === 'Active' ? 'text-[#478033]' : 'text-rose-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-[#68a64d]' : 'bg-rose-500'}`}/>{user.status}</span></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => void toggleStatus(user)} disabled={isSelf || updatingId === user.id} className="rounded-md border border-[#dce5d6] px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#acc59d] hover:text-[#427429] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38] disabled:cursor-not-allowed disabled:opacity-40">{user.status === 'Active' ? 'Suspend' : 'Restore'}</button></td></tr>;})}</tbody></table>{!loading && filteredUsers.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-500">No matching accounts found.</p>}</div>
            </div>}

            {activeTab === 'uploads' && <div id="admin-panel-uploads" role="tabpanel" aria-labelledby="admin-tab-uploads" className="pt-5">
              <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center"><div><h2 className="text-base font-bold text-[#20271e]">Uploaded food images</h2><p className="mt-1 text-xs text-slate-500">Images submitted for nutrition analysis, with their account and upload time.</p></div><label className="relative block sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search uploads" placeholder="Search images or users" className="w-full rounded-lg border border-[#dce5d6] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#63944c] focus:ring-2 focus:ring-[#63944c]/20"/></label></div>
              {filteredUploads.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredUploads.map((upload) => <article key={upload.imageId} className="overflow-hidden border border-[#dce5d6] bg-white"><a href={api.adminImageUrl(upload.imageId)} target="_blank" rel="noreferrer" className="group relative block aspect-[4/3] overflow-hidden bg-[#eef3ea] focus-visible:outline-2 focus-visible:outline-[#599b38]"><img src={api.adminImageUrl(upload.imageId)} alt={`Upload ${upload.fileName} by ${upload.userName}`} loading="lazy" className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"/><span className="absolute right-2 top-2 rounded bg-white/95 p-2 text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus:opacity-100"><ArrowUpRight className="h-4 w-4"/></span></a><div className="p-3.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{upload.foodName || upload.fileName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{upload.userName} · {upload.userEmail}</p></div><span className="shrink-0 text-[10px] text-slate-400">{(upload.sizeBytes / 1024 / 1024).toFixed(1)} MB</span></div><p className="mt-3 flex items-center gap-1.5 border-t border-[#edf1ea] pt-2.5 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5"/>{new Date(upload.createdAt).toLocaleString()}</p></div></article>)}</div> : <div className="border-y border-[#dce5d6] bg-white px-4 py-14 text-center"><ImageIcon className="mx-auto h-7 w-7 text-[#739560]"/><p className="mt-3 text-sm font-semibold text-slate-700">{loading ? 'Loading uploaded images…' : search ? 'No matching uploads' : 'No food images uploaded yet'}</p><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">{search ? 'Try a different image name or account.' : 'Images appear here after a user uploads them for analysis.'}</p></div>}
            </div>}

            {activeTab === 'ai' && <div id="admin-panel-ai" role="tabpanel" aria-labelledby="admin-tab-ai" className="max-w-2xl pt-5">
              <div className="border-y border-[#dce5d6] bg-white p-5 sm:p-6"><div className="flex items-start gap-3 border-b border-[#e8eee4] pb-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#edf4e9] text-[#527f3d]"><KeyRound className="h-5 w-5"/></span><div><h2 className="text-base font-bold text-[#20271e]">Gemini API settings</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Add multiple keys for the same model. Each analysis request rotates to the next key.</p></div></div>
                <div className="flex items-center justify-between gap-3 py-4"><div><p className="text-xs font-semibold text-slate-700">API key status</p><p className="mt-1 text-[11px] text-slate-500">{keyConfigured ? `${savedKeyCount} key${savedKeyCount === 1 ? '' : 's'} saved; credentials stay hidden.` : 'No keys saved yet.'}</p></div><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${keyConfigured ? 'text-[#478033]' : 'text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${keyConfigured ? 'bg-[#68a64d]' : 'bg-amber-500'}`}/>{keyConfigured ? 'Configured' : 'Not configured'}</span></div>
                <form onSubmit={(event) => void saveAiSettings(event)} className="space-y-4"><div><label htmlFor="gemini-model" className="mb-1.5 block text-xs font-semibold text-slate-700">Gemini model</label><input id="gemini-model" value={model} onChange={(event) => setModel(event.target.value)} maxLength={100} required className="w-full rounded-lg border border-[#dce5d6] px-3 py-2.5 text-sm outline-none focus:border-[#63944c] focus:ring-2 focus:ring-[#63944c]/20" placeholder="gemini-2.5-flash"/></div>
                  <div className="space-y-3"><div><p className="text-xs font-semibold text-slate-700">API keys</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Saved key values cannot be viewed. Enter the complete key list to replace the active pool.</p></div>{apiKeys.map((value, index) => <div key={index} className="flex items-end gap-2"><div className="min-w-0 flex-1"><label htmlFor={`gemini-api-key-${index}`} className="mb-1.5 block text-[11px] font-medium text-slate-600">Gemini API key {index + 1}</label><input id={`gemini-api-key-${index}`} type="password" autoComplete="new-password" value={value} onChange={(event) => setApiKeys((current) => current.map((key, keyIndex) => keyIndex === index ? event.target.value : key))} minLength={10} maxLength={500} required placeholder="Paste Gemini API key" className="w-full rounded-lg border border-[#dce5d6] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#63944c] focus:ring-2 focus:ring-[#63944c]/20"/></div>{apiKeys.length > 1 && <button type="button" aria-label={`Remove API key ${index + 1}`} onClick={() => setApiKeys((current) => current.filter((_, keyIndex) => keyIndex !== index))} className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#dce5d6] text-slate-500 hover:border-rose-200 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38]"><X className="h-4 w-4"/></button>}</div>)}<button type="button" onClick={() => setApiKeys((current) => [...current, ''])} disabled={apiKeys.length >= 20} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cddbc6] px-3 py-2 text-xs font-semibold text-[#416f2d] hover:bg-[#f5f8f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38] disabled:opacity-50"><Plus className="h-4 w-4"/>Add API key</button></div>
                  <div className="flex flex-col gap-2 border-t border-[#e8eee4] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-[#63874f]"/>Only administrators can update this setting.</p><button type="submit" disabled={savingKey || apiKeys.some((key) => key.trim().length < 10) || !model.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#416f2d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#345b24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#599b38] disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-3.5 w-3.5"/>{savingKey ? 'Saving settings…' : 'Save AI settings'}</button></div></form>
              </div>
            </div>}
          </section>

          {activeTab === 'users' && <section className="mt-8 max-w-3xl"><h2 className="text-xs font-bold text-slate-600">Recent activity</h2><div className="mt-3 border-l border-[#cfdcc8] pl-4">{logs.slice(0, 5).map((log, index) => <p key={`${index}-${log}`} className="relative border-b border-[#e5ebe1] py-2.5 text-xs leading-relaxed text-slate-500 last:border-0"><span className="absolute -left-[21px] top-3 h-2 w-2 rounded-full border-2 border-[#f4f7f1] bg-[#77a45f]"/>{log}</p>)}{logs.length === 0 && <p className="py-2 text-xs text-slate-500">No recent activity.</p>}</div></section>}
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, Users, Layers, Activity, Cpu, Sparkles, 
  Search, ToggleLeft, ToggleRight, CheckCircle, RefreshCw, Terminal, Clock 
} from 'lucide-react';
import { UserAccount, AdminStats } from '../types';
import { MOCK_USERS, MOCK_ADMIN_STATS } from '../data';

interface AdminScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AdminScreen({ onNavigate }: AdminScreenProps) {
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [stats, setStats] = useState<AdminStats>(MOCK_ADMIN_STATS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real-time server terminal logs generator
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Kernel boot sequence completed successfully at port 3000.',
    '[SYSTEM] Express dynamic asset rendering middleware mounted.',
    '[AI_MODEL] Gemini-3.5-Flash ready for image multi-label parsing.',
    '[SECURITY] CORS filters validated. Ready for remote mobile queries.'
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const messages = [
        `[INFO] Query incoming from device ID mobile_client_${Math.floor(Math.random() * 900) + 100}`,
        '[AI_MODEL] Pre-loaded image parsed. Saliency values normalized.',
        `[DATABASE] Appended scan log record #${Math.floor(Math.random() * 5000) + 1200} successfully in 4ms`,
        '[INFO] Cleaned stale user cache indexes.',
        `[SYSTEM] Performance check: CPU standard load is ${Math.floor(Math.random() * 15) + 5}%`,
        `[AI_MODEL] vision-model accuracy validated at 96.4%`
      ];
      
      const newLog = messages[Math.floor(Math.random() * messages.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [`[${timestamp}] ${newLog}`, ...prev.slice(0, 15)]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handleStatsRefresh = () => {
    setStats(prev => ({
      ...prev,
      totalScans: prev.totalScans + 1,
      activeUsers24h: prev.activeUsers24h + Math.floor(Math.random() * 3) - 1,
      averageResponseTime: Number((prev.averageResponseTime + (Math.random() * 0.4 - 0.2)).toFixed(2))
    }));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 pb-6">
        {/* Admin Title Banner */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-black tracking-wide uppercase text-purple-200">
            NutriLens Admin Hyper-Console
          </h2>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Status
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* Core Administrative KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Registered Users</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-100">{users.length}</span>
              <span className="text-[9px] text-emerald-400 font-bold">+2 today</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total AI Scans</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-100">{stats.totalScans}</span>
              <span className="text-[9px] text-purple-400 font-bold">96% hit</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vision Latency</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-100">{stats.averageResponseTime}s</span>
              <span className="text-[9px] text-slate-500 font-medium">avg 1.8s</span>
            </div>
          </div>
        </div>

        {/* Real-time Hardware Metrics Grid */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" /> GPU & Engine Analytics
            </h4>
            <button 
              onClick={handleStatsRefresh} 
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh engine cache"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span>Model Load (Accuracy)</span>
                <span className="text-emerald-400 font-bold">{stats.modelAccuracy}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[96.4%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span>GPU Core Allocation</span>
                <span className="text-purple-400 font-bold">42.8%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[43%] animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* User Administration Block */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-purple-400" /> User Accounts (NUBTK Members)
            </h3>
            
            {/* Search filter bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search accounts..."
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg outline-none text-xs text-slate-200 placeholder-slate-600 focus:border-purple-500 w-full"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredUsers.map((item) => (
              <div 
                key={item.id}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100">{item.name}</span>
                    <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded ${
                      item.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-bold">{item.scansCount} scans completed</span>
                    <span className={`text-[9px] font-bold ${
                      item.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(item.id)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                    title={`Change to ${item.status === 'Active' ? 'Suspended' : 'Active'}`}
                  >
                    {item.status === 'Active' ? (
                      <ToggleRight className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time App Terminal Log files */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-purple-400 animate-pulse" /> Live System Logs
          </h4>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg h-32 overflow-y-auto font-mono text-[9.5px] text-slate-300 leading-normal space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2.5 border-b border-slate-800/20 pb-0.5">
                <span className="text-slate-500 shrink-0 select-none">❯</span>
                <span className={log.includes('[SYSTEM]') ? 'text-teal-400' : log.includes('[AI_MODEL]') ? ';text-purple-300 font-bold' : log.includes('[SECURITY]') ? 'text-amber-400' : 'text-slate-350'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}

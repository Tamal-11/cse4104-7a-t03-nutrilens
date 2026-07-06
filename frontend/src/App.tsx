import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Compass } from 'lucide-react';

// Import our custom interactive screens
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardScreen from './components/DashboardScreen';
import AIInterfaceScreen from './components/AIInterfaceScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminScreen from './components/AdminScreen';

// Types & Data Defaults
import { ScreenType, UserProfile, FoodAnalysis } from './types';
import { INITIAL_USER } from './data';
import {api, mapAnalysis, mapProfile} from './services/api';
import {usePwaInstall} from './hooks/usePwaInstall';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER);
  const [historyList, setHistoryList] = useState<FoodAnalysis[]>([]);
  const [selectedScanItem, setSelectedScanItem] = useState<FoodAnalysis | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const {canInstall, installed, install} = usePwaInstall();

  const loadAccountData = async () => {
    const [profile, history] = await Promise.all([api.profile(), api.history()]);
    setCurrentUser(mapProfile(profile.data));
    const summaries = await Promise.all(
      history.data.map(async (item) => {
        try {
          return mapAnalysis((await api.analysis(item.analysisId)).data);
        } catch {
          return mapAnalysis(item);
        }
      }),
    );
    setHistoryList(summaries);
  };

  useEffect(() => {
    api.session()
      .then(async () => {
        await loadAccountData();
        setCurrentScreen('ai');
      })
      .catch(() => undefined);
  }, []);

  // Status handler triggers
  const handleLoginSuccess = async (userObj: UserProfile) => {
    setCurrentUser(userObj);
    await loadAccountData();
    setShowInstallPrompt(true);
  };

  const handleRegisterSuccess = async (userObj: UserProfile) => {
    setCurrentUser(userObj);
    await loadAccountData();
    setShowInstallPrompt(true);
  };

  const handleUpdateUserProfile = (updatedProfile: UserProfile) => {
    setCurrentUser(updatedProfile);
  };

  const handleAddHistoryScan = (newScan: FoodAnalysis) => {
    setHistoryList(prev => [newScan, ...prev]);
  };

  const handleSignOut = async () => {
    await api.signOut().catch(() => undefined);
    setHistoryList([]);
    setCurrentScreen('home');
  };

  const handleSelectHistoryItem = (scanItem: FoodAnalysis) => {
    setSelectedScanItem(scanItem);
  };

  const handleTriggerNewScanFromMenu = () => {
    setSelectedScanItem(null); // Clear selected item to prompt uploader view
    setCurrentScreen('ai');
  };

  return (
    <div className="min-h-screen bg-[#f2f8ed] flex flex-col font-sans select-none overflow-hidden antialiased">
      
      {/* Main App Container: Fullscreen across PC and responsive on mobile */}
      <div className="w-full h-screen relative flex flex-col overflow-hidden bg-[#f2f8ed] z-10">

        {/* SCREEN SWITCHER CORE VIEWPORT CONTENT */}
        <div className="flex-1 w-full bg-[#f2f8ed] overflow-hidden relative text-slate-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.28 }}
              className="w-full h-full"
            >
              {currentScreen === 'home' && (
                <HomeScreen onNavigate={setCurrentScreen} />
              )}
              {currentScreen === 'login' && (
                <LoginScreen onNavigate={setCurrentScreen} onLoginSuccess={handleLoginSuccess} />
              )}
              {currentScreen === 'register' && (
                <RegisterScreen onNavigate={setCurrentScreen} onRegisterSuccess={handleRegisterSuccess} />
              )}
              {currentScreen === 'dashboard' && (
                <DashboardScreen 
                  user={currentUser} 
                  history={historyList} 
                  onNavigate={setCurrentScreen} 
                  onSelectScan={handleSelectHistoryItem}
                />
              )}
              {currentScreen === 'ai' && (
                <AIInterfaceScreen 
                  onNavigate={setCurrentScreen} 
                  onAddHistory={handleAddHistoryScan}
                  selectedScan={selectedScanItem}
                />
              )}
              {currentScreen === 'profile' && (
                <ProfileScreen 
                  user={currentUser} 
                  onUpdateUser={handleUpdateUserProfile} 
                  onNavigate={setCurrentScreen} 
                  onSignOut={handleSignOut}
                  canInstall={canInstall}
                  installed={installed}
                  onInstall={install}
                />
              )}
              {currentScreen === 'admin' && (
                <AdminScreen onNavigate={setCurrentScreen} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom device navigation rail - bounded internally for PC */}
        {currentScreen !== 'home' && currentScreen !== 'login' && currentScreen !== 'register' && (
          <nav className="w-full bg-white border-t border-slate-100 px-6 shrink-0 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] text-slate-850 h-16 flex items-center justify-center">
            <div className="max-w-md w-full grid grid-cols-3 items-center h-full">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                aria-label="Dashboard"
                className={`justify-self-center flex items-center justify-center cursor-pointer transition ${
                  currentScreen === 'dashboard' ? 'text-[#599b38] font-black' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Compass className="w-6 h-6" />
              </button>

              <button
                onClick={handleTriggerNewScanFromMenu}
                aria-label="AI Lens"
                className="relative -top-2 justify-self-center flex items-center justify-center cursor-pointer transition select-none"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  currentScreen === 'ai' 
                    ? 'bg-gradient-to-tr from-[#599b38] to-[#7ac751] text-white shadow-[#599b38]/30 scale-105' 
                    : 'bg-[#1c221a] text-[#daefcc] hover:bg-black shadow-neutral-900/20'
                }`}>
                  <Sparkles className={`w-6.5 h-6.5 ${currentScreen === 'ai' ? 'animate-pulse' : ''}`} />
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('profile')}
                aria-label="Profile"
                className={`justify-self-center flex items-center justify-center cursor-pointer transition ${
                  currentScreen === 'profile' ? 'text-[#599b38] font-black' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-6 h-6" />
              </button>
            </div>
          </nav>
        )}

      </div>
      {showInstallPrompt && canInstall && (
        <div className="fixed inset-x-4 bottom-20 z-[100] mx-auto max-w-md rounded-2xl border border-[#dcebd3] bg-white p-4 shadow-2xl">
          <p className="text-sm font-extrabold text-slate-900">Install NutriLens</p>
          <p className="mt-1 text-xs text-slate-500">Add the app to your device for faster access and offline startup.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setShowInstallPrompt(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600">Not now</button>
            <button onClick={async () => { await install(); setShowInstallPrompt(false); }} className="flex-1 rounded-xl bg-[#599b38] py-2 text-xs font-bold text-white">Install app</button>
          </div>
        </div>
      )}
    </div>
  );
}

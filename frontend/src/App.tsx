import { useEffect, useRef, useState } from 'react';
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
import { EMPTY_USER } from './data';
import {api, mapAnalysis, mapProfile} from './services/api';
import {usePwaInstall} from './hooks/usePwaInstall';

const SCREEN_PATHS: Record<ScreenType, string> = {
  home: '/', login: '/login', register: '/register', dashboard: '/dashboard',
  ai: '/ai-lens', profile: '/profile', admin: '/admin',
};
const PATH_SCREENS = Object.fromEntries(Object.entries(SCREEN_PATHS).map(([screen, path]) => [path, screen])) as Record<string, ScreenType>;
const isProtectedScreen = (screen: ScreenType) => !['home', 'login', 'register'].includes(screen);
const screenFromPath = (path: string) => PATH_SCREENS[path] || 'home';

const isProfileComplete = (user: UserProfile) =>
  Boolean(user.name.trim()) && user.age >= 13 && user.age <= 120 &&
  user.height >= 50 && user.height <= 260 && user.weight >= 20 && user.weight <= 500;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const requested = screenFromPath(window.location.pathname);
    return isProtectedScreen(requested) ? 'home' : requested;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_USER);
  const [historyList, setHistoryList] = useState<FoodAnalysis[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedScanItem, setSelectedScanItem] = useState<FoodAnalysis | null>(null);
  const selectedScanItemRef = useRef<FoodAnalysis | null>(null);
  const authenticatedRef = useRef(false);
  const isAdminRef = useRef(false);
  const profileCompleteRef = useRef(false);
  const [profileGateNotice, setProfileGateNotice] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const {canInstall, installed, install} = usePwaInstall();

  const loadAccountData = async () => {
    const [profile, history] = await Promise.all([api.profile(), api.history()]);
    const loadedUser = mapProfile(profile.data);
    profileCompleteRef.current = isProfileComplete(loadedUser);
    setCurrentUser(loadedUser);
    setHistoryList(history.data.map(mapAnalysis));
    return loadedUser;
  };

  useEffect(() => {
    api.session()
      .then(async ({user: authUser}) => {
        const loadedUser = await loadAccountData();
        const signedInUser = {...loadedUser, isAdmin: loadedUser.isAdmin || authUser.role?.toLowerCase() === 'admin'};
        authenticatedRef.current = true;
        isAdminRef.current = Boolean(signedInUser.isAdmin);
        setIsAuthenticated(true);
        setCurrentUser(signedInUser);
        const requested = screenFromPath(window.location.pathname);
        if (requested === 'admin' && !signedInUser.isAdmin) {
          window.history.replaceState({}, '', SCREEN_PATHS.dashboard);
          setCurrentScreen('dashboard');
          return;
        }
        const destination = isProtectedScreen(requested)
          ? requested
          : isProfileComplete(signedInUser) ? 'dashboard' : 'profile';
        if (destination !== 'admin' && !isProfileComplete(signedInUser)) {
          setProfileGateNotice('Complete your display name, age, height, and weight before scanning food.');
        }
        window.history.replaceState({}, '', SCREEN_PATHS[destination]);
        setCurrentScreen(destination);
      })
      .catch(() => {
        const requested = screenFromPath(window.location.pathname);
        const destination = isProtectedScreen(requested) ? 'login' : requested;
        window.history.replaceState({}, '', SCREEN_PATHS[destination]);
        setCurrentScreen(destination);
      });

    const handlePopState = () => {
      const requested = screenFromPath(window.location.pathname);
      if (isProtectedScreen(requested) && !authenticatedRef.current) {
        window.history.replaceState({}, '', SCREEN_PATHS.login);
        setCurrentScreen('login');
        return;
      }
      if (requested === 'admin' && !isAdminRef.current) {
        window.history.replaceState({}, '', SCREEN_PATHS.dashboard);
        setCurrentScreen(authenticatedRef.current ? 'dashboard' : 'login');
        return;
      }
      setCurrentScreen(requested);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (screen: ScreenType) => {
    if (isProtectedScreen(screen) && !authenticatedRef.current) {
      window.history.pushState({}, '', SCREEN_PATHS.login);
      setCurrentScreen('login');
      return;
    }
    if (screen === 'admin' && !isAdminRef.current) {
      window.history.pushState({}, '', SCREEN_PATHS.dashboard);
      setCurrentScreen('dashboard');
      return;
    }
    if (screen === 'ai' && !selectedScanItemRef.current && !profileCompleteRef.current) {
      setProfileGateNotice('Complete your display name, age, height, and weight before scanning food.');
      window.history.pushState({}, '', SCREEN_PATHS.profile);
      setCurrentScreen('profile');
      return;
    }
    if (screen === 'profile' && isProfileComplete(currentUser)) setProfileGateNotice('');
    window.history.pushState({}, '', SCREEN_PATHS[screen]);
    setCurrentScreen(screen);
  };

  // Status handler triggers
  const handleLoginSuccess = async () => {
    const loadedUser = await loadAccountData();
    authenticatedRef.current = true;
    isAdminRef.current = Boolean(loadedUser.isAdmin);
    setIsAuthenticated(true);
    if (!isProfileComplete(loadedUser)) {
      setProfileGateNotice('Complete your display name, age, height, and weight before scanning food.');
      window.history.replaceState({}, '', SCREEN_PATHS.profile);
      setCurrentScreen('profile');
    }
    setShowInstallPrompt(true);
  };

  const handleRegisterSuccess = async () => {
    const loadedUser = await loadAccountData();
    authenticatedRef.current = true;
    isAdminRef.current = Boolean(loadedUser.isAdmin);
    setIsAuthenticated(true);
    if (!isProfileComplete(loadedUser)) {
      setProfileGateNotice('Complete your display name, age, height, and weight before scanning food.');
      window.history.replaceState({}, '', SCREEN_PATHS.profile);
      setCurrentScreen('profile');
    }
    setShowInstallPrompt(true);
  };

  const handleUpdateUserProfile = (updatedProfile: UserProfile) => {
    profileCompleteRef.current = isProfileComplete(updatedProfile);
    setCurrentUser(updatedProfile);
    if (isProfileComplete(updatedProfile)) setProfileGateNotice('');
  };

  const handleAddHistoryScan = (newScan: FoodAnalysis) => {
    setHistoryList(prev => [newScan, ...prev]);
  };

  const handleSignOut = async () => {
    await api.signOut().catch(() => undefined);
    authenticatedRef.current = false;
    isAdminRef.current = false;
    profileCompleteRef.current = false;
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_USER);
    setHistoryList([]);
    window.history.replaceState({}, '', SCREEN_PATHS.home);
    setCurrentScreen('home');
  };

  const handleSelectHistoryItem = (scanItem: FoodAnalysis) => {
    selectedScanItemRef.current = scanItem;
    setSelectedScanItem(scanItem);
  };

  const handleTriggerNewScanFromMenu = () => {
    selectedScanItemRef.current = null;
    setSelectedScanItem(null); // Clear selected item to prompt uploader view
    handleNavigate('ai');
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
                <HomeScreen onNavigate={handleNavigate} />
              )}
              {currentScreen === 'login' && (
                <LoginScreen onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
              )}
              {currentScreen === 'register' && (
                <RegisterScreen onNavigate={handleNavigate} onRegisterSuccess={handleRegisterSuccess} />
              )}
              {isAuthenticated && currentScreen === 'dashboard' && (
                <DashboardScreen 
                  user={currentUser} 
                  history={historyList} 
                  onNavigate={handleNavigate}
                  onSelectScan={handleSelectHistoryItem}
                />
              )}
              {isAuthenticated && currentScreen === 'ai' && (
                <AIInterfaceScreen 
                  onNavigate={handleNavigate}
                  onAddHistory={handleAddHistoryScan}
                  selectedScan={selectedScanItem}
                />
              )}
              {isAuthenticated && currentScreen === 'profile' && (
                <ProfileScreen 
                  user={currentUser} 
                  onUpdateUser={handleUpdateUserProfile} 
                  onNavigate={handleNavigate}
                  onSignOut={handleSignOut}
                  canInstall={canInstall}
                  installed={installed}
                  onInstall={install}
                  scanGateNotice={profileGateNotice}
                />
              )}
              {isAuthenticated && currentUser.isAdmin && currentScreen === 'admin' && (
                <AdminScreen onNavigate={handleNavigate} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom device navigation rail - bounded internally for PC */}
        {isAuthenticated && currentScreen !== 'home' && currentScreen !== 'login' && currentScreen !== 'register' && currentScreen !== 'admin' && (
          <nav className="w-full bg-white border-t border-slate-100 px-6 shrink-0 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] text-slate-850 h-16 flex items-center justify-center">
            <div className="max-w-md w-full grid grid-cols-3 items-center h-full">
              <button
                onClick={() => handleNavigate('dashboard')}
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
                onClick={() => handleNavigate('profile')}
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

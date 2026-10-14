import React, { useState } from 'react';
import {
  Trash2,
  Shield,
  Home,
  Volume2,
  VolumeX,
  Download,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  User,
  KeyRound,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import { soundAlert } from '../utils/audioAlarm';

interface HeaderProps {
  currentRole: 'resident' | 'kagawad';
  onRoleChange: (role: 'resident' | 'kagawad') => void;
  pendingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  pendingCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [isStandaloneOrApk, setIsStandaloneOrApk] = useState(false);
  const [activeAccountLabel, setActiveAccountLabel] = useState<string>(() => {
    try {
      return localStorage.getItem('draw_account_label') || 'Barangay Kagawad';
    } catch {
      return 'Barangay Kagawad';
    }
  });

  React.useEffect(() => {
    const detectStandalone = () => {
      const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isFromAndroidApp =
        typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
      const urlParams = new URLSearchParams(window.location.search);
      const isUrlTagged =
        urlParams.get('source') === 'pwa' ||
        urlParams.get('source') === 'apk' ||
        urlParams.get('mode') === 'standalone' ||
        urlParams.get('app') === 'true' ||
        urlParams.get('apk') === 'true';
      const ua = navigator.userAgent || '';
      const isAndroidWebView = /wv|Android.*Version\/[\d.]+.*Chrome\/[\d.]+/i.test(ua);
      const isApp =
        isStandaloneDisplay || isIOSStandalone || isFromAndroidApp || isUrlTagged || isAndroidWebView;
      setIsStandaloneOrApk(isApp);
    };
    detectStandalone();
    const mql = window.matchMedia('(display-mode: standalone)');
    try {
      mql.addEventListener('change', detectStandalone);
      return () => mql.removeEventListener('change', detectStandalone);
    } catch {
      mql.addListener?.(detectStandalone);
      return () => mql.removeListener?.(detectStandalone);
    }
  }, []);

  React.useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    setDownloadStarted(false);
    setShowInstallPrompt(true);
  };

  const handlePromptPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundAlert.enabled = next;
    if (next) soundAlert.playChime();
  };

  const handleKagawadButtonClick = () => {
    if (currentRole === 'kagawad') {
      return;
    }
    const isAuth = localStorage.getItem('draw_kagawad_auth') === 'true';
    if (isAuth) {
      onRoleChange('kagawad');
      soundAlert.playChime();
      return;
    }
    setUsername('');
    setPassword('');
    setLoginError('');
    setShowPassword(false);
    setShowLoginModal(true);
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetOldPass, setResetOldPass] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Paki-lagay ang iyong username at password.');
      return;
    }

    const currentKagawadPass =
      localStorage.getItem('draw_kagawad_custom_password') || 'Kagawad@Cavite2026#Brgy41!';
    const currentBackupPass =
      localStorage.getItem('draw_backup_custom_password') || 'DrawAdmin#2026$Secure!';

    const isOfficialKagawad =
      (cleanUser === 'kagawad41' || cleanUser === 'kagawad' || cleanUser === 'kagawad41_admin') &&
      (cleanPass === currentKagawadPass || cleanPass === 'Kagawad@Cavite2026#Brgy41!');

    const isBackupAccount =
      (cleanUser === 'admin_draw' || cleanUser === 'admin' || cleanUser === 'admin41') &&
      (cleanPass === currentBackupPass || cleanPass === 'DrawAdmin#2026$Secure!');

    if (isOfficialKagawad || isBackupAccount) {
      const label = isOfficialKagawad
        ? 'Kagawad (Barangay 41)'
        : 'Backup Admin (Research Team)';
      localStorage.setItem('draw_kagawad_auth', 'true');
      localStorage.setItem('draw_account_label', label);
      setActiveAccountLabel(label);
      onRoleChange('kagawad');
      setShowLoginModal(false);
      setLoginError('');
      soundAlert.playChime();
    } else {
      setLoginError('Maling username o password. Pakisubukan muli.');
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const currentKagawadPass =
      localStorage.getItem('draw_kagawad_custom_password') || 'Kagawad@Cavite2026#Brgy41!';
    const currentBackupPass =
      localStorage.getItem('draw_backup_custom_password') || 'DrawAdmin#2026$Secure!';

    const isOldPassCorrect =
      resetOldPass === currentKagawadPass ||
      resetOldPass === currentBackupPass ||
      resetOldPass === 'Kagawad@Cavite2026#Brgy41!' ||
      resetOldPass === 'drawcavite2026';

    if (!isOldPassCorrect) {
      setResetError('Mali ang iyong kasalukuyang (lumang) password.');
      return;
    }

    if (resetNewPass.length < 8) {
      setResetError('Ang bagong password ay dapat hindi bababa sa 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(resetNewPass)) {
      setResetError('Dapat may kahit isang malaking titik (uppercase A-Z).');
      return;
    }
    if (!/[a-z]/.test(resetNewPass)) {
      setResetError('Dapat may kahit isang maliit na titik (lowercase a-z).');
      return;
    }
    if (!/[0-9]/.test(resetNewPass)) {
      setResetError('Dapat may kahit isang numero (0-9).');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(resetNewPass)) {
      setResetError('Dapat may kahit isang espesyal na simbolo (tulad ng @, #, $, %, !, *).');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('Hindi nagtutugma ang Bagong Password at ang Kumpirmasyon nito.');
      return;
    }

    localStorage.setItem('draw_kagawad_custom_password', resetNewPass);
    setResetSuccess('Matagumpay na napalitan ang iyong password! Gamitin na ito sa susunod na pag-login.');
    soundAlert.playChime();
    setResetOldPass('');
    setResetNewPass('');
    setResetConfirmPass('');
  };

  const handleLogoutKagawad = () => {
    localStorage.removeItem('draw_kagawad_auth');
    localStorage.removeItem('draw_account_label');
    onRoleChange('resident');
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-[10px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-black text-emerald-400 shrink-0">DRAW:</span>
            <span className="text-slate-300 truncate">
              {currentRole === 'resident'
                ? 'trash collection • Auto-GPS Active • Barangay 41, Cavite City'
                : `${activeAccountLabel} • Barangay 41 Portal (Requirement: Proeba bago ma-resolve)`}
            </span>
          </div>
          {!isStandaloneOrApk && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[10px] sm:text-[11px] transition-all cursor-pointer shadow-xs border border-emerald-500/40"
                title="I-install ang DRAW app sa cellphone"
              >
                <Download className="w-3 h-3 text-emerald-200" />
                <span>📱 I-install sa Phone</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-18">
            {/* Logo and App Title */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-emerald-700/20 shrink-0 bg-emerald-800 border border-emerald-500/40 flex items-center justify-center p-0.5">
                <img src="/icon.svg" alt="DRAW Trash Can Logo" className="w-full h-full object-contain rounded-lg sm:rounded-xl" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                    DRAW
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Brgy 41 Cavite City
                  </span>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-500 font-medium line-clamp-1">
                  trash collection • Barangay 41, Cavite City
                </p>
              </div>
            </div>

            {/* Role Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {currentRole === 'kagawad' && (
                <>
                  <button
                    onClick={toggleSound}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    title={soundEnabled ? 'Alarm Sound: Naka-on' : 'Alarm Sound: Naka-mute'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="hidden md:inline">
                      {soundEnabled ? 'Alarm On' : 'Muted'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setResetError('');
                      setResetSuccess('');
                      setShowResetModal(true);
                    }}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Palitan ang Password gamit ang lumang password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden md:inline">Palitan Password</span>
                  </button>
                  <button
                    onClick={handleLogoutKagawad}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Mag-logout sa Kagawad Portal"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </>
              )}

              {/* Main Role Buttons */}
              <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200">
                <button
                  onClick={() => onRoleChange('resident')}
                  className={`flex items-center gap-1 px-2 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                    currentRole === 'resident'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Residente</span>
                </button>
                <button
                  onClick={handleKagawadButtonClick}
                  className={`flex items-center gap-1 px-2 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all ${
                    currentRole === 'kagawad'
                      ? 'bg-purple-700 text-white shadow-md'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  <span>Kagawad</span>
                  {pendingCount > 0 && (
                    <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-black animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 mx-auto shadow-inner">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 text-center">
              Kagawad & Admin Portal
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-4">
              I-enter ang iyong opisyal na Kagawad o Admin credentials.
            </p>
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ilagay ang username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-2xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ilagay ang password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Itago ang password' : 'Ipakita ang password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-bold text-center">
                  {loginError}
                </div>
              )}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Mag-login sa Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setResetError('');
                    setResetSuccess('');
                    setShowResetModal(true);
                  }}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-bold underline text-center pt-1 transition-colors"
                >
                  Palitan o I-reset ang Password (Gamit ang Lumang Password)
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Bumalik sa Residente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 mx-auto shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              Palitan ang Password
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-4 leading-relaxed">
              Ilagay ang iyong <strong>lumang password</strong> upang makapag-set ng panibagong mas mahigpit na password combination.
            </p>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kasalukuyang (Lumang) Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ilagay ang lumang password"
                  value={resetOldPass}
                  onChange={(e) => setResetOldPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bagong Password (Combination)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Hal. Draw2026#Kagawad!"
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kumpirmahin ang Bagong Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="I-type muli ang bagong password"
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-1 text-slate-600 font-medium">
                <span className="font-bold block text-slate-700">Pamantayan sa Matibay na Password:</span>
                <div className="grid grid-cols-2 gap-1">
                  <span className={resetNewPass.length >= 8 ? 'text-emerald-700 font-bold' : ''}>
                    {resetNewPass.length >= 8 ? '✓' : '•'} 8+ characters
                  </span>
                  <span className={/[A-Z]/.test(resetNewPass) ? 'text-emerald-700 font-bold' : ''}>
                    {/[A-Z]/.test(resetNewPass) ? '✓' : '•'} May Malaking Titik
                  </span>
                  <span className={/[0-9]/.test(resetNewPass) ? 'text-emerald-700 font-bold' : ''}>
                    {/[0-9]/.test(resetNewPass) ? '✓' : '•'} May Numero
                  </span>
                  <span className={/[!@#$%^&*(),.?":{}|<>]/.test(resetNewPass) ? 'text-emerald-700 font-bold' : ''}>
                    {/[!@#$%^&*(),.?":{}|<>]/.test(resetNewPass) ? '✓' : '•'} May Simbolo (@#$!)
                  </span>
                </div>
              </div>
              {resetError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-bold text-center">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold text-center">
                  {resetSuccess}
                </div>
              )}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>I-save ang Bagong Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Isara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Modal */}
      {showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    I-install ang DRAW sa Cellphone
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Barangay 41 Waste Collection Application
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {deferredPrompt ? (
                <button
                  onClick={handlePromptPwa}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="block text-white leading-tight">1-Tap I-install sa Cellphone</span>
                      <span className="text-[10px] text-emerald-100 font-medium">Idaragdag agad sa iyong Apps at Home Screen</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase">
                    Install
                  </span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-extrabold block text-emerald-800 text-sm">📲 Paano I-install sa Phone:</span>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    Pindutin lamang ang <strong>tatlong tuldok (⋮)</strong> sa Chrome o <strong>Share (⎙)</strong> sa Safari at piliin ang <strong>&quot;Install app&quot;</strong> o <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
              <span className="text-[11px] font-bold text-slate-900 block">
                Hakbang para maging App sa Cellphone:
              </span>
              <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  1
                </span>
                <div className="leading-snug">
                  <strong className="text-slate-900">Android (Google Chrome):</strong> Sa itaas ng browser, i-tap ang tatlong tuldok (<strong className="text-slate-900">⋮</strong>) at piliin ang <strong className="text-emerald-700">&quot;Install app&quot;</strong> o <strong className="text-emerald-700">&quot;Add to Home screen&quot;</strong>. Lalabas agad ang DRAW icon sa iyong apps.
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  2
                </span>
                <div className="leading-snug">
                  <strong className="text-slate-900">iPhone / iOS (Safari):</strong> I-tap ang <strong className="text-slate-900">Share</strong> icon sa ibaba at piliin ang <strong className="text-slate-900">&quot;Add to Home Screen&quot;</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallPrompt(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Isara ang Window
            </button>
          </div>
        </div>
      )}
    </>
  );
};

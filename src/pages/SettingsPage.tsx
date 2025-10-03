
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import * as Sentry from '@sentry/react';
import { auth } from '../firebase/config';
import { useStore } from '../store/useStore';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ThemeToggle } from '../components/ui/ThemeToggle';

// Wetter-Stadt Auswahl Optionen
const cityOptions = [
  'Aachen', 'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Dresden', 'Leipzig', 'Düsseldorf'
];



function SettingsPage() {
  // Wetter-Stadt Auswahl
  const [weatherCity, setWeatherCity] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('weather-city') || 'Aachen';
    }
    return 'Aachen';
  });
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWeatherCity(e.target.value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('weather-city', e.target.value);
    }
  };
  const { t } = useTranslation();
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editLanguage, setEditLanguage] = useState<Language>('de');
  const [editNickname, setEditNickname] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editBodyFat, setEditBodyFat] = useState('');
  const [editMaxPushups, setEditMaxPushups] = useState('');


  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('notification-enabled') === 'true';
  });


  const [notificationTime, setNotificationTime] = useState('20:00');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const pwaInstallPrompt = useStore((state) => state.pwaInstallPrompt);
  const setPwaInstallPrompt = useStore((state) => state.setPwaInstallPrompt);
  const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);


  const handleInstallApp = async () => {
    if (pwaInstallPrompt) {
      try {
        setShowInstallHelp(false);
        await pwaInstallPrompt.prompt();
        const { outcome } = await pwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          setPwaInstallPrompt(null);
        } else {
          localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }
      } catch (error) {
        console.error('Install prompt failed:', error);
      }
      return;
    }
    setShowInstallHelp(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    if (!user) return;
    setEditLanguage(user.language || 'de');
    setEditNickname(user.nickname);
    setEditHeight(user.height.toString());
    setEditWeight(user.weight.toString());
    setEditBodyFat(user.bodyFat?.toString() || '');
    setEditMaxPushups(user.maxPushups.toString());
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { updateUser } = await import('../services/firestoreService');

      const updates = {
        language: editLanguage,
        nickname: editNickname,
        height: parseInt(editHeight),
        weight: parseInt(editWeight),
        bodyFat: editBodyFat ? parseFloat(editBodyFat) : undefined,
        maxPushups: parseInt(editMaxPushups),
      };

      const result = await updateUser(user.id, updates);

      if (result.success) {
        setUser({
          ...user,
          ...updates,
        });
        setIsEditingProfile(false);
        alert(t('settings.profileUpdated'));
      } else {
        alert(t('settings.saveError'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('settings.saveError'));
    }
  };

  const handleJoinGroup = async () => {
    if (!user) return;

    try {
      const { joinGroup } = await import('../services/firestoreService');
      const { updateUser } = await import('../services/firestoreService');

      // Join the group
      const groupResult = await joinGroup(groupCode, user.id);

      if (groupResult.success) {
        // Update user's groupCode
        await updateUser(user.id, { groupCode });

        // Update local state
        setUser({
          ...user,
          groupCode,
        });

        alert(t('settings.joinedGroup'));
      } else {
        alert(t('settings.joinGroupError'));
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert(t('settings.joinGroupError'));
    } finally {
      setShowGroupInput(false);
      setGroupCode('');
    }
  };

  const handleTestError = () => {
    try {
      console.log('🧪 Testing Sentry error capture...');
      throw new Error('Test error for Sentry - triggered from Settings page');
    } catch (error) {
      Sentry.captureException(error);
      alert('Test-Fehler wurde an Sentry gesendet! Prüfe dein Sentry Dashboard.');
    }
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission when enabling
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          setNotificationsEnabled(true);
          scheduleNotification(notificationTime);
          console.log('✅ Benachrichtigungen aktiviert für', notificationTime);
        } else if (permission === 'denied') {
          alert('❌ Benachrichtigungs-Berechtigung wurde verweigert. Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.');
        } else {
          alert('⚠️ Benachrichtigungs-Berechtigung wurde nicht erteilt.');
        }
      } else {
        alert('❌ Dein Browser unterstützt keine Benachrichtigungen.');
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
      console.log('🔕 Benachrichtigungen deaktiviert');
    }
  };

  const scheduleNotification = (time: string) => {
    // Calculate time until notification
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Winter Arc Tracker', {
          body: 'Zeit für dein Training! Logge deine Fortschritte.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });

        // Reschedule for next day
        scheduleNotification(time);
      }
    }, timeUntilNotification);

    console.log(`🔔 Benachrichtigung geplant für ${scheduledTime.toLocaleString()}`);
  };

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🧪 Test-Benachrichtigung', {
        body: 'Benachrichtigungen funktionieren! Du wirst täglich um ' + notificationTime + ' Uhr erinnert.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
      console.log('📬 Test-Benachrichtigung gesendet');
    } else {
      alert('❌ Benachrichtigungen sind nicht aktiviert oder die Berechtigung wurde verweigert.');
    }
  };

  return (
  <div className="min-h-screen-mobile glass-dark safe-pt">
      {/* Header */}
  <div className="glass-dark text-white px-4 py-6 md:px-6 md:py-8">
        <div className="mobile-container">
          <h1 className="text-fluid-h1 font-bold mb-2">⚙️ {t('settings.title')}</h1>
          <p className="text-fluid-base text-winter-100">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-20 space-y-4">
        {/* Wetter Stadt Auswahl */}
        <div className="glass dark:glass-dark rounded-[20px] p-6 mb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🌤️ Wetter-Stadt</h2>
          <label htmlFor="weather-city-select" className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Stadt für Wetterdaten auswählen:</label>
          <select
            id="weather-city-select"
            value={weatherCity}
            onChange={handleCityChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none"
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        {/* Profile Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <div className="flex items-center gap-4 mb-6">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.nickname}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full border-2 border-winter-200 dark:border-winter-700 shadow-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                👤 {t('settings.profile')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.nickname}
              </p>
            </div>
          </div>
          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.language')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditLanguage('de')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      editLanguage === 'de'
                        ? 'border-winter-600 bg-winter-50 dark:bg-winter-900 text-winter-600 dark:text-winter-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-winter-400'
                    }`}
                  >
                    🇩🇪 Deutsch
                  </button>
                  <button
                    onClick={() => setEditLanguage('en')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      editLanguage === 'en'
                        ? 'border-winter-600 bg-winter-50 dark:bg-winter-900 text-winter-600 dark:text-winter-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-winter-400'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.nickname')}
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.height')}
                </label>
                <input
                  type="number"
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.weight')}
                </label>
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.bodyFat')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editBodyFat}
                  onChange={(e) => setEditBodyFat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.maxPushups')}
                </label>
                <input
                  type="number"
                  value={editMaxPushups}
                  onChange={(e) => setEditMaxPushups(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.language')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.language === 'de' ? '🇩🇪 Deutsch' : '🇺🇸 English'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.nickname')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.nickname}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.gender')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {user?.gender === 'male' ? t('settings.male') : user?.gender === 'female' ? t('settings.female') : t('settings.diverse')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.height')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.height} cm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.weight')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.weight} kg
                  </span>
                </div>
                {user?.bodyFat && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t('settings.bodyFat')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {user.bodyFat}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.maxPushups')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.maxPushups}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEditProfile}
                className="mt-4 w-full px-4 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium"
              >
                {t('settings.editProfile')}
              </button>
            </>
          )}
        </div>

        {/* Groups Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            👥 {t('settings.group')}
          </h2>
          {user?.groupCode ? (
            <div className="space-y-3">
              <div className="p-4 bg-winter-50 dark:bg-winter-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('settings.yourGroupCode')}
                </div>
                <div className="text-2xl font-bold text-winter-600 dark:text-winter-400">
                  {user.groupCode}
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium">
                {t('settings.leaveGroup')}
              </button>
            </div>
          ) : showGroupInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && groupCode && handleJoinGroup()}
                placeholder={t('settings.groupCodePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoinGroup}
                  disabled={!groupCode}
                  className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('settings.joinGroup')}
                </button>
                <button
                  onClick={() => {
                    setShowGroupInput(false);
                    setGroupCode('');
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowGroupInput(true)}
              className="w-full px-4 py-3 bg-winter-50 dark:bg-winter-900/20 text-winter-600 dark:text-winter-400 rounded-lg hover:bg-winter-100 dark:hover:bg-winter-900/30 transition-colors font-medium"
            >
              {t('settings.joinOrCreateGroup')}
            </button>
          )}
        </div>

        {/* Privacy Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🔒 {t('settings.privacy')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {t('settings.shareProfilePicture')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('settings.shareProfilePictureDesc')}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!user) return;
                const newValue = !user.shareProfilePicture;
                const { updateUser } = await import('../services/firestoreService');
                const result = await updateUser(user.id, { shareProfilePicture: newValue });
                if (result.success) {
                  setUser({ ...user, shareProfilePicture: newValue });
                }
              }}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                user?.shareProfilePicture ? 'bg-winter-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  user?.shareProfilePicture ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🎨 {t('settings.appearance')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {t('settings.theme')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('settings.themeDesc')}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>


{/* Install Section */}
<div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
    📲 {t('settings.installSection')}
  </h2>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
    {t('settings.installDescription')}
  </p>
  <div className="flex flex-wrap gap-2">
    <button
      onClick={handleInstallApp}
      className="px-4 py-3 bg-winter-600 text-white rounded-lg font-semibold hover:bg-winter-700 transition-colors flex-1 md:flex-initial"
      disabled={isStandalone}
    >
      {pwaInstallPrompt ? t('settings.installButton') : t('settings.installHelp')}
    </button>
    {!pwaInstallPrompt && (
      <button
        onClick={() => setShowInstallHelp((prev) => !prev)}
        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        {showInstallHelp ? t('settings.hideInstructions') : t('settings.showInstructions')}
      </button>
    )}
  </div>
  {(showInstallHelp || !pwaInstallPrompt) && (
    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
      {isStandalone
        ? t('settings.installAlready')
        : isIOS
          ? t('settings.installInstructionsIos')
          : t('settings.installInstructions')}
    </p>
  )}
</div>

        {/* Notifications Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🔔 {t('settings.notifications')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('settings.dailyReminder')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {notificationTime}
                </div>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  notificationsEnabled
                    ? 'bg-winter-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
          {notificationsEnabled && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowTimeModal(true)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                {t('settings.changeTime')}
              </button>
              <button
                onClick={sendTestNotification}
                className="w-full px-4 py-3 bg-winter-50 dark:bg-winter-900/20 text-winter-600 dark:text-winter-400 rounded-lg hover:bg-winter-100 dark:hover:bg-winter-900/30 transition-colors font-medium"
              >
                {t('settings.testNotification')}
              </button>
            </div>
          )}
        </div>

        {/* Time Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="glass-dark rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('settings.reminderTime')}
              </h2>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowTimeModal(false);
                    if (notificationsEnabled) {
                      scheduleNotification(notificationTime);
                      console.log('🔄 Benachrichtigungszeit aktualisiert:', notificationTime);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg font-semibold hover:bg-winter-700 transition-colors"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={() => {
                    setShowTimeModal(false);
                    setNotificationTime('20:00');
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🔐 {t('settings.account')}
          </h2>
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-left"
            >
              {t('settings.logout')}
            </button>
            <button className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-left">
              {t('settings.deleteAccount')}
            </button>
          </div>
        </div>

        {/* Legal Section */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📄 {t('settings.legal')}
          </h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              {t('settings.privacy')}
            </button>
            <button className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
              {t('settings.terms')}
            </button>
          </div>
        </div>

        {/* Debug Section (only in development) */}
        {import.meta.env.DEV && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl shadow-lg p-6 border-2 border-yellow-300 dark:border-yellow-700">
            <h2 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-4">
              🧪 Debug Tools
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleTestError}
                className="w-full px-4 py-3 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors font-medium text-left"
              >
                Test Sentry Error Tracking
              </button>
              <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Sentry Status: {import.meta.env.VITE_SENTRY_DSN ? '✅ Konfiguriert' : '⚠️ Nicht konfiguriert'}
              </div>
            </div>
          </div>
        )}

        {/* App Version */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          Winter Arc Tracker v0.0.1
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getNotes, saveNotes } from '../services/firestoreService';

function NotesPage() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;
      const result = await getNotes(user.id);
      if (result.success && result.data) {
        setNotes(result.data);
      }
    };
    loadNotes();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus('idle');

    const result = await saveNotes(user.id, notes);

    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen safe-area-inset-top">
      {/* Header */}
      <div className="relative text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📝 {t('notes.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('notes.subtitle')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-4">
        <div className="glass dark:glass-dark rounded-[20px] p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes.placeholder')}
            className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none resize-none"
          />

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-winter-600 text-white rounded-lg hover:bg-winter-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? t('common.loading') : t('common.save')}
            </button>

            {saveStatus === 'success' && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ {t('notes.saved')}
              </span>
            )}

            {saveStatus === 'error' && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                ✗ {t('notes.saveError')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesPage;

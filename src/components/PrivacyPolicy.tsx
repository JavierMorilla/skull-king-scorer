import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-modal bg-abyssal-deep overflow-y-auto px-6 py-12 text-ice font-sans"
    >
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-cabin-slate text-gold hover:bg-cabin-slate/80 transition-colors"
            aria-label={t('app.close')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-3xl font-display font-bold text-gold">{t('app.privacy')}</h1>
        </header>

        <section className="space-y-8 bg-cabin-slate/30 p-8 rounded-2xl border border-cabin-slate backdrop-blur-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">anchor</span>
              {t('privacy.overview')}
            </h2>
            <p className="text-sm leading-relaxed text-ice/80">
              {t('privacy.overviewDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">shield</span>
              {t('privacy.data')}
            </h2>
            <p className="text-sm leading-relaxed text-ice/80">
              {t('privacy.dataDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">cloud</span>
              {t('privacy.services')}
            </h2>
            <p className="text-sm leading-relaxed text-ice/80">
              {t('privacy.servicesDesc')}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings_input_antenna</span>
              {t('privacy.permissions')}
            </h2>
            <ul className="list-disc list-inside text-sm space-y-2 text-ice/80">
              <li>{t('privacy.permHaptics')}</li>
              <li>{t('privacy.permWake')}</li>
              <li>{t('privacy.permInternet')}</li>
            </ul>
          </div>

          <div className="pt-8 border-t border-cabin-slate text-xs text-ice/40 text-center italic">
            {t('privacy.lastUpdate')}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;

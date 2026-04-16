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
      className="fixed inset-0 z-[100] bg-[#041424] overflow-y-auto px-6 py-12 text-[#d3e4fa] font-sans"
    >
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-[#1b2b3b] text-[#fabd04] hover:bg-[#25394f] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-3xl font-serif font-bold text-[#fabd04]">{t('app.privacy')}</h1>
        </header>

        <section className="space-y-8 bg-[#1b2b3b]/30 p-8 rounded-2xl border border-[#1b2b3b] backdrop-blur-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#fabd04] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">anchor</span>
              {t('privacy.overview')}
            </h2>
            <p className="text-sm leading-relaxed text-[#d3e4fa]/80">
              {t('privacy.overviewDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#fabd04] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">shield</span>
              {t('privacy.data')}
            </h2>
            <p className="text-sm leading-relaxed text-[#d3e4fa]/80">
              {t('privacy.dataDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#fabd04] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">cloud</span>
              {t('privacy.services')}
            </h2>
            <p className="text-sm leading-relaxed text-[#d3e4fa]/80">
              {t('privacy.servicesDesc')}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#fabd04] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings_input_antenna</span>
              {t('privacy.permissions')}
            </h2>
            <ul className="list-disc list-inside text-sm space-y-2 text-[#d3e4fa]/80">
              <li>{t('privacy.permHaptics')}</li>
              <li>{t('privacy.permWake')}</li>
              <li>{t('privacy.permInternet')}</li>
            </ul>
          </div>

          <div className="pt-8 border-t border-[#1b2b3b] text-xs text-[#d3e4fa]/40 text-center italic">
            {t('privacy.lastUpdate')}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;

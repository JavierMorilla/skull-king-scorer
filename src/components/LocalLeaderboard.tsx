import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player } from '../types';

interface LocalLeaderboardProps {
  players: Player[];
  currentRound: number;
  onNextRound: () => void;
  onLeave: () => void;
}

export default function LocalLeaderboard({ players, currentRound, onNextRound, onLeave }: LocalLeaderboardProps) {
  const { t } = useLanguage();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const isGameOver = currentRound >= 10;

  return (
    <motion.div 
      className="flex-grow flex flex-col items-center p-4 sm:p-6 relative"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.4 } },
        exit: { opacity: 0, transition: { delay: 1.5, duration: 0.5 } }
      }}
    >
      {/* New Round Indicator that appears only during exit */}
      <motion.div
        variants={{
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 0, scale: 0.8 },
          exit: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.1 } }
        }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
      >
        <motion.div 
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4 drop-shadow-lg"
        >
          <span className="material-symbols-outlined text-[#fabd04] text-7xl">sailing</span>
        </motion.div>
        <h2 className="font-serif text-5xl font-bold text-[#d3e4fa] drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          {currentRound < 10 ? t('lead.round', { num: currentRound + 1 }) : t('lead.end')}
        </h2>
      </motion.div>

      <motion.div
        variants={{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
          exit: { opacity: 0, scale: 0.95, filter: 'blur(8px)', transition: { duration: 0.5 } }
        }}
        className="w-full max-w-2xl flex flex-col items-center"
      >
        <h2 className="text-4xl font-serif font-bold text-[#d3e4fa] mb-2">
          {isGameOver ? t('lead.end') : t('lead.fleet')}
        </h2>
        <p className="font-mono text-[#f0bd8b] opacity-60 uppercase tracking-widest text-xs mb-8">
          {isGameOver ? t('lead.end') : t('bet.round', { num: currentRound })}
        </p>

        <div className="w-full space-y-3 mb-8">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-[#1b2b3b] rounded-xl border ${
                index === 0 ? 'border-[#fabd04] shadow-[0_0_15px_rgba(250,189,4,0.2)]' : 'border-[#44474c]/30'
              } p-4 flex items-center justify-between overflow-hidden`}
            >
              {index === 0 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#fabd04]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              )}
              
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold ${
                  index === 0 ? 'bg-[#fabd04] text-[#261a00]' : 
                  index === 1 ? 'bg-[#c0c0c0] text-[#1a1a1a]' :
                  index === 2 ? 'bg-[#cd7f32] text-[#261a00]' :
                  'bg-[#263647] text-[#d3e4fa]'
                }`}>
                  {index + 1}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans font-bold text-lg text-[#d3e4fa]">{player.name}</span>
                </div>
              </div>
              
              <div className="relative z-10 text-right">
                <span className="font-serif font-bold text-2xl text-[#fabd04]">{player.score}</span>
                <span className="font-mono text-[10px] text-[#f0bd8b]/60 uppercase tracking-widest block -mt-1">pts</span>
              </div>
            </motion.div>
          ))}
        </div>

        {!isGameOver ? (
          <button
            onClick={onNextRound}
            className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            {t('lead.next')}
            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={onLeave}
            className="w-full h-16 rounded-xl bg-[#263647] text-[#d3e4fa] font-serif text-xl font-bold shadow-xl hover:bg-[#364657] transition-colors flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">home</span>
            {t('app.leave')}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Room, Player, Result } from '../types';
import { nextRound } from '../services/gameService';
import { auth } from '../firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { track } from '@vercel/analytics';

interface LeaderboardProps {
  room: Room;
  players: Player[];
  results: Result[];
  key?: string;
}

const AnimatedScore = ({ score, scoreChange, delay = 0 }: { score: number, scoreChange: number, delay?: number }) => {
  const prevScore = score - scoreChange;
  const count = useMotionValue(prevScore);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, score, {
      duration: 1.5,
      delay: delay,
      ease: "easeOut"
    });
    return animation.stop;
  }, [score, delay, count]);

  return <motion.span>{rounded}</motion.span>;
};

export default function Leaderboard({ room, players, results }: LeaderboardProps) {
  const { t } = useLanguage();
  const isHost = room.hostId === auth.currentUser?.uid;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  }, []);

  const handleNextRound = async () => {
    if (isHost && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await nextRound(room.id, room.currentRound);
        if (room.currentRound < 10) {
          track('online_round_completed', { round: room.currentRound, players: players.length });
        } else {
          track('online_game_finished', { players: players.length });
        }
      } catch (error) {
        console.error("Error starting next round:", error);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <motion.div 
      className="flex-grow pt-24 pb-32 px-4 max-w-2xl mx-auto w-full relative"
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
        className="fixed inset-0 z-modal flex flex-col items-center justify-center pointer-events-none"
      >
        <motion.div 
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4 drop-shadow-lg"
        >
          <span className="material-symbols-outlined text-gold text-7xl">sailing</span>
        </motion.div>
        <h2 className="font-display text-5xl font-bold text-ice drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          {room.currentRound < 10 ? t('lead.round', { num: room.currentRound + 1 }) : t('lead.end')}
        </h2>
      </motion.div>

      <motion.div
        variants={{
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
          exit: { opacity: 0, scale: 0.95, filter: 'blur(8px)', transition: { duration: 0.5 } }
        }}
      >
        <section className="grid grid-cols-12 gap-3 mb-8">
        {/* 1st Place */}
        {sortedPlayers[0] && (
          <div className="col-span-12 bg-gradient-to-br from-gold/20 to-cabin-slate rounded-xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
              <span className="material-symbols-outlined text-9xl">workspace_premium</span>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-display text-gold text-4xl block italic leading-none">1st</span>
                  <h2 className="font-display text-2xl text-ice font-bold">{sortedPlayers[0].name}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs uppercase tracking-tighter text-slate-mist mb-1">{t('lead.total')}</p>
                <motion.p 
                  key={sortedPlayers[0].score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: 'var(--color-gold)' }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="font-mono text-4xl font-bold text-gold tabular-nums"
                >
                  <AnimatedScore 
                    score={sortedPlayers[0].score} 
                    scoreChange={results.find(r => r.playerId === sortedPlayers[0].id)?.scoreChange || 0} 
                    delay={0.5} 
                  />
                </motion.p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center border-t border-gold/10 pt-4">
              <span className="text-xs font-sans text-slate-mist">{t('lead.last')}</span>
              <span className="font-mono text-gold font-bold tabular-nums">
                {results.find(r => r.playerId === sortedPlayers[0].id)?.scoreChange > 0 ? '+' : ''}
                {results.find(r => r.playerId === sortedPlayers[0].id)?.scoreChange || 0}
              </span>
            </div>
          </div>
        )}

        {/* 2nd Place */}
        {sortedPlayers[1] && (
          <div className="col-span-6 bg-cabin-slate rounded-xl p-4 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <span className="font-display text-slate-300 text-2xl italic">2nd</span>
              <h3 className="font-display text-lg text-ice leading-tight">{sortedPlayers[1].name}</h3>
              <div className="mt-2">
                <motion.p 
                  key={sortedPlayers[1].score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: 'var(--color-ice)' }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="font-mono text-2xl font-bold text-ice tabular-nums"
                >
                  <AnimatedScore 
                    score={sortedPlayers[1].score} 
                    scoreChange={results.find(r => r.playerId === sortedPlayers[1].id)?.scoreChange || 0} 
                    delay={0.6} 
                  />
                </motion.p>
                <p className="font-mono text-[10px] text-coral tabular-nums">
                  {results.find(r => r.playerId === sortedPlayers[1].id)?.scoreChange > 0 ? '+' : ''}
                  {results.find(r => r.playerId === sortedPlayers[1].id)?.scoreChange || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {sortedPlayers[2] && (
          <div className="col-span-6 bg-cabin-slate rounded-xl p-4 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <span className="font-display text-amber-600 text-2xl italic">3rd</span>
              <h3 className="font-display text-lg text-ice leading-tight">{sortedPlayers[2].name}</h3>
              <div className="mt-2">
                <motion.p 
                  key={sortedPlayers[2].score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: 'var(--color-ice)' }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                  className="font-mono text-2xl font-bold text-ice tabular-nums"
                >
                  <AnimatedScore 
                    score={sortedPlayers[2].score} 
                    scoreChange={results.find(r => r.playerId === sortedPlayers[2].id)?.scoreChange || 0} 
                    delay={0.7} 
                  />
                </motion.p>
                <p className="font-mono text-[10px] text-gold tabular-nums">
                  {results.find(r => r.playerId === sortedPlayers[2].id)?.scoreChange > 0 ? '+' : ''}
                  {results.find(r => r.playerId === sortedPlayers[2].id)?.scoreChange || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="space-y-3">
        <h4 className="font-display text-xl text-apricot ml-2 mb-4 italic">{t('lead.fleet')}</h4>
        
        {sortedPlayers.slice(3).map((player, index) => {
          const result = results.find(r => r.playerId === player.id);
          return (
            <motion.div 
              key={player.id} 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (index * 0.1) }}
              className="bg-dark-void rounded-xl p-4 flex items-center justify-between group hover:bg-cabin-slate transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-slate-mist w-6 text-center tabular-nums">{index + 4}</span>
                <div>
                  <p className="font-sans font-semibold text-ice">{player.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-mist uppercase tracking-widest">{t('lead.last')}</span>
                    <span className={`text-[10px] font-mono font-bold tabular-nums ${result?.scoreChange > 0 ? 'text-gold' : result?.scoreChange < 0 ? 'text-coral' : 'text-slate-mist'}`}>
                      {result?.scoreChange > 0 ? '+' : ''}{result?.scoreChange || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <motion.p 
                  key={player.score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: 'var(--color-ice)' }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.3 + (index * 0.1) }}
                  className="font-mono text-xl font-bold text-ice tabular-nums"
                >
                  <AnimatedScore 
                    score={player.score} 
                    scoreChange={result?.scoreChange || 0} 
                    delay={0.8 + (index * 0.1)} 
                  />
                </motion.p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isHost && (
        <div className="mt-8">
          <button 
            onClick={handleNextRound}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep py-4 min-h-11 rounded-xl font-display font-bold text-lg shadow-xl active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? t('lead.preparing') : (room.currentRound < 10 ? t('lead.next') : t('lead.finish'))}
          </button>
        </div>
      )}
      </motion.div>
    </motion.div>
  );
}

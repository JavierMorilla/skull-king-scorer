import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Player } from '../types';
import { auth } from '../firebase';
import { kickPlayer } from '../services/gameService';
import { useLanguage } from '../i18n/LanguageContext';

interface ScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  players: Player[];
}

export default function ScoresModal({ isOpen, onClose, room, players }: ScoresModalProps) {
  const { t } = useLanguage();
  const isHost = room.hostId === auth.currentUser?.uid;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handleKick = async (playerId: string) => {
    if (window.confirm(t('lobby.kickConfirm'))) {
      try {
        await kickPlayer(room.id, playerId);
      } catch (error) {
        console.error('Error al expulsar jugador:', error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-abyssal-deep/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-cabin-slate rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-mist/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="font-sans text-2xl text-ice font-bold">{t('score.title')}</h2>
              <button
                onClick={onClose}
                className="text-apricot/60 hover:text-apricot p-2 w-11 h-11 flex items-center justify-center rounded-full hover:bg-abyssal-deep/50 transition-colors"
                aria-label={t('app.close')}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar relative z-10">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-dark-void/50 p-3 rounded-2xl border border-slate-mist/5 transition-all hover:bg-dark-void/70 duration-100"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-sans text-ice font-bold flex items-center gap-2">
                        {player.name}
                        {player.id === room.hostId && (
                           <span className="material-symbols-outlined text-gold text-base" title={t('lobby.host')}>sailing</span>
                        )}
                      </div>
                      <div className="text-xs text-apricot/60 font-mono">
                        {t('score.place', { num: index + 1 })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-mono tabular-nums text-gold font-bold">
                      {player.score}
                    </div>
                    {isHost && player.id !== auth.currentUser?.uid && (
                      <button
                        onClick={() => handleKick(player.id)}
                        className="text-coral/80 hover:text-coral transition-colors p-2 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-coral/10"
                        title={t('lobby.kickTitle')}
                      >
                        <span className="material-symbols-outlined text-xl">person_remove</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

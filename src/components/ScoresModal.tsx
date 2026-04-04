import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Player } from '../types';
import { auth } from '../firebase';
import { kickPlayer } from '../services/gameService';

interface ScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  players: Player[];
}

export default function ScoresModal({ isOpen, onClose, room, players }: ScoresModalProps) {
  const isHost = room.hostId === auth.currentUser?.uid;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handleKick = async (playerId: string) => {
    if (window.confirm('¿Estás seguro de que quieres expulsar a este jugador?')) {
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#041424]/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1b2b3b] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#263647]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-[#d3e4fa]">Puntuaciones Actuales</h2>
              <button
                onClick={onClose}
                className="text-[#f0bd8b]/60 hover:text-[#f0bd8b] transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-[#041424]/50 p-3 rounded-xl border border-[#263647]/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-xl">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="font-sans text-[#d3e4fa] font-medium flex items-center gap-2">
                        {player.name}
                        {player.id === room.hostId && (
                          <span className="material-symbols-outlined text-[#fabd04] text-base" title="Capitán">sailing</span>
                        )}
                      </div>
                      <div className="text-xs text-[#f0bd8b]/60 font-mono">
                        {index + 1}º Lugar
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-serif text-[#fabd04] font-bold">
                      {player.score}
                    </div>
                    {isHost && player.id !== auth.currentUser?.uid && (
                      <button
                        onClick={() => handleKick(player.id)}
                        className="text-red-500/70 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                        title="Expulsar jugador"
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

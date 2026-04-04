import React, { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Room, Player, Result } from '../types';
import { nextRound } from '../services/gameService';
import { auth } from '../firebase';

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
  const isHost = room.hostId === auth.currentUser?.uid;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextRound = async () => {
    if (isHost && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await nextRound(room.id, room.currentRound);
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
          {room.currentRound < 10 ? `¡Ronda ${room.currentRound + 1}!` : '¡Fin de la Partida!'}
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
          <div className="col-span-12 bg-gradient-to-br from-[#362600] to-[#1b2b3b] rounded-xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
              <span className="material-symbols-outlined text-9xl">workspace_premium</span>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-[#fabd04] overflow-hidden bg-[#263647]">
                  <img src={sortedPlayers[0].avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-serif text-[#fabd04] text-4xl block italic leading-none">1st</span>
                  <h2 className="font-serif text-2xl text-[#d3e4fa] font-bold">{sortedPlayers[0].name}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs uppercase tracking-tighter text-[#c4c6cc] mb-1">Puntuación Total</p>
                <motion.p 
                  key={sortedPlayers[0].score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: '#fabd04' }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="font-mono text-4xl font-bold text-[#fabd04]"
                >
                  <AnimatedScore 
                    score={sortedPlayers[0].score} 
                    scoreChange={results.find(r => r.playerId === sortedPlayers[0].id)?.scoreChange || 0} 
                    delay={0.5} 
                  />
                </motion.p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center border-t border-[#fabd04]/10 pt-4">
              <span className="text-xs font-sans text-[#c4c6cc]">Última Ronda</span>
              <span className="font-mono text-[#fabd04] font-bold">
                {results.find(r => r.playerId === sortedPlayers[0].id)?.scoreChange > 0 ? '+' : ''}
                {results.find(r => r.playerId === sortedPlayers[0].id)?.scoreChange || 0}
              </span>
            </div>
          </div>
        )}

        {/* 2nd Place */}
        {sortedPlayers[1] && (
          <div className="col-span-6 bg-[#1b2b3b] rounded-xl p-4 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full border-2 border-slate-400 overflow-hidden mb-2">
                <img src={sortedPlayers[1].avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-slate-300 text-2xl italic">2nd</span>
              <h3 className="font-serif text-lg text-[#d3e4fa] leading-tight">{sortedPlayers[1].name}</h3>
              <div className="mt-2">
                <motion.p 
                  key={sortedPlayers[1].score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: '#d3e4fa' }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="font-mono text-2xl font-bold text-[#d3e4fa]"
                >
                  <AnimatedScore 
                    score={sortedPlayers[1].score} 
                    scoreChange={results.find(r => r.playerId === sortedPlayers[1].id)?.scoreChange || 0} 
                    delay={0.6} 
                  />
                </motion.p>
                <p className="font-mono text-[10px] text-[#ffb3ae]">
                  {results.find(r => r.playerId === sortedPlayers[1].id)?.scoreChange > 0 ? '+' : ''}
                  {results.find(r => r.playerId === sortedPlayers[1].id)?.scoreChange || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {sortedPlayers[2] && (
          <div className="col-span-6 bg-[#1b2b3b] rounded-xl p-4 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full border-2 border-amber-700 overflow-hidden mb-2">
                <img src={sortedPlayers[2].avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="font-serif text-amber-600 text-2xl italic">3rd</span>
              <h3 className="font-serif text-lg text-[#d3e4fa] leading-tight">{sortedPlayers[2].name}</h3>
              <div className="mt-2">
                <motion.p 
                  key={sortedPlayers[2].score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: '#d3e4fa' }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                  className="font-mono text-2xl font-bold text-[#d3e4fa]"
                >
                  <AnimatedScore 
                    score={sortedPlayers[2].score} 
                    scoreChange={results.find(r => r.playerId === sortedPlayers[2].id)?.scoreChange || 0} 
                    delay={0.7} 
                  />
                </motion.p>
                <p className="font-mono text-[10px] text-[#fabd04]">
                  {results.find(r => r.playerId === sortedPlayers[2].id)?.scoreChange > 0 ? '+' : ''}
                  {results.find(r => r.playerId === sortedPlayers[2].id)?.scoreChange || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="space-y-3">
        <h4 className="font-serif text-xl text-[#f0bd8b] ml-2 mb-4 italic">Clasificación de la Flota</h4>
        
        {sortedPlayers.slice(3).map((player, index) => {
          const result = results.find(r => r.playerId === player.id);
          return (
            <motion.div 
              key={player.id} 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (index * 0.1) }}
              className="bg-[#0c1d2c] rounded-xl p-4 flex items-center justify-between group hover:bg-[#1b2b3b] transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-[#c4c6cc] w-6 text-center">{index + 4}</span>
                <div className="w-10 h-10 rounded-md overflow-hidden bg-[#263647]">
                  <img src={player.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-[#d3e4fa]">{player.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#c4c6cc] uppercase tracking-widest">Last:</span>
                    <span className={`text-[10px] font-mono font-bold ${result?.scoreChange > 0 ? 'text-[#fabd04]' : result?.scoreChange < 0 ? 'text-[#ffb3ae]' : 'text-[#c4c6cc]'}`}>
                      {result?.scoreChange > 0 ? '+' : ''}{result?.scoreChange || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <motion.p 
                  key={player.score}
                  initial={{ scale: 1.5, color: '#fff' }}
                  animate={{ scale: 1, color: '#d3e4fa' }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.3 + (index * 0.1) }}
                  className="font-mono text-xl font-bold text-[#d3e4fa]"
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
            className="w-full bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] py-4 rounded-xl font-serif font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? 'Preparando...' : (room.currentRound < 10 ? 'Siguiente Ronda' : 'Finalizar Partida')}
          </button>
        </div>
      )}
      </motion.div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Player, Bid } from '../types';
import { submitBid, transitionToResults, toggleBidHighlight } from '../services/gameService';
import { auth } from '../firebase';
import { useLanguage } from '../i18n/LanguageContext';

interface BettingProps {
  room: Room;
  players: Player[];
  bids: Bid[];
  key?: string;
}

export default function Betting({ room, players, bids }: BettingProps) {
  const { t } = useLanguage();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [extraBet, setExtraBet] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isAnimatingConfirm, setIsAnimatingConfirm] = useState(false);

  const currentPlayer = players.find(p => p.id === auth.currentUser?.uid);
  const hasBid = bids.some(b => b.playerId === auth.currentUser?.uid);
  const isHost = room.hostId === auth.currentUser?.uid;
  const allBidsIn = bids.length === players.length;

  const handleConfirmBid = async () => {
    if (selectedBid === null) return;
    setIsAnimatingConfirm(true);
    
    // Wait for the flying animation to complete before submitting to backend
    setTimeout(async () => {
      setLoading(true);
      try {
        await submitBid(room.id, room.currentRound, selectedBid, extraBet);
      } catch (error) {
        console.error(error);
        alert(t('bet.error'));
      }
      setLoading(false);
      setIsAnimatingConfirm(false);
    }, 800);
  };

  const handleNextPhase = async () => {
    if (isHost && allBidsIn) {
      await transitionToResults(room.id, room.currentRound);
    }
  };

  const handleToggleHighlight = async (playerId: string, currentStatus: boolean) => {
    try {
      await toggleBidHighlight(room.id, room.currentRound, playerId, !currentStatus);
    } catch (error) {
      console.error("Error toggling highlight:", error);
    }
  };

  const dealer = players.find(p => p.id === room.dealerId);
  let startingPlayer = null;
  if (room.playerOrder && room.dealerId) {
    const dealerIndex = room.playerOrder.indexOf(room.dealerId);
    const startingIndex = (dealerIndex + 1) % room.playerOrder.length;
    startingPlayer = players.find(p => p.id === room.playerOrder![startingIndex]);
  }

  if (hasBid) {
    if (allBidsIn) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex-grow pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex flex-col items-center justify-center text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4"
          >
            <span className="material-symbols-outlined text-[#fabd04] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
          </motion.div>
          <h2 className="font-serif text-3xl font-bold text-[#d3e4fa] mb-2">{t('bet.revealedTitle')}</h2>
          <p className="text-[#f0bd8b]/80 font-sans mb-6">{t('bet.revealedSub')}</p>
          
          {dealer && startingPlayer && (
            <div className="bg-[#1b2b3b] border border-[#fabd04]/30 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 shadow-lg w-full">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f0bd8b]/80 text-xl">menu_book</span>
                <span className="font-sans text-[#d3e4fa] text-sm">
                  {t('bet.dealer')}: <strong className="text-[#f0bd8b]">{dealer.name}</strong>
                </span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-[#263647]"></div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fabd04] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                <span className="font-sans text-[#d3e4fa] text-sm">
                  {t('bet.starts')}: <strong className="text-[#fabd04]">{startingPlayer.name}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="mt-2 space-y-3 w-full">
            {players.map(p => {
              const playerBid = bids.find(b => b.playerId === p.id);
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={p.id} 
                  className="flex items-center justify-between p-4 rounded-xl w-full max-w-xs mx-auto border shadow-lg bg-[#1b2b3b] border-[#fabd04]/30"
                >
                  <span className="font-sans font-bold text-lg text-[#d3e4fa]">
                    {p.name}
                  </span>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border bg-[#041424] border-[#fabd04]/50">
                    <span className="font-mono text-2xl font-bold text-[#fabd04]">
                      {playerBid?.bid}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {isHost ? (
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNextPhase}
              className="mt-10 w-full max-w-xs bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] py-4 rounded-xl font-serif font-bold text-lg shadow-xl active:scale-95 transition-transform"
            >
              {t('bet.btnStartRound')}
            </motion.button>
          ) : (
            <p className="mt-10 text-[#f0bd8b]/60 font-mono text-sm uppercase tracking-widest animate-pulse">{t('bet.waitCaptain')}</p>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="flex-grow pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex flex-col items-center justify-center text-center"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <span className="material-symbols-outlined text-[#fabd04] text-6xl">hourglass_empty</span>
        </motion.div>
        <h2 className="font-serif text-3xl font-bold text-[#d3e4fa] mb-2">{t('bet.registeredTitle')}</h2>
        <p className="text-[#f0bd8b]/80 font-sans mb-6">{t('bet.registeredSub')}</p>

        {dealer && startingPlayer && (
          <div className="bg-[#1b2b3b] border border-[#fabd04]/30 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 shadow-lg w-full">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f0bd8b]/80 text-xl">menu_book</span>
              <span className="font-sans text-[#d3e4fa] text-sm">
                {t('bet.dealer')}: <strong className="text-[#f0bd8b]">{dealer.name}</strong>
              </span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#263647]"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fabd04] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              <span className="font-sans text-[#d3e4fa] text-sm">
                {t('bet.starts')}: <strong className="text-[#fabd04]">{startingPlayer.name}</strong>
              </span>
            </div>
          </div>
        )}

        <div className="mt-2 space-y-2 w-full">
          {players.map(p => {
            const playerBid = bids.find(b => b.playerId === p.id);
            return (
              <div key={p.id} className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg w-full max-w-xs mx-auto">
                <span className="font-sans text-[#d3e4fa]">{p.name}</span>
                {playerBid ? (
                  <span className="material-symbols-outlined text-[#fabd04] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-[#44474c] text-xl">pending</span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const round = room.currentRound;
  const possibleScore = selectedBid === null ? (20 * round) : (selectedBid === 0 ? 10 * round : 20 * selectedBid);
  const maxPenalty = selectedBid === null ? (10 * round) : (selectedBid === 0 ? 10 * round : Math.max(10 * selectedBid, 10 * (round - selectedBid)));
  const totalPossibleScore = possibleScore + extraBet;
  const totalMaxPenalty = maxPenalty + extraBet;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-grow mt-20 mb-28 px-6 max-w-lg mx-auto w-full"
    >
      {dealer && startingPlayer && (
        <div className="bg-[#1b2b3b] border border-[#fabd04]/30 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 shadow-lg w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#f0bd8b]/80 text-xl">menu_book</span>
            <span className="font-sans text-[#d3e4fa] text-sm">
              {t('bet.dealer')}: <strong className="text-[#f0bd8b]">{dealer.name}</strong>
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-[#263647]"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fabd04] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            <span className="font-sans text-[#d3e4fa] text-sm">
              {t('bet.starts')}: <strong className="text-[#fabd04]">{startingPlayer.name}</strong>
            </span>
          </div>
        </div>
      )}

      <section className="mb-10 text-center relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[10rem]" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
        </div>
        <p className="font-serif italic text-[#f0bd8b] text-lg mb-1">{t('bet.phase')}</p>
        <h2 className="font-serif font-bold text-4xl text-[#d3e4fa] tracking-tight">{t('bet.round', { num: room.currentRound })}</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#fabd04] to-transparent mx-auto mt-4 rounded-full"></div>
      </section>

      <div className="bg-[#1b2b3b] rounded-xl p-6 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-5xl">person</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c4c6cc] mb-2">{t('bet.currentPlayer')}</p>
        <h3 className="font-serif text-2xl font-bold text-[#fabd04] italic">{currentPlayer?.name}</h3>
      </div>

      <div className="space-y-4">
        <label className="font-mono text-xs uppercase tracking-widest text-[#f0bd8b] ml-1">{t('bet.choose')}</label>
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
          {Array.from({ length: room.currentRound + 1 }, (_, i) => i).map(num => (
            <motion.button 
              key={num}
              onClick={() => setSelectedBid(num)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={selectedBid === num ? { 
                scale: [1, 1.15, 1.05], 
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 } 
              } : { scale: 1, rotate: 0 }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-colors duration-200 group ${
                selectedBid === num 
                  ? 'bg-[#362600] border-[#fabd04] shadow-[0_0_20px_rgba(250,189,4,0.3)]' 
                  : 'bg-[#0c1d2c] border-transparent hover:bg-[#1b2b3b]'
              }`}
            >
              <span className={`font-mono text-2xl transition-colors ${selectedBid === num ? 'text-[#fabd04] font-bold text-glow' : 'text-[#d3e4fa] group-hover:text-[#fabd04]'}`}>
                {num}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {room.settings?.extraBetEnabled && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 bg-[#1b2b3b] p-4 rounded-xl border border-[#fabd04]/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-[#fabd04] text-2xl">casino</span>
            <div className="text-left">
              <span className="font-sans font-bold text-[#d3e4fa] block">{t('rules.extraBet')}</span>
              <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('rules.extraBetDesc')}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 10, 20].map(val => (
              <button
                key={val}
                onClick={() => setExtraBet(val)}
                className={`py-2 rounded-lg font-mono text-sm transition-colors ${
                  extraBet === val 
                    ? 'bg-[#fabd04] text-[#261a00] font-bold' 
                    : 'bg-[#0c1d2c] text-[#d3e4fa] hover:bg-[#263647]'
                }`}
              >
                {val === 0 ? t('bet.nothing') : `±${val}`}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-12">
        <button 
          onClick={handleConfirmBid}
          disabled={selectedBid === null || loading}
          className="w-full bg-gradient-to-r from-[#fabd04] to-[#b68900] py-5 rounded-xl flex items-center justify-center gap-3 active:scale-[0.96] transition-transform shadow-xl disabled:opacity-50"
        >
          <span className="font-mono text-[#261a00] font-bold text-lg uppercase tracking-widest">{t('bet.confirm')}</span>
          <span className="material-symbols-outlined text-[#261a00] text-2xl">check_circle</span>
        </button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4">
        <div className="bg-[#0c1d2c] p-4 rounded-xl">
          <p className="font-mono text-[10px] uppercase text-[#c4c6cc] mb-1">{t('bet.possible')}</p>
          <p className="font-mono text-xl text-[#fabd04]">+{totalPossibleScore}</p>
        </div>
        <div className="bg-[#0c1d2c] p-4 rounded-xl">
          <p className="font-mono text-[10px] uppercase text-[#c4c6cc] mb-1">{t('bet.penalty')}</p>
          <p className="font-mono text-xl text-[#ffb3ae]">-{totalMaxPenalty}</p>
        </div>
      </div>

      <AnimatePresence>
        {isAnimatingConfirm && selectedBid !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.5], y: [50, 0, -50, -250] }}
            transition={{ duration: 0.8, times: [0, 0.2, 0.6, 1], ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center"
          >
            <div className="bg-gradient-to-br from-[#fabd04] to-[#b68900] text-[#261a00] w-32 h-32 rounded-full flex items-center justify-center text-6xl font-bold shadow-[0_0_50px_rgba(250,189,4,0.6)] border-4 border-[#fff]/20">
              {selectedBid}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

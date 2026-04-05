import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player, Bid } from '../types';

interface LocalBettingProps {
  players: Player[];
  currentRound: number;
  onComplete: (bids: Bid[]) => void;
}

export default function LocalBetting({ players, currentRound, onComplete }: LocalBettingProps) {
  const { t } = useLanguage();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [step, setStep] = useState<'PASS_PHONE' | 'BETTING' | 'REVEAL'>('PASS_PHONE');
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBet, setCurrentBet] = useState<number | null>(null);

  // Dealer is the last player in the array for round 1, then shifts
  const dealerIndex = (players.length - 1 + currentRound - 1) % players.length;
  // First player to bet is the one after the dealer
  const firstPlayerIndex = (dealerIndex + 1) % players.length;

  // Calculate actual index based on turn order
  const actualPlayerIndex = (firstPlayerIndex + currentPlayerIndex) % players.length;
  const currentPlayer = players[actualPlayerIndex];

  const handleBet = () => {
    if (currentBet === null) return;

    const newBids = [...bids, { playerId: currentPlayer.id, bet: currentBet }];
    setBids(newBids);
    setCurrentBet(null);

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setStep('PASS_PHONE');
    } else {
      setStep('REVEAL');
    }
  };

  if (step === 'PASS_PHONE') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1b2b3b] p-8 rounded-3xl border border-[#fabd04]/30 shadow-2xl max-w-sm w-full"
        >
          <span className="material-symbols-outlined text-6xl text-[#fabd04] mb-4">waving_hand</span>
          <h2 className="text-2xl font-serif font-bold text-[#d3e4fa] mb-2">{t('local.passPhone')}</h2>
          <p className="text-3xl font-serif font-bold text-[#fabd04] mb-8">{currentPlayer.name}</p>
          
          <button
            onClick={() => setStep('BETTING')}
            className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            {t('local.iAm')} {currentPlayer.name}
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'REVEAL') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <span className="material-symbols-outlined text-6xl text-[#fabd04] mb-4">visibility</span>
          <h2 className="text-3xl font-serif font-bold text-[#d3e4fa] mb-8">{t('local.revealBets')}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {players.map(p => {
              const pBid = bids.find(b => b.playerId === p.id)?.bet;
              return (
                <div key={p.id} className="bg-[#1b2b3b] p-4 rounded-xl border border-[#44474c]/30 flex flex-col items-center">
                  <span className="font-sans font-bold text-[#d3e4fa] mb-2 truncate w-full">{p.name}</span>
                  <span className="text-4xl font-serif font-bold text-[#fabd04]">{pBid}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onComplete(bids)}
            className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            {t('local.startRound')}
            <span className="material-symbols-outlined text-3xl">play_arrow</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <section className="mb-10 text-center relative w-full">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none select-none">
            <span className="material-symbols-outlined text-[10rem]" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
          </div>
          <p className="font-serif italic text-[#f0bd8b] text-lg mb-1">{t('bet.phase')}</p>
          <h2 className="font-serif font-bold text-4xl text-[#d3e4fa] tracking-tight">{t('bet.round', { num: currentRound })}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#fabd04] to-transparent mx-auto mt-4 rounded-full"></div>
        </section>

        <div className="bg-[#1b2b3b] rounded-xl p-6 mb-8 relative overflow-hidden shadow-2xl w-full text-center">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-5xl">person</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c4c6cc] mb-2">{t('bet.currentPlayer')}</p>
          <h3 className="font-serif text-2xl font-bold text-[#fabd04] italic">{currentPlayer.name}</h3>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 w-full mb-8">
          {Array.from({ length: currentRound + 1 }, (_, i) => i).map((num) => (
            <motion.button
              key={num}
              onClick={() => setCurrentBet(num)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={currentBet === num ? { 
                scale: [1, 1.15, 1.05], 
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 } 
              } : { scale: 1, rotate: 0 }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-colors duration-200 group ${
                currentBet === num
                  ? 'bg-[#362600] border-[#fabd04] shadow-[0_0_20px_rgba(250,189,4,0.3)]'
                  : 'bg-[#0c1d2c] border-transparent hover:bg-[#1b2b3b]'
              }`}
            >
              <span className={`font-mono text-2xl transition-colors ${currentBet === num ? 'text-[#fabd04] font-bold text-glow' : 'text-[#d3e4fa] group-hover:text-[#fabd04]'}`}>
                {num}
              </span>
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleBet}
          disabled={currentBet === null}
          className="w-full bg-gradient-to-r from-[#fabd04] to-[#b68900] py-5 rounded-xl flex items-center justify-center gap-3 active:scale-[0.96] transition-transform shadow-xl disabled:opacity-50"
        >
          <span className="font-mono text-[#261a00] font-bold text-lg uppercase tracking-widest">{t('bet.confirm')}</span>
          <span className="material-symbols-outlined text-[#261a00] text-2xl">check_circle</span>
        </button>
      </div>
    </div>
  );
}

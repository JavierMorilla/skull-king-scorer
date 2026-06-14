import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player, Bid, RoomSettings, Room } from '../types';
import Betting from './Betting';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface LocalBettingProps {
  players: Player[];
  currentRound: number;
  settings: RoomSettings;
  onComplete: (bids: Bid[]) => void;
}

export default function LocalBetting({ players, currentRound, settings, onComplete }: LocalBettingProps) {
  const { t } = useLanguage();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [step, setStep] = useState<'PASS_PHONE' | 'BETTING'>('PASS_PHONE');
  const [bids, setBids] = useState<Bid[]>([]);

  // Dealer is the last player in the array for round 1, then shifts
  const dealerIndex = (players.length - 1 + currentRound - 1) % players.length;
  // First player to bet is the one after the dealer
  const firstPlayerIndex = (dealerIndex + 1) % players.length;

  const actualPlayerIndex = (firstPlayerIndex + currentPlayerIndex) % players.length;
  const currentPlayer = players[actualPlayerIndex];

  const handleBidSubmitted = async (bidValue: number, extraBet: number) => {
    const newBids: Bid[] = [...bids, { playerId: currentPlayer.id, bid: bidValue, extraBet }];
    setBids(newBids);

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setStep('PASS_PHONE');
    } else {
      // Dejamos que la vista nativa Betting muestre su pantalla de REVEAL cuando allBidsIn
      setStep('BETTING'); 
    }
  };

  const handleNextPhase = async () => {
     onComplete(bids);
  };

  const mockRoom: Room = {
    id: 'LOCAL_GAME',
    hostId: players[0].id,
    status: 'BETTING',
    currentRound,
    settings,
    dealerId: players[dealerIndex].id,
    playerOrder: players.map(p => p.id),
    createdAt: null as any
  };

  if (step === 'PASS_PHONE' && currentPlayerIndex < players.length) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center h-[calc(100vh-200px)]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
          className="bg-cabin-slate p-8 rounded-3xl border border-gold/30 shadow-2xl max-w-sm w-full mx-auto"
        >
          <span className="material-symbols-outlined text-6xl text-gold mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
          <h2 className="text-2xl font-display font-bold text-ice mb-2">{t('local.passPhone')}</h2>
          <p className="text-3xl font-display font-bold text-gold mb-8">{currentPlayer.name}</p>
          
          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
              setStep('BETTING');
            }}
            className="w-full h-16 rounded-xl bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep font-display text-2xl font-bold shadow-2xl shadow-gold/20 active:scale-[0.97] transition-transform flex items-center justify-center gap-3"
          >
            {t('local.iAm')} {currentPlayer.name}
          </button>
        </motion.div>
      </div>
    );
  }

  // Al terminal todos los bots, hacemos que activeId sea el host (el primero) para que salga el botón "Siguiente".
  const activeId = bids.length === players.length ? players[0].id : currentPlayer.id;

  return (
    <Betting 
      room={mockRoom} 
      players={players} 
      bids={bids} 
      currentPlayerId={activeId}
      onSubmitBid={handleBidSubmitted}
      onNextPhase={handleNextPhase}
      onToggleHighlight={async () => {}} // Local mock
    />
  );
}

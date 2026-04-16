import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player, Bid, Result, RoomSettings, Room } from '../types';
import { computeScores } from '../services/gameService';
import Results from './Results';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { track } from '@vercel/analytics';

interface LocalResultsProps {
  players: Player[];
  currentRound: number;
  bids: Bid[];
  settings: RoomSettings;
  onComplete: (results: Result[], updatedPlayers: Player[]) => void;
}

export default function LocalResults({ players, currentRound, bids, settings, onComplete }: LocalResultsProps) {
  const { t } = useLanguage();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [step, setStep] = useState<'PASS_PHONE' | 'RESULTS'>('PASS_PHONE');
  const [results, setResults] = useState<Result[]>([]);

  const dealerIndex = (players.length - 1 + currentRound - 1) % players.length;
  const firstPlayerIndex = (dealerIndex + 1) % players.length;

  const actualPlayerIndex = (firstPlayerIndex + currentPlayerIndex) % players.length;
  const currentPlayer = players[actualPlayerIndex];

  const handleResultSubmitted = async (
        tricks: number, 
        bonusSkullKingCaptured: boolean, 
        bonusPiratesCaptured: number, 
        bonusMermaidsCaptured: number,
        bonus14sColor: number,
        bonus14sBlack: boolean,
        krakenUsed: boolean,
        whiteWhaleUsed: boolean,
        lootAlliance: string | null
  ) => {
    const newResult: Result = {
      playerId: currentPlayer.id,
      tricks,
      bonusSkullKingCaptured,
      bonusPiratesCaptured,
      bonusMermaidsCaptured,
      bonus14sColor,
      bonus14sBlack,
      krakenUsed,
      whiteWhaleUsed,
      lootAlliance,
      scoreChange: 0
    };

    const newResults = [...results, newResult];

    if (currentPlayerIndex < players.length - 1) {
      setResults(newResults);
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setStep('PASS_PHONE');
    } else {
      try {
        const scoreChanges = computeScores(currentRound, newResults, bids);
        // Si no hay error matemático de reglas/bazas:
        const updatedPlayers = players.map(p => {
          const change = scoreChanges.find(c => c.playerId === p.id)?.scoreChange || 0;
          return {
            ...p,
            score: p.score + change
          };
        });

        const finalResults = newResults.map(r => ({
          ...r,
          scoreChange: scoreChanges.find(c => c.playerId === r.playerId)?.scoreChange || 0
        }));

        setResults(newResults);
        track('local_round_completed', { round: currentRound, playersCount: players.length });
        onComplete(finalResults, updatedPlayers);
      } catch (error: any) {
        alert("🚨 " + t('res.errorCalc') + "\n\n" + error.message);
        setResults([]);
        setCurrentPlayerIndex(0);
        setStep('PASS_PHONE');
      }
    }
  };

  const handleDeleteResult = async () => {
     // Local deletion only takes place if they are somehow stuck, but we auto-advance them.
     // In case they click 'edit' before we forcibly moved them, we erase their result:
     const newResults = results.filter(r => r.playerId !== currentPlayer.id);
     setResults(newResults);
  };

  const mockRoom: Room = {
    id: 'LOCAL_GAME',
    hostId: players[0].id,
    status: 'RESULTS',
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1b2b3b] p-8 rounded-3xl border border-[#fabd04]/30 shadow-2xl max-w-sm w-full mx-auto"
        >
          <span className="material-symbols-outlined text-6xl text-[#fabd04] mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
          <h2 className="text-2xl font-serif font-bold text-[#d3e4fa] mb-2">{t('local.passPhone')}</h2>
          <p className="text-3xl font-serif font-bold text-[#fabd04] mb-8">{currentPlayer.name}</p>
          
          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
              setStep('RESULTS');
            }}
            className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            {t('local.iAm')} {currentPlayer.name}
          </button>
        </motion.div>
      </div>
    );
  }

  const activeId = currentPlayer.id;

  return (
    <Results 
      room={mockRoom} 
      players={players} 
      bids={bids} 
      results={results}
      currentPlayerId={activeId}
      onSubmitResult={handleResultSubmitted}
      onDeleteResult={handleDeleteResult}
    />
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player, Bid, Result, RoomSettings } from '../types';
import { computeScores } from '../services/gameService';

interface LocalResultsProps {
  players: Player[];
  currentRound: number;
  bids: Bid[];
  settings: RoomSettings;
  onComplete: (results: Result[], updatedPlayers: Player[]) => void;
}

export default function LocalResults({ players, currentRound, bids, settings, onComplete }: LocalResultsProps) {
  const { t } = useLanguage();
  const [results, setResults] = useState<Result[]>(
    players.map(p => ({
      playerId: p.id,
      tricks: 0,
      bonusPoints: 0,
      skullKingCaptured: false,
      piratesCaptured: 0,
      whiteWhaleCaptured: false,
      krakenCaptured: false,
      lootAlliance: false,
      fourteensCaptured: 0,
    }))
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  const updateResult = (playerId: string, field: keyof Result, value: any) => {
    setResults(prev => prev.map(r => r.playerId === playerId ? { ...r, [field]: value } : r));
  };

  const handleComplete = () => {
    const totalTricks = results.reduce((sum, r) => sum + r.tricks, 0);
    if (totalTricks !== currentRound) {
      setErrorMsg(t('local.errorTotalTricks', { total: currentRound }));
      return;
    }

    // Compute scores
    const scoreChanges = computeScores(results, bids, currentRound, settings);
    
    // Update players
    const updatedPlayers = players.map(p => ({
      ...p,
      score: p.score + (scoreChanges[p.id] || 0)
    }));

    onComplete(results, updatedPlayers);
  };

  return (
    <div className="flex-grow flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flex flex-col">
        <div className="mb-10 relative flex justify-between items-start">
          <div>
            <div className="absolute -left-4 -top-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[10rem]">menu_book</span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-[#f0bd8b] mb-1 ml-4 relative z-10">{t('bet.round', { num: currentRound })}</h2>
            <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#c4c6cc] ml-4 relative z-10">{t('res.logbook')}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="w-full bg-[#ffb3ae]/10 border border-[#ffb3ae]/30 rounded-xl p-4 mb-6 flex items-start gap-3 text-left">
            <span className="material-symbols-outlined text-[#ffb3ae] text-xl shrink-0 mt-0.5">warning</span>
            <p className="font-sans text-sm text-[#ffb3ae] leading-tight">{errorMsg}</p>
          </div>
        )}

        <div className="w-full space-y-4 mb-8">
          {players.map(p => {
            const result = results.find(r => r.playerId === p.id)!;
            const bid = bids.find(b => b.playerId === p.id)?.bet || 0;
            const isExpanded = activePlayerId === p.id;

            return (
              <div key={p.id} className="bg-[#1b2b3b] rounded-xl border border-[#44474c]/30 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-sans font-bold text-[#d3e4fa]">{p.name}</p>
                      <p className="font-mono text-xs text-[#f0bd8b]/60">{t('local.bet')}: {bid}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#041424] rounded-lg border border-[#44474c]/50">
                      <button 
                        onClick={() => updateResult(p.id, 'tricks', Math.max(0, result.tricks - 1))}
                        className="w-10 h-10 flex items-center justify-center text-[#d3e4fa] hover:text-[#fabd04] transition-colors"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="w-8 text-center font-serif font-bold text-xl text-[#fabd04]">{result.tricks}</span>
                      <button 
                        onClick={() => updateResult(p.id, 'tricks', Math.min(currentRound, result.tricks + 1))}
                        className="w-10 h-10 flex items-center justify-center text-[#d3e4fa] hover:text-[#fabd04] transition-colors"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setActivePlayerId(isExpanded ? null : p.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#fabd04] text-[#261a00]' : 'bg-[#263647] text-[#d3e4fa] hover:bg-[#364657]'}`}
                    >
                      <span className="material-symbols-outlined">{isExpanded ? 'expand_less' : 'stars'}</span>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-[#0c1d2c] border-t border-[#44474c]/30"
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {settings.characterBonusesEnabled && (
                          <>
                            <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg">
                              <span className="font-sans text-sm text-[#d3e4fa]">{t('local.skullKingCaptured')}</span>
                              <input 
                                type="checkbox" 
                                checked={result.skullKingCaptured}
                                onChange={(e) => updateResult(p.id, 'skullKingCaptured', e.target.checked)}
                                className="w-5 h-5 accent-[#fabd04]"
                              />
                            </div>
                            <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg">
                              <span className="font-sans text-sm text-[#d3e4fa]">{t('local.piratesCaptured')}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateResult(p.id, 'piratesCaptured', Math.max(0, result.piratesCaptured - 1))} className="text-[#f0bd8b]"><span className="material-symbols-outlined text-sm">remove</span></button>
                                <span className="font-mono text-[#fabd04]">{result.piratesCaptured}</span>
                                <button onClick={() => updateResult(p.id, 'piratesCaptured', Math.min(5, result.piratesCaptured + 1))} className="text-[#f0bd8b]"><span className="material-symbols-outlined text-sm">add</span></button>
                              </div>
                            </div>
                          </>
                        )}
                        {settings.krakenEnabled && (
                          <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg">
                            <span className="font-sans text-sm text-[#d3e4fa]">{t('local.krakenCaptured')}</span>
                            <input 
                              type="checkbox" 
                              checked={result.krakenCaptured}
                              onChange={(e) => updateResult(p.id, 'krakenCaptured', e.target.checked)}
                              className="w-5 h-5 accent-[#ffb3ae]"
                            />
                          </div>
                        )}
                        {settings.whiteWhaleEnabled && (
                          <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg">
                            <span className="font-sans text-sm text-[#d3e4fa]">{t('local.whiteWhaleCaptured')}</span>
                            <input 
                              type="checkbox" 
                              checked={result.whiteWhaleCaptured}
                              onChange={(e) => updateResult(p.id, 'whiteWhaleCaptured', e.target.checked)}
                              className="w-5 h-5 accent-[#d3e4fa]"
                            />
                          </div>
                        )}
                        {settings.fourteenBonusesEnabled && (
                          <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg">
                            <span className="font-sans text-sm text-[#d3e4fa]">{t('local.fourteensCaptured')}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateResult(p.id, 'fourteensCaptured', Math.max(0, result.fourteensCaptured - 1))} className="text-[#f0bd8b]"><span className="material-symbols-outlined text-sm">remove</span></button>
                              <span className="font-mono text-[#fabd04]">{result.fourteensCaptured}</span>
                              <button onClick={() => updateResult(p.id, 'fourteensCaptured', Math.min(4, result.fourteensCaptured + 1))} className="text-[#f0bd8b]"><span className="material-symbols-outlined text-sm">add</span></button>
                            </div>
                          </div>
                        )}
                        {settings.lootEnabled && (
                          <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg">
                            <span className="font-sans text-sm text-[#d3e4fa]">{t('local.lootAlliance')}</span>
                            <input 
                              type="checkbox" 
                              checked={result.lootAlliance}
                              onChange={(e) => updateResult(p.id, 'lootAlliance', e.target.checked)}
                              className="w-5 h-5 accent-[#fabd04]"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg sm:col-span-2">
                          <span className="font-sans text-sm text-[#d3e4fa]">{t('local.otherBonus')}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateResult(p.id, 'bonusPoints', result.bonusPoints - 10)} className="text-[#f0bd8b]"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <span className="font-mono text-[#fabd04] w-8 text-center">{result.bonusPoints}</span>
                            <button onClick={() => updateResult(p.id, 'bonusPoints', result.bonusPoints + 10)} className="text-[#f0bd8b]"><span className="material-symbols-outlined text-sm">add</span></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleComplete}
          className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-3xl">calculate</span>
          {t('local.calculate')}
        </button>
      </div>
    </div>
  );
}

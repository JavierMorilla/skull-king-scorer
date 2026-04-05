import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player, Bid, Result, RoomSettings } from '../types';
import { computeScores } from '../services/gameService';

const Switch = ({ checked, onChange, colorClass = "bg-[#fabd04]" }: { checked: boolean, onChange: (c: boolean) => void, colorClass?: string }) => (
  <div 
    onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${checked ? colorClass : 'bg-[#1b2b3b] border border-[#44474c]'}`}
  >
    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
);

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
      bonusSkullKingCaptured: false,
      bonusPiratesCaptured: 0,
      bonusMermaidsCaptured: 0,
      bonus14sColor: 0,
      bonus14sBlack: false,
      krakenUsed: false,
      whiteWhaleUsed: false,
      lootAlliance: null,
      scoreChange: 0,
    }))
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  const getTranslatedError = (errorStr: string) => {
    if (!errorStr) return '';
    if (errorStr.startsWith('ERROR_TRICKS_MISMATCH')) {
      const parts = errorStr.split('|');
      return t('res.errTricks', { total: parts[1], expected: parts[2] });
    }
    if (errorStr === 'ERROR_MULTIPLE_SKULL_KINGS') return t('res.errSK');
    if (errorStr === 'ERROR_TOO_MANY_MERMAIDS') return t('res.errMermaid');
    if (errorStr === 'ERROR_TOO_MANY_PIRATES') return t('res.errPirate');
    if (errorStr === 'ERROR_TOO_MANY_14S') return t('res.err14s');
    return errorStr;
  };

  const updateResult = (playerId: string, field: keyof Result, value: any) => {
    setResults(prev => prev.map(r => {
      if (r.playerId === playerId) {
        const newResult = { ...r, [field]: value };
        if (field === 'tricks' && value === 0) {
          newResult.bonusSkullKingCaptured = false;
          newResult.bonusPiratesCaptured = 0;
          newResult.bonusMermaidsCaptured = 0;
          newResult.bonus14sColor = 0;
          newResult.bonus14sBlack = false;
        }
        return newResult;
      }
      return r;
    }));
  };

  const handleComplete = () => {
    try {
      // Compute scores
      const scoreChanges = computeScores(currentRound, results, bids);
      
      // Update players
      const updatedPlayers = players.map(p => {
        const change = scoreChanges.find(c => c.playerId === p.id)?.scoreChange || 0;
        return {
          ...p,
          score: p.score + change
        };
      });

      // Update results with scoreChange
      const finalResults = results.map(r => ({
        ...r,
        scoreChange: scoreChanges.find(c => c.playerId === r.playerId)?.scoreChange || 0
      }));

      onComplete(finalResults, updatedPlayers);
    } catch (error: any) {
      setErrorMsg(getTranslatedError(error.message));
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flex flex-col">
        <div className="mb-10 relative flex justify-between items-start">
          <div>
            <div className="absolute -left-4 -top-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[10rem]">menu_book</span>
            </div>
            <h2 className="font-sans text-4xl font-bold text-[#f0bd8b] mb-1 ml-4 relative z-10">{t('bet.round', { num: currentRound })}</h2>
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
            const bid = bids.find(b => b.playerId === p.id)?.bid || 0;
            const isExpanded = activePlayerId === p.id;
            const totalTricks = results.reduce((sum, r) => sum + r.tricks, 0);
            const krakenWasUsed = results.some(r => r.krakenUsed);
            const expectedTricks = krakenWasUsed ? currentRound - 1 : currentRound;
            const maxTricksForPlayer = expectedTricks - (totalTricks - result.tricks);

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
                        className={`w-10 h-10 flex items-center justify-center transition-colors ${result.tricks <= 0 ? 'text-[#c4c6cc]/30 cursor-not-allowed' : 'text-[#d3e4fa] hover:text-[#fabd04]'}`}
                        disabled={result.tricks <= 0}
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="w-8 text-center font-sans font-bold text-xl text-[#fabd04]">{result.tricks}</span>
                      <button 
                        onClick={() => updateResult(p.id, 'tricks', Math.min(maxTricksForPlayer, result.tricks + 1))}
                        className={`w-10 h-10 flex items-center justify-center transition-colors ${result.tricks >= maxTricksForPlayer ? 'text-[#c4c6cc]/30 cursor-not-allowed' : 'text-[#d3e4fa] hover:text-[#fabd04]'}`}
                        disabled={result.tricks >= maxTricksForPlayer}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setActivePlayerId(isExpanded ? null : p.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#fabd04] text-[#261a00]' : 'bg-[#263647] text-[#d3e4fa] hover:bg-[#364657]'}`}
                    >
                      <span className="material-symbols-outlined">{isExpanded ? 'expand_less' : 'edit'}</span>
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
                      <div className="p-4 space-y-4">
                        {settings.krakenEnabled && (
                          <div className="bg-[#0c1d2c] p-4 rounded-xl border border-[#ffb3ae]/20 relative z-10">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#ffb3ae] text-2xl">water_drop</span>
                                <div className="text-left">
                                  <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.krakenTitle')}</span>
                                  <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.krakenSub')}</span>
                                </div>
                              </div>
                              <Switch 
                                checked={result.krakenUsed} 
                                onChange={(c) => updateResult(p.id, 'krakenUsed', c)} 
                                colorClass="bg-[#ffb3ae]"
                              />
                            </label>
                          </div>
                        )}

                        {settings.whiteWhaleEnabled && (
                          <div className="bg-[#0c1d2c] p-4 rounded-xl border border-[#d3e4fa]/20 relative z-10">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#d3e4fa] text-2xl">sailing</span>
                                <div className="text-left">
                                  <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.whaleTitle')}</span>
                                  <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.whaleSub')}</span>
                                </div>
                              </div>
                              <Switch 
                                checked={result.whiteWhaleUsed} 
                                onChange={(c) => updateResult(p.id, 'whiteWhaleUsed', c)} 
                                colorClass="bg-[#d3e4fa]"
                              />
                            </label>
                          </div>
                        )}

                        {settings.lootEnabled && (
                          <div className="bg-[#0c1d2c] p-4 rounded-xl border border-[#fabd04]/20 relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="material-symbols-outlined text-[#fabd04] text-2xl">handshake</span>
                              <div className="text-left">
                                <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.lootTitle')}</span>
                                <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.lootSub')}</span>
                              </div>
                            </div>
                            <select
                              value={result.lootAlliance || ''}
                              onChange={(e) => updateResult(p.id, 'lootAlliance', e.target.value || null)}
                              className="w-full bg-[#1b2b3b] border border-[#fabd04]/30 rounded-lg p-3 text-[#d3e4fa] font-sans focus:ring-2 focus:ring-[#fabd04]/50 outline-none"
                            >
                              <option value="">{t('res.lootNone')}</option>
                              {players.filter(other => other.id !== p.id).map(other => (
                                <option key={other.id} value={other.id}>{other.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {result.tricks > 0 && (
                          <>
                            {settings.characterBonusesEnabled && (
                              <div className="bg-[#0c1d2c] p-4 rounded-xl border border-[#fabd04]/20 relative z-10">
                                <p className="font-mono text-xs uppercase tracking-widest text-[#f0bd8b] mb-4">{t('res.capTitle')}</p>
                                <div className="space-y-4">
                                  <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-[#263647] flex items-center justify-center text-[#ffb3ae]">
                                        <span className="material-symbols-outlined text-xl">waves</span>
                                      </div>
                                      <div className="text-left">
                                        <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.capMermaid')}</span>
                                        <span className="font-mono text-[10px] text-[#c4c6cc] uppercase">{t('res.capMermaidPts')}</span>
                                      </div>
                                    </div>
                                    <Switch 
                                      checked={result.bonusSkullKingCaptured} 
                                      onChange={(c) => updateResult(p.id, 'bonusSkullKingCaptured', c)} 
                                      colorClass="bg-[#fabd04]"
                                    />
                                  </label>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-[#362600] flex items-center justify-center text-[#fabd04]">
                                        <span className="material-symbols-outlined text-xl">crown</span>
                                      </div>
                                      <div className="text-left">
                                        <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.capKing')}</span>
                                        <span className="font-mono text-[10px] text-[#c4c6cc] uppercase">{t('res.capKingPts')}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => updateResult(p.id, 'bonusPiratesCaptured', Math.max(0, result.bonusPiratesCaptured - 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">remove</span></button>
                                      <span className="font-mono text-lg font-bold text-white w-4 text-center">{result.bonusPiratesCaptured}</span>
                                      <button onClick={() => updateResult(p.id, 'bonusPiratesCaptured', Math.min(5, result.bonusPiratesCaptured + 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">add</span></button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-[#263647] flex items-center justify-center text-[#f0bd8b]">
                                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
                                      </div>
                                      <div className="text-left">
                                        <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.capPirate')}</span>
                                        <span className="font-mono text-[10px] text-[#c4c6cc] uppercase">{t('res.capPiratePts')}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => updateResult(p.id, 'bonusMermaidsCaptured', Math.max(0, result.bonusMermaidsCaptured - 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">remove</span></button>
                                      <span className="font-mono text-lg font-bold text-white w-4 text-center">{result.bonusMermaidsCaptured}</span>
                                      <button onClick={() => updateResult(p.id, 'bonusMermaidsCaptured', Math.min(2, result.bonusMermaidsCaptured + 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">add</span></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {settings.fourteenBonusesEnabled && (
                              <div className="bg-[#0c1d2c] p-4 rounded-xl border border-[#f0bd8b]/20 relative z-10 space-y-4">
                                <p className="font-mono text-xs uppercase tracking-widest text-[#f0bd8b] mb-4">{t('res.14Title')}</p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#263647] flex items-center justify-center text-[#f0bd8b]">
                                      <span className="material-symbols-outlined text-xl">diamond</span>
                                    </div>
                                    <div className="text-left">
                                      <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.14Color')}</span>
                                      <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.14ColorPts')}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => updateResult(p.id, 'bonus14sColor', Math.max(0, result.bonus14sColor - 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">remove</span></button>
                                    <span className="font-mono text-lg font-bold text-white w-4 text-center">{result.bonus14sColor}</span>
                                    <button onClick={() => updateResult(p.id, 'bonus14sColor', Math.min(3, result.bonus14sColor + 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">add</span></button>
                                  </div>
                                </div>

                                <label className="flex items-center justify-between cursor-pointer group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#102130] flex items-center justify-center text-[#c4c6cc] border border-[#c4c6cc]/30">
                                      <span className="material-symbols-outlined text-xl">flag</span>
                                    </div>
                                    <div className="text-left">
                                      <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.14Black')}</span>
                                      <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.14BlackPts')}</span>
                                    </div>
                                  </div>
                                  <Switch 
                                    checked={result.bonus14sBlack} 
                                    onChange={(c) => updateResult(p.id, 'bonus14sBlack', c)} 
                                    colorClass="bg-[#fabd04]"
                                  />
                                </label>
                              </div>
                            )}
                          </>
                        )}
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
          className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-sans text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-3xl">calculate</span>
          {t('local.calculate')}
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Player, Bid, Result } from '../types';
import { submitResult, calculateRoundScores, deleteResult } from '../services/gameService';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n/LanguageContext';

interface ResultsProps {
  room: Room;
  players: Player[];
  bids: Bid[];
  results: Result[];
  key?: string;
}

const Switch = ({ checked, onChange, colorClass = "bg-[#fabd04]" }: { checked: boolean, onChange: (c: boolean) => void, colorClass?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${checked ? colorClass : 'bg-[#1b2b3b]'}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

export default function Results({ room, players, bids, results }: ResultsProps) {
  const { t } = useLanguage();
  const currentPlayer = players.find(p => p.id === auth.currentUser?.uid);
  const currentBidObj = bids.find(b => b.playerId === auth.currentUser?.uid);
  const currentBid = currentBidObj?.bid || 0;
  const hasExtraBet = currentBidObj?.extraBet || false;
  const hasResult = results.some(r => r.playerId === auth.currentUser?.uid);
  const isHost = room.hostId === auth.currentUser?.uid;
  const allResultsIn = results.length === players.length;

  const [tricks, setTricks] = useState(0);
  const [bonusSkullKingCaptured, setBonusSkullKingCaptured] = useState(false);
  const [bonusPiratesCaptured, setBonusPiratesCaptured] = useState(0);
  const [bonusMermaidsCaptured, setBonusMermaidsCaptured] = useState(0);
  const [bonus14sColor, setBonus14sColor] = useState(0);
  const [bonus14sBlack, setBonus14sBlack] = useState(false);
  const [krakenUsed, setKrakenUsed] = useState(false);
  const [whiteWhaleUsed, setWhiteWhaleUsed] = useState(false);
  const [lootAlliance, setLootAlliance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);

  useEffect(() => {
    if (isHost && allResultsIn) {
      const autoCalculate = async () => {
        setLoading(true);
        try {
          await calculateRoundScores(room.id, room.currentRound, players);
          await updateDoc(doc(db, 'rooms', room.id), { roundError: null });
        } catch (error: any) {
          await updateDoc(doc(db, 'rooms', room.id), { roundError: error.message || 'Error al calcular puntuaciones. Verifica que los datos sean correctos.' });
        }
        setLoading(false);
      };
      autoCalculate();
    }
  }, [isHost, allResultsIn, room.id, room.currentRound, players]);

  const handleConfirmResult = async () => {
    setLoading(true);
    try {
      await submitResult(
        room.id, 
        room.currentRound, 
        tricks, 
        tricks > 0 ? bonusSkullKingCaptured : false, 
        tricks > 0 ? bonusPiratesCaptured : 0, 
        tricks > 0 ? bonusMermaidsCaptured : 0,
        tricks > 0 ? bonus14sColor : 0,
        tricks > 0 ? bonus14sBlack : false,
        krakenUsed,
        whiteWhaleUsed,
        lootAlliance
      );
    } catch (error) {
      console.error(error);
      alert(t('res.errorSubmit'));
    }
    setLoading(false);
  };

  const handleDeleteResult = async () => {
    setLoading(true);
    try {
      await deleteResult(room.id, room.currentRound);
      if (isHost && room.roundError) {
        await updateDoc(doc(db, 'rooms', room.id), { roundError: null });
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getTranslatedError = (errorStr: string) => {
    if (errorStr.startsWith('ERROR_TRICKS_MISMATCH')) {
      const parts = errorStr.split('|');
      return t('res.errorTricksMismatch', { total: parts[1], expected: parts[2] });
    }
    if (errorStr === 'ERROR_MULTIPLE_SKULL_KINGS') return t('res.errorMultipleSkullKings');
    if (errorStr === 'ERROR_TOO_MANY_MERMAIDS') return t('res.errorTooManyMermaids');
    if (errorStr === 'ERROR_TOO_MANY_PIRATES') return t('res.errorTooManyPirates');
    if (errorStr === 'ERROR_TOO_MANY_14S') return t('res.errorTooMany14s');
    if (errorStr === 'ERROR_GENERIC') return t('res.errorCalc');
    return errorStr;
  };

  if (hasResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="flex-grow pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex flex-col items-center justify-center text-center"
      >
        {room.roundError && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 w-full max-w-xs mx-auto">
            <span className="material-symbols-outlined text-red-400 mb-2 block mx-auto text-3xl">warning</span>
            <p className="font-sans text-sm">{getTranslatedError(room.roundError)}</p>
          </div>
        )}
        <span className="material-symbols-outlined text-[#fabd04] text-6xl mb-4 animate-pulse">explore</span>
        <h2 className="font-serif text-3xl font-bold text-[#d3e4fa] mb-2">{t('res.registeredTitle')}</h2>
        <p className="text-[#f0bd8b]/80 font-sans">{t('res.registeredSub')}</p>
        <div className="mt-8 space-y-2">
          {players.map(p => {
            const playerResult = results.find(r => r.playerId === p.id);
            return (
              <div key={p.id} className="flex items-center justify-between bg-[#1b2b3b] p-3 rounded-lg w-full max-w-xs mx-auto">
                <span className="font-sans text-[#d3e4fa]">{p.name}</span>
                {playerResult ? (
                  <span className="material-symbols-outlined text-[#fabd04] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-[#44474c] text-xl">pending</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={handleDeleteResult}
          disabled={loading}
          className="mt-8 bg-[#1b2b3b] text-[#fabd04] py-3 px-6 rounded-xl border border-[#fabd04]/30 shadow-lg hover:bg-[#263647] transition-colors flex items-center gap-2 mx-auto active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          <span className="font-mono uppercase tracking-wider text-sm">{t('res.edit')}</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-grow pt-24 px-6 max-w-lg mx-auto w-full pb-32"
    >
      <div className="mb-10 relative flex justify-between items-start">
        <div>
          <div className="absolute -left-4 -top-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[10rem]">menu_book</span>
          </div>
          <h2 className="font-serif text-4xl font-bold text-[#f0bd8b] mb-1 ml-4 relative z-10">{t('bet.round', { num: room.currentRound })}</h2>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-[#c4c6cc] ml-4 relative z-10">{t('res.logbook')}</p>
        </div>
        <button 
          onClick={() => setShowBidsModal(true)}
          className="bg-[#1b2b3b] text-[#fabd04] p-3 rounded-xl border border-[#fabd04]/30 shadow-lg hover:bg-[#263647] transition-colors flex items-center gap-2 z-10 active:scale-95"
          title={t('res.viewBets')}
        >
          <span className="material-symbols-outlined text-2xl">visibility</span>
        </button>
      </div>

      <div className="bg-[#1b2b3b] rounded-xl p-6 shadow-xl relative overflow-hidden group mb-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4a373 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>
        
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <h3 className="font-serif text-2xl text-[#d3e4fa]">{currentPlayer?.name}</h3>
            <p className="font-mono text-[#fabd04] text-sm">{t('res.currentBet')} <span className="text-lg">{currentBid}</span> {t('res.tricks')}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs text-[#c4c6cc] block uppercase">{t('res.totalScore')}</span>
            <span className="font-mono text-3xl font-bold text-[#f0bd8b]">{currentPlayer?.score || 0}</span>
          </div>
        </div>

        <div className="mb-10 bg-[#0c1d2c] rounded-lg p-5 relative z-10">
          <label className="font-mono text-sm text-[#c4c6cc] uppercase tracking-widest block mb-4 text-center">{t('res.tricksWon')}</label>
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => {
                const newTricks = Math.max(0, tricks - 1);
                setTricks(newTricks);
                if (newTricks === 0) {
                  setBonusSkullKingCaptured(false);
                  setBonusPiratesCaptured(0);
                  setBonusMermaidsCaptured(0);
                  setBonus14sColor(0);
                  setBonus14sBlack(false);
                }
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 ${tricks <= 0 ? 'bg-[#1b2b3b] text-[#c4c6cc]/30 cursor-not-allowed' : 'bg-[#263647] text-[#fabd04] hover:bg-[#fabd04] hover:text-[#3f2e00] active:scale-95'}`}
              disabled={tricks <= 0}
            >
              <span className="material-symbols-outlined text-3xl">remove</span>
            </button>
            <div className="flex-1 text-center">
              <span className="font-mono text-6xl font-extrabold text-white">{tricks}</span>
            </div>
            <button 
              onClick={() => setTricks(Math.min(room.currentRound, tricks + 1))}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 ${tricks >= room.currentRound ? 'bg-[#1b2b3b] text-[#c4c6cc]/30 cursor-not-allowed' : 'bg-[#263647] text-[#fabd04] hover:bg-[#fabd04] hover:text-[#3f2e00] active:scale-95'}`}
              disabled={tricks >= room.currentRound}
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        </div>

        {room.settings?.krakenEnabled && (
          <div className="mb-6 bg-[#0c1d2c] p-4 rounded-xl border border-[#ffb3ae]/20 relative z-10 space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffb3ae] text-2xl">water_drop</span>
                <div className="text-left">
                  <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.krakenTitle')}</span>
                  <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.krakenSub')}</span>
                </div>
              </div>
              <Switch 
                checked={krakenUsed} 
                onChange={setKrakenUsed} 
                colorClass="bg-[#ffb3ae]"
              />
            </label>
          </div>
        )}

        {room.settings?.whiteWhaleEnabled && (
          <div className="mb-6 bg-[#0c1d2c] p-4 rounded-xl border border-[#d3e4fa]/20 relative z-10 space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#d3e4fa] text-2xl">sailing</span>
                <div className="text-left">
                  <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.whaleTitle')}</span>
                  <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.whaleSub')}</span>
                </div>
              </div>
              <Switch 
                checked={whiteWhaleUsed} 
                onChange={setWhiteWhaleUsed} 
                colorClass="bg-[#d3e4fa]"
              />
            </label>
          </div>
        )}

        {room.settings?.lootEnabled && (
          <div className="mb-6 bg-[#0c1d2c] p-4 rounded-xl border border-[#fabd04]/20 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-[#fabd04] text-2xl">handshake</span>
              <div className="text-left">
                <span className="font-sans font-bold text-[#d3e4fa] block">{t('res.lootTitle')}</span>
                <span className="font-mono text-[10px] text-[#c4c6cc] uppercase tracking-wider">{t('res.lootSub')}</span>
              </div>
            </div>
            <select
              value={lootAlliance || ''}
              onChange={(e) => setLootAlliance(e.target.value || null)}
              className="w-full bg-[#1b2b3b] border border-[#fabd04]/30 rounded-lg p-3 text-[#d3e4fa] font-sans focus:ring-2 focus:ring-[#fabd04]/50 outline-none"
            >
              <option value="">{t('res.lootNone')}</option>
              {players.filter(p => p.id !== currentPlayer?.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {tricks > 0 && (
          <>
            {room.settings?.characterBonusesEnabled && (
              <div className="mb-4 bg-[#0c1d2c] p-4 rounded-xl border border-[#fabd04]/20 relative z-10">
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
                      checked={bonusSkullKingCaptured} 
                      onChange={setBonusSkullKingCaptured} 
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
                      <button onClick={() => setBonusPiratesCaptured(Math.max(0, bonusPiratesCaptured - 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">remove</span></button>
                      <span className="font-mono text-lg font-bold text-white w-4 text-center">{bonusPiratesCaptured}</span>
                      <button onClick={() => setBonusPiratesCaptured(Math.min(5, bonusPiratesCaptured + 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">add</span></button>
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
                      <button onClick={() => setBonusMermaidsCaptured(Math.max(0, bonusMermaidsCaptured - 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">remove</span></button>
                      <span className="font-mono text-lg font-bold text-white w-4 text-center">{bonusMermaidsCaptured}</span>
                      <button onClick={() => setBonusMermaidsCaptured(Math.min(2, bonusMermaidsCaptured + 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">add</span></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {room.settings?.fourteenBonusesEnabled && (
              <div className="mb-4 bg-[#0c1d2c] p-4 rounded-xl border border-[#f0bd8b]/20 relative z-10 space-y-4">
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
                    <button onClick={() => setBonus14sColor(Math.max(0, bonus14sColor - 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">remove</span></button>
                    <span className="font-mono text-lg font-bold text-white w-4 text-center">{bonus14sColor}</span>
                    <button onClick={() => setBonus14sColor(Math.min(3, bonus14sColor + 1))} className="w-8 h-8 rounded-full bg-[#263647] flex items-center justify-center text-[#fabd04]"><span className="material-symbols-outlined text-base">add</span></button>
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
                    checked={bonus14sBlack} 
                    onChange={setBonus14sBlack} 
                    colorClass="bg-[#fabd04]"
                  />
                </label>
              </div>
            )}
          </>
        )}

        <p className="font-mono text-[10px] text-center text-[#c4c6cc] italic opacity-50 uppercase tracking-widest mt-6 relative z-10">
          {t('res.warning')}
        </p>
      </div>

      <button 
        onClick={handleConfirmResult}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif font-bold text-xl py-5 rounded-xl shadow-lg shadow-[#fabd04]/20 active:scale-95 duration-150 transition-transform disabled:opacity-50"
      >
        {t('res.confirm')}
      </button>

      <div className="fixed top-1/2 -right-20 -translate-y-1/2 rotate-12 opacity-5 pointer-events-none">
        <span className="material-symbols-outlined text-[24rem]">explore</span>
      </div>

      <AnimatePresence>
        {showBidsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#041424]/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1b2b3b] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#fabd04]/20 relative"
            >
              <button 
                onClick={() => setShowBidsModal(false)}
                className="absolute top-4 right-4 text-[#c4c6cc] hover:text-[#fabd04] transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
              
              <h3 className="font-serif text-2xl font-bold text-[#d3e4fa] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fabd04] text-2xl">visibility</span>
                {t('res.betsTitle')}
              </h3>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {players.map(p => {
                  const playerBid = bids.find(b => b.playerId === p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-[#0c1d2c] p-3 rounded-xl border border-[#fabd04]/10">
                      <span className="font-sans text-[#d3e4fa] font-bold">{p.name}</span>
                      <div className="bg-[#1b2b3b] w-10 h-10 rounded-full flex items-center justify-center border border-[#fabd04]/30">
                        <span className="font-mono text-xl text-[#fabd04] font-bold">{playerBid?.bid ?? '?'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Player, Bid, Result } from '../types';
import { submitResult, calculateRoundScores, deleteResult } from '../services/gameService';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n/LanguageContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { track } from '@vercel/analytics';
import { useToast } from './Toast';

interface ResultsProps {
  room: Room;
  players: Player[];
  bids: Bid[];
  results: Result[];
  key?: string;
  currentPlayerId?: string;
  onSubmitResult?: (
        tricks: number, 
        bonusSkullKingCaptured: boolean, 
        bonusPiratesCaptured: number, 
        bonusMermaidsCaptured: number,
        bonus14sColor: number,
        bonus14sBlack: boolean,
        krakenUsed: boolean,
        whiteWhaleUsed: boolean,
        whiteWhaleDestroyedTrick: boolean,
        lootAlliance: string | null
  ) => Promise<void>;
  onDeleteResult?: () => Promise<void>;
}

const Switch = memo(({ checked, onChange, colorClass = "bg-gold", ariaLabel }: { checked: boolean, onChange: (c: boolean) => void, colorClass?: string, ariaLabel?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-abyssal-deep ${checked ? colorClass : 'bg-cabin-slate'}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
));
const NumericalBonus = memo(({ 
  label, 
  subLabel, 
  value, 
  max, 
  icon, 
  iconBg, 
  onIncrease, 
  onDecrease,
  t
}: { 
  label: string, 
  subLabel: string, 
  value: number, 
  max: number, 
  icon: string, 
  iconBg: string, 
  onIncrease: () => void, 
  onDecrease: () => void,
  t: any
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full ${iconBg} shadow-inner border border-gold/20 flex items-center justify-center`}>
        <span className="text-2xl drop-shadow-md">{icon}</span>
      </div>
      <div className="text-left">
        <span className="font-sans font-bold text-ice block">{label}</span>
        <span className="font-mono text-[10px] text-slate-mist uppercase">{subLabel}</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onDecrease} 
        aria-label={`${t('common.reduce')} ${label}`}
        disabled={value <= 0}
        className="w-11 h-11 rounded-full bg-cabin-slate flex items-center justify-center text-gold hover:bg-cabin-slate/80 transition-colors disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-base">remove</span>
      </button>
      <span className="font-mono text-lg font-bold text-white w-4 text-center">{value}</span>
      <button 
        onClick={onIncrease} 
        aria-label={`${t('common.increase')} ${label}`}
        disabled={value >= max}
        className="w-11 h-11 rounded-full bg-cabin-slate flex items-center justify-center text-gold hover:bg-cabin-slate/80 transition-colors disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-base">add</span>
      </button>
    </div>
  </div>
));

export default function Results({ room, players, bids, results, currentPlayerId, onSubmitResult, onDeleteResult }: ResultsProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const activeUserId = currentPlayerId || auth.currentUser?.uid;
  const currentPlayer = players.find(p => p.id === activeUserId);
  const currentBidObj = bids.find(b => b.playerId === activeUserId);
  const currentBid = currentBidObj?.bid ?? 0;
  const hasExtraBet = currentBidObj?.extraBet || false;
  const hasResult = results.some(r => r.playerId === activeUserId);
  
  // Disable auto calculate if running on Local Engine
  const isHost = !currentPlayerId && room.hostId === auth.currentUser?.uid;
  const allResultsIn = results.length === players.length;

  const [tricks, setTricks] = useState(0);
  const [bonusSkullKingCaptured, setBonusSkullKingCaptured] = useState(false);
  const [bonusPiratesCaptured, setBonusPiratesCaptured] = useState(0);
  const [bonusMermaidsCaptured, setBonusMermaidsCaptured] = useState(0);
  const [bonus14sColor, setBonus14sColor] = useState(0);
  const [bonus14sBlack, setBonus14sBlack] = useState(false);
  const [krakenUsed, setKrakenUsed] = useState(false);
  const [whiteWhaleUsed, setWhiteWhaleUsed] = useState(false);
  const [whiteWhaleDestroyedTrick, setWhiteWhaleDestroyedTrick] = useState(false);
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
          await updateDoc(doc(db, 'rooms', room.id), { roundError: error.message || t('res.errorCalc') });
        }
        setLoading(false);
      };
      autoCalculate();
    }
  }, [isHost, allResultsIn, room.id, room.currentRound, players]);

  const handleConfirmResult = useCallback(async () => {
    setLoading(true);
    try {
      const resultData = [
        tricks, 
        tricks > 0 ? bonusSkullKingCaptured : false, 
        tricks > 0 ? bonusPiratesCaptured : 0, 
        tricks > 0 ? bonusMermaidsCaptured : 0,
        tricks > 0 ? bonus14sColor : 0,
        tricks > 0 ? bonus14sBlack : false,
        krakenUsed,
        whiteWhaleUsed,
        whiteWhaleDestroyedTrick,
        lootAlliance
      ] as const;

      if (onSubmitResult) {
        await onSubmitResult(...resultData);
      } else {
        await submitResult(room.id, room.currentRound, ...resultData);
      }
      track('online_round_submitted', { round: room.currentRound });
    } catch (error) {
      console.error(error);
      showToast(t('res.errorSubmit'), 'error');
    }
    setLoading(false);
  }, [tricks, bonusSkullKingCaptured, bonusPiratesCaptured, bonusMermaidsCaptured, bonus14sColor, bonus14sBlack, krakenUsed, whiteWhaleUsed, whiteWhaleDestroyedTrick, lootAlliance, onSubmitResult, room.id, room.currentRound, t]);

  const handleDeleteResult = useCallback(async () => {
    setLoading(true);
    try {
      if (onDeleteResult) {
        await onDeleteResult();
      } else {
        await deleteResult(room.id, room.currentRound);
      }
      if (isHost && room.roundError) {
        await updateDoc(doc(db, 'rooms', room.id), { roundError: null });
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [onDeleteResult, isHost, room.id, room.currentRound, room.roundError]);

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
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex-grow pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex flex-col items-center justify-center text-center"
      >
        {room.roundError && (
          <div className="bg-coral/10 border border-coral/30 text-coral p-4 rounded-xl mb-6 w-full max-w-xs mx-auto">
            <span className="material-symbols-outlined text-coral mb-2 block mx-auto text-3xl">warning</span>
            <p className="font-sans text-sm">{getTranslatedError(room.roundError)}</p>
          </div>
        )}
        <span className="material-symbols-outlined text-gold text-6xl mb-4 animate-pulse">explore</span>
        <h2 className="font-display text-3xl font-bold text-ice mb-2">{t('res.registeredTitle')}</h2>
        <p className="text-apricot/80 font-sans">{t('res.registeredSub')}</p>
        <div className="mt-8 space-y-2">
          {players.map(p => {
            const playerResult = results.find(r => r.playerId === p.id);
            return (
              <div key={p.id} className="flex items-center justify-between bg-cabin-slate p-3 rounded-lg w-full max-w-xs mx-auto">
                <span className="font-sans text-ice">{p.name}</span>
                {playerResult ? (
                  <span className="material-symbols-outlined text-gold text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-slate-mist/60 text-xl">pending</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={handleDeleteResult}
          disabled={loading}
          className="mt-8 bg-cabin-slate text-gold py-3 px-6 min-h-11 rounded-xl border border-gold/30 shadow-lg hover:bg-cabin-slate/80 transition-colors flex items-center gap-2 mx-auto active:scale-[0.97] disabled:opacity-50"
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
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex-grow pt-24 px-6 max-w-lg mx-auto w-full pb-32"
    >
      <div className="mb-10 relative flex justify-between items-start">
        <div>
          <div className="absolute -left-4 -top-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[10rem]">menu_book</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-apricot mb-1 ml-4 relative z-10">{t('bet.round', { num: room.currentRound })}</h2>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-slate-mist ml-4 relative z-10">{t('res.logbook')}</p>
        </div>
        <button 
          onClick={() => setShowBidsModal(true)}
          className="bg-cabin-slate text-gold p-3 min-h-11 min-w-11 rounded-xl border border-gold/30 shadow-lg hover:bg-cabin-slate/80 transition-colors flex items-center justify-center gap-2 z-10 active:scale-[0.97]"
          title={t('res.viewBets')}
        >
          <span className="material-symbols-outlined text-2xl">visibility</span>
        </button>
      </div>

      <div className="bg-cabin-slate rounded-xl p-6 shadow-xl relative overflow-hidden group mb-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-apricot) 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>
        
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <h3 className="font-display text-2xl text-ice">{currentPlayer?.name}</h3>
            <p className="font-mono text-gold text-sm">{t('res.currentBet')} <span className="text-lg tabular-nums">{currentBid}</span> {t('res.tricks')}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs text-slate-mist block uppercase">{t('res.totalScore')}</span>
            <span className="font-mono text-3xl font-bold text-apricot tabular-nums">{currentPlayer?.score || 0}</span>
          </div>
        </div>

        <div className="mb-10 bg-dark-void rounded-lg p-5 relative z-10">
          <label className="font-mono text-sm text-slate-mist uppercase tracking-widest block mb-4 text-center">{t('res.tricksWon')}</label>
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
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
              aria-label={`${t('res.tricksWon')} ${t('common.minusOne')}`}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 ${tricks <= 0 ? 'bg-cabin-slate text-slate-mist/30 cursor-not-allowed' : 'bg-cabin-slate text-gold hover:bg-gold hover:text-abyssal-deep active:scale-[0.97]'}`}
              disabled={tricks <= 0}
            >
              <span className="material-symbols-outlined text-3xl">remove</span>
            </button>
            <div className="flex-1 text-center overflow-hidden">
              <motion.span 
                key={tricks}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="inline-block font-mono text-6xl font-extrabold text-white"
              >
                {tricks}
              </motion.span>
            </div>
            <button 
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                setTricks(Math.min(room.currentRound, tricks + 1));
              }}
              aria-label={`${t('res.tricksWon')} ${t('common.plusOne')}`}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 ${tricks >= room.currentRound ? 'bg-cabin-slate text-slate-mist/30 cursor-not-allowed' : 'bg-cabin-slate text-gold hover:bg-gold hover:text-abyssal-deep active:scale-[0.97]'}`}
              disabled={tricks >= room.currentRound}
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        </div>

        {room.settings?.krakenEnabled && (
          <div className="mb-6 bg-dark-void p-4 rounded-xl border border-coral/20 relative z-10 space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">🦑</span>
                <div className="text-left">
                  <span className="font-sans font-bold text-ice block">{t('res.krakenTitle')}</span>
                  <span className="font-mono text-[10px] text-slate-mist uppercase tracking-wider">{t('res.krakenSub')}</span>
                </div>
              </div>
              <Switch 
                checked={krakenUsed} 
                ariaLabel={t('res.krakenTitle')}
                onChange={(c) => {
                  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                  setKrakenUsed(c);
                }} 
                colorClass="bg-coral"
              />
            </label>
          </div>
        )}

        {room.settings?.whiteWhaleEnabled && (
          <div className="mb-6 bg-dark-void p-4 rounded-xl border border-ice/20 relative z-10 space-y-4">
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">🐋</span>
                <div className="text-left">
                  <span className="font-sans font-bold text-ice block">{t('res.whaleTitle')}</span>
                  <span className="font-mono text-[10px] text-slate-mist uppercase tracking-wider">{t('res.whaleSub')}</span>
                </div>
              </div>
              <Switch 
                checked={whiteWhaleUsed} 
                ariaLabel={t('res.whaleTitle')}
                onChange={(checked) => {
                  setWhiteWhaleUsed(checked);
                  if (!checked) setWhiteWhaleDestroyedTrick(false);
                  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                }} 
                colorClass="bg-ice"
              />
            </div>
            
            <AnimatePresence>
              {whiteWhaleUsed && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{t('res.whaleDestroyedTitle')}</p>
                      <p className="text-white/50 text-xs">{t('res.whaleDestroyedSub')}</p>
                    </div>
                    <Switch 
                      checked={whiteWhaleDestroyedTrick} 
                      onChange={(checked) => {
                        setWhiteWhaleDestroyedTrick(checked);
                        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                      }} 
                      colorClass="bg-ice"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {room.settings?.lootEnabled && (
          <div className="mb-6 bg-dark-void p-4 rounded-xl border border-gold/20 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-gold text-2xl">handshake</span>
              <div className="text-left">
                <span className="font-sans font-bold text-ice block">{t('res.lootTitle')}</span>
                <span className="font-mono text-[10px] text-slate-mist uppercase tracking-wider">{t('res.lootSub')}</span>
              </div>
            </div>
            <select
              value={lootAlliance || ''}
              onChange={(e) => setLootAlliance(e.target.value || null)}
              className="w-full bg-cabin-slate border border-gold/30 rounded-lg p-3 min-h-11 text-ice font-sans focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-abyssal-deep transition-all"
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
              <div className="mb-4 bg-dark-void p-4 rounded-xl border border-gold/20 relative z-10">
                <p className="font-mono text-xs uppercase tracking-widest text-apricot mb-4">{t('res.capTitle')}</p>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cabin-slate flex items-center justify-center border border-coral/20 shadow-inner">
                        <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">🧜‍♀️</span>
                      </div>
                      <div className="text-left">
                        <span className="font-sans font-bold text-ice block">{t('res.capMermaid')}</span>
                        <span className="font-mono text-[10px] text-slate-mist uppercase">{t('res.capMermaidPts')}</span>
                      </div>
                    </div>
                    <Switch 
                      checked={bonusSkullKingCaptured} 
                      onChange={setBonusSkullKingCaptured} 
                      ariaLabel={t('res.capMermaid')}
                      colorClass="bg-gold"
                    />
                  </label>

                  <NumericalBonus 
                    label={t('res.capKing')}
                    subLabel={t('res.capKingPts')}
                    value={bonusPiratesCaptured}
                    max={5}
                    icon="👑"
                    iconBg="bg-cabin-slate"
                    onIncrease={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); setBonusPiratesCaptured(Math.min(5, bonusPiratesCaptured + 1)); }}
                    onDecrease={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); setBonusPiratesCaptured(Math.max(0, bonusPiratesCaptured - 1)); }}
                    t={t}
                  />

                  <NumericalBonus 
                    label={t('res.capPirate')}
                    subLabel={t('res.capPiratePts')}
                    value={bonusMermaidsCaptured}
                    max={2}
                    icon="🏴‍☠️"
                    iconBg="bg-cabin-slate"
                    onIncrease={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); setBonusMermaidsCaptured(Math.min(2, bonusMermaidsCaptured + 1)); }}
                    onDecrease={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); setBonusMermaidsCaptured(Math.max(0, bonusMermaidsCaptured - 1)); }}
                    t={t}
                  />
                </div>
              </div>
            )}

            {room.settings?.fourteenBonusesEnabled && (
              <div className="mb-4 bg-dark-void p-4 rounded-xl border border-apricot/20 relative z-10 space-y-4">
                <p className="font-mono text-xs uppercase tracking-widest text-apricot mb-4">{t('res.14Title')}</p>
                
                <NumericalBonus 
                  label={t('res.14Color')}
                  subLabel={t('res.14ColorPts')}
                  value={bonus14sColor}
                  max={3}
                  icon="💎"
                  iconBg="bg-cabin-slate"
                  onIncrease={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); setBonus14sColor(Math.min(3, bonus14sColor + 1)); }}
                  onDecrease={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); setBonus14sColor(Math.max(0, bonus14sColor - 1)); }}
                  t={t}
                />

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-void/80 flex items-center justify-center text-slate-mist border border-slate-mist/30">
                      <span className="material-symbols-outlined text-xl">flag</span>
                    </div>
                    <div className="text-left">
                      <span className="font-sans font-bold text-ice block">{t('res.14Black')}</span>
                      <span className="font-mono text-[10px] text-slate-mist uppercase tracking-wider">{t('res.14BlackPts')}</span>
                    </div>
                  </div>
                  <Switch 
                    checked={bonus14sBlack} 
                    onChange={setBonus14sBlack} 
                    ariaLabel={t('res.14Black')}
                    colorClass="bg-gold"
                  />
                </label>
              </div>
            )}
          </>
        )}

        <p className="font-mono text-[10px] text-center text-slate-mist italic opacity-50 uppercase tracking-widest mt-6 relative z-10">
          {t('res.warning')}
        </p>
      </div>

      <button 
        onClick={handleConfirmResult}
        disabled={loading}
        className="w-full bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep font-display font-bold text-xl py-5 rounded-xl shadow-lg shadow-gold/20 active:scale-[0.97] duration-150 transition-transform disabled:opacity-50 min-h-11"
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
            className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-abyssal-deep/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
              className="bg-cabin-slate w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gold/20 relative"
            >
              <button 
                onClick={() => setShowBidsModal(false)}
                className="absolute top-4 right-4 text-slate-mist hover:text-gold transition-colors p-2 w-11 h-11 flex items-center justify-center rounded-full hover:bg-abyssal-deep/50"
                aria-label={t('app.close')}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
              
              <h3 className="font-display text-2xl font-bold text-ice mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-gold text-2xl">visibility</span>
                {t('res.betsTitle')}
              </h3>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {players.map(p => {
                  const playerBid = bids.find(b => b.playerId === p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-dark-void p-3 rounded-xl border border-gold/10">
                      <span className="font-sans text-ice font-bold">{p.name}</span>
                      <div className="bg-cabin-slate w-10 h-10 rounded-full flex items-center justify-center border border-gold/30">
                        <span className="font-mono text-xl text-gold font-bold tabular-nums">{playerBid?.bid ?? '?'}</span>
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

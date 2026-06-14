import React, { useState, useCallback, memo, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { Room, Player } from '../types';
import { startGame, toggleReady, updateRoomSettings, kickPlayer, updatePlayerOrder } from '../services/gameService';
import { auth } from '../firebase';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '../i18n/LanguageContext';

interface LobbyProps {
  room: Room;
  players: Player[];
  key?: string;
}

const Switch = memo(({ checked, onChange, colorClass = "bg-gold", disabled = false }: { checked: boolean, onChange: (c: boolean) => void, colorClass?: string, disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-abyssal-deep ${checked ? colorClass : 'bg-cabin-slate'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
));

const PlayerRow = memo(({ player, isHostUser, t, onKick }: { player: Player, isHostUser: boolean, t: any, onKick: (id: string) => void }) => (
  <div className="bg-cabin-slate p-5 rounded-xl flex items-center justify-between group transition-all hover:bg-cabin-slate/80 shadow-sm w-full">
    <div className="flex items-center gap-4">
      {isHostUser && (
        <div className="cursor-grab active:cursor-grabbing text-gold/40 hover:text-gold transition-colors p-1">
          <span className="material-symbols-outlined text-2xl">drag_indicator</span>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <p className="font-display font-bold text-xl text-ice">{player.name}</p>
          {player.isHost && <span className="material-symbols-outlined text-gold text-base" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>}
        </div>
        <p className="font-mono text-xs text-apricot/60 uppercase tracking-tighter">
          {player.isHost ? t('lobby.host') : t('lobby.sailor')}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {player.isReady ? (
        <div className="flex items-center gap-2 bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
          <span className="material-symbols-outlined text-gold text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="font-mono text-xs font-bold text-gold">{t('lobby.ready')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-dark-void px-3 py-1.5 rounded-full border border-slate-mist/30">
          <span className="material-symbols-outlined text-slate-mist text-base">hourglass_empty</span>
          <span className="font-mono text-xs font-bold text-slate-mist">{t('lobby.waiting')}</span>
        </div>
      )}
      {isHostUser && player.id !== auth.currentUser?.uid && (
        <button
          onClick={() => onKick(player.id)}
          className="text-coral/80 hover:text-coral transition-colors p-2 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-coral/10"
          title={t('lobby.kickTitle')}
          aria-label={t('lobby.kickTitle') + " " + player.name}
        >
          <span className="material-symbols-outlined text-xl">person_remove</span>
        </button>
      )}
    </div>
  </div>
));

export default function Lobby({ room, players }: LobbyProps) {
  const { t } = useLanguage();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);
  
  const isHost = room.hostId === auth.currentUser?.uid;
  const currentPlayer = players.find(p => p.id === auth.currentUser?.uid);
  const allReady = players.every(p => p.isReady);

  // Sync local state with props when not dragging
  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  const handleReorder = useCallback((newOrder: Player[]) => {
    if (!isHost) return;
    setLocalPlayers(newOrder);
    const newIds = newOrder.map(p => p.id);
    updatePlayerOrder(room.id, newIds);
  }, [isHost, room.id]);

  const handleStart = useCallback(() => {
    if (isHost && allReady) {
      setShowStartConfirm(true);
    }
  }, [isHost, allReady]);

  const confirmStart = useCallback(async () => {
    await startGame(room.id);
    setShowStartConfirm(false);
  }, [room.id]);

  const handleToggleReady = useCallback(async () => {
    if (currentPlayer) {
      await toggleReady(room.id, !currentPlayer.isReady);
    }
  }, [room.id, currentPlayer]);

  const handleToggleSetting = useCallback(async (settingId: string, currentValue: boolean) => {
    if (!isHost) return;
    const newSettings = {
      ...room.settings,
      [settingId]: !currentValue
    };
    await updateRoomSettings(room.id, newSettings);
  }, [isHost, room.id, room.settings]);

  const handleKick = useCallback(async (playerId: string) => {
    if (window.confirm(t('lobby.kickConfirm'))) {
      try {
        await kickPlayer(room.id, playerId);
      } catch (error) {
        console.error(t('lobby.errorKick'), error);
      }
    }
  }, [room.id, t]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-grow pt-24 pb-32 px-6 max-w-2xl mx-auto w-full"
    >
      <section className="mb-10 text-center relative">
        <div className="absolute inset-0 -z-10 opacity-10 flex justify-center items-center overflow-hidden">
          <span className="material-symbols-outlined text-ice text-[12rem]" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-ice mb-2">{t('lobby.title')}</h2>
        <p className="text-apricot opacity-80 font-sans text-lg italic">{t('lobby.subtitle')}</p>
      </section>

      <Reorder.Group 
        axis="y" 
        values={localPlayers} 
        onReorder={handleReorder}
        className="grid grid-cols-1 gap-4"
      >
        {localPlayers.map(player => (
          <Reorder.Item 
            key={player.id} 
            value={player}
            dragListener={isHost}
            className="w-full"
          >
            <PlayerRow 
              player={player} 
              isHostUser={isHost} 
              t={t} 
              onKick={handleKick} 
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
        {/* Empty Slot */}
        <div className="border-2 border-dashed border-slate-mist/20 p-5 rounded-xl flex items-center justify-center group hover:border-gold/30 transition-colors">
          <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-2xl">person_add</span>
            <p className="font-mono text-xs font-medium uppercase tracking-widest">{t('lobby.emptySlot')}</p>
          </div>
        </div>

      <div className="mt-8">
        <h3 className="font-display text-2xl font-bold text-ice mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-gold text-2xl">settings_suggest</span>
          {t('join.rules')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'krakenEnabled', title: t('rules.kraken'), desc: t('rules.krakenDesc'), icon: '🦑', iconType: 'emoji', color: 'text-coral', bg: 'bg-coral/10', border: 'border-coral', switchBg: 'bg-coral' },
            { id: 'whiteWhaleEnabled', title: t('rules.whale'), desc: t('rules.whaleDesc'), icon: '🐳', iconType: 'emoji', color: 'text-ice', bg: 'bg-ice/10', border: 'border-ice', switchBg: 'bg-ice' },
            { id: 'characterBonusesEnabled', title: t('rules.captures'), desc: t('rules.capturesDesc'), icon: 'swords', iconType: 'material', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold', switchBg: 'bg-gold' },
            { id: 'fourteenBonusesEnabled', title: t('rules.14s'), desc: t('rules.14sDesc'), icon: '14', iconType: 'text', color: 'text-apricot', bg: 'bg-apricot/10', border: 'border-apricot', switchBg: 'bg-apricot' },
            { id: 'extraBetEnabled', title: t('rules.extra'), desc: t('rules.extraDesc'), icon: 'casino', iconType: 'material', color: 'text-slate-mist', bg: 'bg-slate-mist/10', border: 'border-slate-mist', switchBg: 'bg-slate-mist' },
            { id: 'lootEnabled', title: t('rules.loot'), desc: t('rules.lootDesc'), icon: 'handshake', iconType: 'material', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold', switchBg: 'bg-gold' },
          ].map((option) => {
            const isEnabled = room.settings?.[option.id as keyof typeof room.settings] || false;
            return (
              <div
                key={option.id}
                onClick={() => isHost && handleToggleSetting(option.id, isEnabled)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2 overflow-hidden group ${
                  isEnabled
                    ? `bg-cabin-slate/90 ${option.border} shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                    : 'bg-dark-void border-transparent'
                } ${isHost ? 'cursor-pointer hover:border-slate-mist/50' : 'cursor-default'}`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isEnabled ? `${option.bg} ${option.color}` : 'bg-cabin-slate text-slate-mist'}`}>
                    {option.iconType === 'material' && <span className="material-symbols-outlined text-xl">{option.icon as string}</span>}
                    {option.iconType === 'emoji' && <span className={`text-xl leading-none transition-all ${!isEnabled ? 'grayscale opacity-50' : ''}`}>{option.icon as string}</span>}
                    {option.iconType === 'text' && <span className="font-mono font-bold text-lg leading-none">{option.icon as string}</span>}
                  </div>
                  <Switch 
                    checked={isEnabled} 
                    onChange={() => isHost && handleToggleSetting(option.id, isEnabled)} 
                    colorClass={option.switchBg}
                    disabled={!isHost}
                  />
                </div>
                <div className="mt-1">
                  <h4 className={`font-sans font-bold text-sm transition-colors ${isEnabled ? 'text-ice' : 'text-slate-mist group-hover:text-ice'}`}>{option.title}</h4>
                  <p className="font-mono text-[9px] text-slate-mist/60 mt-0.5 leading-tight uppercase tracking-wider">{option.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-abyssal-deep via-abyssal-deep/95 to-transparent z-40">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {!isHost ? (
            <button 
              onClick={handleToggleReady}
              className={`w-full py-4 rounded-xl font-display font-bold text-lg shadow-xl active:scale-[0.97] transition-transform flex items-center justify-center gap-3 ${currentPlayer?.isReady ? 'bg-cabin-slate text-ice' : 'bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep'}`}
            >
              <span className="material-symbols-outlined text-2xl">{currentPlayer?.isReady ? 'close' : 'check'}</span>
              {currentPlayer?.isReady ? t('lobby.btnCancel') : t('lobby.btnReady')}
            </button>
          ) : (
            <button 
              onClick={handleStart}
              disabled={!allReady}
              className="w-full bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep py-4 rounded-xl font-display font-bold text-lg shadow-xl shadow-gold/10 active:scale-[0.97] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              {t('lobby.btnStart')}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showStartConfirm}
        title={t('lobby.startTitle')}
        message={t('lobby.startMsg')}
        confirmText={t('lobby.startConfirm')}
        cancelText={t('lobby.startWait')}
        onConfirm={confirmStart}
        onCancel={() => setShowStartConfirm(false)}
      />
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Room, Player } from '../types';
import { startGame, toggleReady, updateRoomSettings, kickPlayer } from '../services/gameService';
import { auth } from '../firebase';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '../i18n/LanguageContext';

interface LobbyProps {
  room: Room;
  players: Player[];
  key?: string;
}

const Switch = ({ checked, onChange, colorClass = "bg-[#fabd04]", disabled = false }: { checked: boolean, onChange: (c: boolean) => void, colorClass?: string, disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${checked ? colorClass : 'bg-[#1b2b3b]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

export default function Lobby({ room, players }: LobbyProps) {
  const { t } = useLanguage();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const isHost = room.hostId === auth.currentUser?.uid;
  const currentPlayer = players.find(p => p.id === auth.currentUser?.uid);
  const allReady = players.every(p => p.isReady);

  const handleStart = () => {
    if (isHost && allReady) {
      setShowStartConfirm(true);
    }
  };

  const confirmStart = async () => {
    await startGame(room.id);
    setShowStartConfirm(false);
  };

  const handleToggleReady = async () => {
    if (currentPlayer) {
      await toggleReady(room.id, !currentPlayer.isReady);
    }
  };

  const handleToggleSetting = async (settingId: string, currentValue: boolean) => {
    if (!isHost) return;
    const newSettings = {
      ...room.settings,
      [settingId]: !currentValue
    };
    await updateRoomSettings(room.id, newSettings);
  };

  const handleKick = async (playerId: string) => {
    if (window.confirm(t('lobby.kickConfirm'))) {
      try {
        await kickPlayer(room.id, playerId);
      } catch (error) {
        console.error('Error al expulsar jugador:', error);
      }
    }
  };

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
          <span className="material-symbols-outlined text-[#d3e4fa] text-[12rem]" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
        </div>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#d3e4fa] mb-2">{t('lobby.title')}</h2>
        <p className="text-[#f0bd8b] opacity-80 font-sans text-lg italic">{t('lobby.subtitle')}</p>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {players.map(player => (
          <div key={player.id} className="bg-[#1b2b3b] p-5 rounded-xl flex items-center justify-between group transition-all hover:bg-[#2b3b4b]/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-serif font-bold text-xl text-[#d3e4fa]">{player.name}</p>
                  {player.isHost && <span className="material-symbols-outlined text-[#fabd04] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>}
                </div>
                <p className="font-mono text-xs text-[#f0bd8b]/60 uppercase tracking-tighter">
                  {player.isHost ? t('lobby.host') : t('lobby.sailor')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {player.isReady ? (
                <div className="flex items-center gap-2 bg-[#fabd04]/10 px-3 py-1.5 rounded-full border border-[#fabd04]/20">
                  <span className="material-symbols-outlined text-[#fabd04] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-mono text-xs font-bold text-[#fabd04]">{t('lobby.ready')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#263647] px-3 py-1.5 rounded-full border border-[#44474c]/30">
                  <span className="material-symbols-outlined text-[#c4c6cc] text-base">hourglass_empty</span>
                  <span className="font-mono text-xs font-bold text-[#c4c6cc]">{t('lobby.waiting')}</span>
                </div>
              )}
              {isHost && player.id !== auth.currentUser?.uid && (
                <button
                  onClick={() => handleKick(player.id)}
                  className="text-red-500/70 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                  title={t('lobby.kickTitle')}
                >
                  <span className="material-symbols-outlined text-xl">person_remove</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty Slot */}
        <div className="border-2 border-dashed border-[#44474c]/20 p-5 rounded-xl flex items-center justify-center group hover:border-[#fabd04]/30 transition-colors">
          <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-2xl">person_add</span>
            <p className="font-mono text-xs font-medium uppercase tracking-widest">{t('lobby.emptySlot')}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-serif text-2xl font-bold text-[#d3e4fa] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fabd04] text-2xl">settings_suggest</span>
          {t('join.rules')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'krakenEnabled', title: t('rules.kraken'), desc: t('rules.krakenDesc'), icon: '🦑', iconType: 'emoji', color: 'text-[#ffb3ae]', bg: 'bg-[#ffb3ae]/10', border: 'border-[#ffb3ae]', switchBg: 'bg-[#ffb3ae]' },
            { id: 'whiteWhaleEnabled', title: t('rules.whale'), desc: t('rules.whaleDesc'), icon: '🐳', iconType: 'emoji', color: 'text-[#d3e4fa]', bg: 'bg-[#d3e4fa]/10', border: 'border-[#d3e4fa]', switchBg: 'bg-[#d3e4fa]' },
            { id: 'characterBonusesEnabled', title: t('rules.captures'), desc: t('rules.capturesDesc'), icon: 'swords', iconType: 'material', color: 'text-[#fabd04]', bg: 'bg-[#fabd04]/10', border: 'border-[#fabd04]', switchBg: 'bg-[#fabd04]' },
            { id: 'fourteenBonusesEnabled', title: t('rules.14s'), desc: t('rules.14sDesc'), icon: '14', iconType: 'text', color: 'text-[#f0bd8b]', bg: 'bg-[#f0bd8b]/10', border: 'border-[#f0bd8b]', switchBg: 'bg-[#f0bd8b]' },
            { id: 'extraBetEnabled', title: t('rules.extra'), desc: t('rules.extraDesc'), icon: 'casino', iconType: 'material', color: 'text-[#c4c6cc]', bg: 'bg-[#c4c6cc]/10', border: 'border-[#c4c6cc]', switchBg: 'bg-[#c4c6cc]' },
            { id: 'lootEnabled', title: t('rules.loot'), desc: t('rules.lootDesc'), icon: 'handshake', iconType: 'material', color: 'text-[#fabd04]', bg: 'bg-[#fabd04]/10', border: 'border-[#fabd04]', switchBg: 'bg-[#fabd04]' },
          ].map((option) => {
            const isEnabled = room.settings?.[option.id as keyof typeof room.settings] || false;
            return (
              <div
                key={option.id}
                onClick={() => isHost && handleToggleSetting(option.id, isEnabled)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2 overflow-hidden group ${
                  isEnabled
                    ? `bg-[#263647] ${option.border} shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                    : 'bg-[#0c1d2c] border-transparent'
                } ${isHost ? 'cursor-pointer hover:border-[#44474c]' : 'cursor-default'}`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isEnabled ? `${option.bg} ${option.color}` : 'bg-[#1b2b3b] text-[#c4c6cc]'}`}>
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
                  <h4 className={`font-sans font-bold text-sm transition-colors ${isEnabled ? 'text-[#d3e4fa]' : 'text-[#c4c6cc] group-hover:text-[#d3e4fa]'}`}>{option.title}</h4>
                  <p className="font-mono text-[9px] text-[#c4c6cc]/60 mt-0.5 leading-tight uppercase tracking-wider">{option.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#041424] via-[#041424]/95 to-transparent z-40">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {!isHost ? (
            <button 
              onClick={handleToggleReady}
              className={`w-full py-4 rounded-xl font-serif font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3 ${currentPlayer?.isReady ? 'bg-[#263647] text-[#d3e4fa]' : 'bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00]'}`}
            >
              <span className="material-symbols-outlined text-2xl">{currentPlayer?.isReady ? 'close' : 'check'}</span>
              {currentPlayer?.isReady ? t('lobby.btnCancel') : t('lobby.btnReady')}
            </button>
          ) : (
            <button 
              onClick={handleStart}
              disabled={!allReady}
              className="w-full bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] py-4 rounded-xl font-serif font-bold text-lg shadow-xl shadow-[#fabd04]/10 active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

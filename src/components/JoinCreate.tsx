import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createRoom, joinRoom } from '../services/gameService';
import { auth } from '../firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { track } from '@vercel/analytics';
import { sanitizeInput } from '../utils/security';

interface JoinCreateProps {
  onJoin: (roomId: string) => void;
}

interface LocalPlayerInputProps {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  placeholder: string;
}

const LocalPlayerInput = memo(({ index, value, onChange, onRemove, canRemove, placeholder }: LocalPlayerInputProps) => (
  <div className="flex items-center gap-2">
    <input
      type="text"
      value={value}
      maxLength={15}
      onChange={(e) => onChange(index, sanitizeInput(e.target.value))}
      placeholder={placeholder}
      className="w-full bg-dark-void border border-slate-mist/20 h-12 px-4 rounded-xl font-sans font-bold text-ice placeholder:text-ice/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all"
    />
    {canRemove && (
      <button 
        onClick={() => onRemove(index)} 
        className="text-coral/70 hover:text-coral hover:bg-coral/10 p-2 w-11 h-11 flex items-center justify-center rounded-xl transition-colors active:scale-[0.95]"
        aria-label="Remove player"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    )}
  </div>
));

export default function JoinCreate({ onJoin }: JoinCreateProps) {
  const { t } = useLanguage();
  const [nickname, setNickname] = useState(() => auth.currentUser?.displayName || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = useCallback(async () => {
    let user = auth.currentUser;
    if (!user) {
      const userCred = await signInAnonymously(auth);
      user = userCred.user;
    }
    if (user && user.displayName !== nickname) {
      await updateProfile(user, {
        displayName: nickname,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${nickname}`
      });
    }
  }, [nickname]);

  const [settings, setSettings] = useState({
    krakenEnabled: true,
    whiteWhaleEnabled: true,
    characterBonusesEnabled: true,
    extraBetEnabled: false,
    fourteenBonusesEnabled: true,
    lootEnabled: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showLocalSetup, setShowLocalSetup] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<string[]>(['', '']);

  const handleCreate = useCallback(async () => {
    setErrorMsg('');
    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      setErrorMsg(t('join.errorNoNickname'));
      return;
    }
    setLoading(true);
    try {
      await handleAuth();
      const roomId = await createRoom(
        trimmedNick,
        settings
      );
      track('room_created', { 
        kraken: settings.krakenEnabled,
        whale: settings.whiteWhaleEnabled,
        extraBet: settings.extraBetEnabled 
      });
      onJoin(roomId);
    } catch (error) {
      console.error(error);
      setErrorMsg(t('join.errorCreate'));
    }
    setLoading(false);
  }, [nickname, settings, handleAuth, onJoin, t]);

  const handleJoin = useCallback(async () => {
    setErrorMsg('');
    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      setErrorMsg(t('join.errorNoNickname'));
      return;
    }
    const trimmedCode = roomCode.trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length !== 4) {
      setErrorMsg(t('join.errorCode'));
      return;
    }
    setLoading(true);
    try {
      await handleAuth();
      await joinRoom(trimmedCode, trimmedNick);
      track('room_joined');
      onJoin(trimmedCode);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'NICKNAME_TAKEN') {
        setErrorMsg(t('join.errorTaken', { name: trimmedNick }));
      } else {
        setErrorMsg(t('join.errorJoin'));
      }
    }
    setLoading(false);
  }, [nickname, roomCode, handleAuth, onJoin, t]);

  const handleStartLocal = () => {
    const validPlayers = localPlayers.filter(p => p.trim() !== '');
    if (validPlayers.length < 2) {
      setErrorMsg(t('join.errorMinPlayers'));
      return;
    }
    // Pass a special flag to indicate local game
    localStorage.setItem('skullking_local_setup', JSON.stringify({ players: validPlayers, settings }));
    track('local_game_started', { playersCount: validPlayers.length });
    onJoin('LOCAL_GAME');
  };

  const addLocalPlayer = () => {
    if (localPlayers.length < 8) {
      setLocalPlayers([...localPlayers, '']);
    }
  };

  const updateLocalPlayer = useCallback((index: number, value: string) => {
    setLocalPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[index] = value;
      return newPlayers;
    });
  }, []);

  const removeLocalPlayer = useCallback((index: number) => {
    setLocalPlayers(prev => {
      if (prev.length > 2) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  if (showLocalSetup) {
    return (
      <div className="min-h-screen bg-abyssal-deep flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gold rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-ice rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob animation-delay-2000"></div>

        <div className="relative w-full max-w-md flex flex-col items-center gap-8 text-center z-10">
          <section className="flex flex-col items-center">
            <h2 className="text-4xl font-display font-bold text-ice tracking-tight leading-none mb-2">
              {t('join.localMode')}
            </h2>
            <p className="font-mono text-apricot opacity-60 uppercase tracking-widest text-xs">{t('join.localSubtitle')}</p>
          </section>

          <section className="w-full space-y-6">
            {errorMsg && (
              <div className="bg-coral/10 border border-coral/30 text-coral px-4 py-3 rounded-xl font-mono text-sm">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3 text-left">
              <label className="block font-mono text-xs uppercase tracking-widest text-apricot/60 ml-1">{t('join.players')}</label>
              {localPlayers.map((player, index) => (
                <LocalPlayerInput
                  key={index}
                  index={index}
                  value={player}
                  onChange={updateLocalPlayer}
                  onRemove={removeLocalPlayer}
                  canRemove={localPlayers.length > 2}
                  placeholder={`${t('join.player')} ${index + 1}`}
                />
              ))}
              {localPlayers.length < 8 && (
                <button 
                  onClick={addLocalPlayer} 
                  className="w-full py-3 mt-2 border border-dashed border-slate-mist/30 rounded-xl text-apricot/60 font-mono text-sm uppercase tracking-widest hover:border-gold/30 hover:text-gold transition-colors flex items-center justify-center gap-2 min-h-11 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined">add</span>
                  {t('join.addPlayer')}
                </button>
              )}
            </div>

            <div className="bg-cabin-slate rounded-2xl p-4 border border-slate-mist/10 text-left shadow-lg">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between group min-h-11"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gold text-xl">settings_suggest</span>
                  <p className="font-mono text-sm uppercase tracking-widest text-apricot/80 group-hover:text-apricot transition-colors">{t('join.rules')}</p>
                </div>
                {showSettings ? (
                  <span className="material-symbols-outlined text-apricot/60 group-hover:text-apricot transition-colors text-xl">expand_less</span>
                ) : (
                  <span className="material-symbols-outlined text-apricot/60 group-hover:text-apricot transition-colors text-xl">expand_more</span>
                )}
              </button>

              {showSettings && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { id: 'krakenEnabled', title: t('rules.kraken'), desc: t('rules.krakenDesc'), icon: '🦑', iconType: 'emoji', color: 'text-coral', bg: 'bg-coral/10', border: 'border-coral/40', switchBg: 'bg-coral' },
                    { id: 'whiteWhaleEnabled', title: t('rules.whale'), desc: t('rules.whaleDesc'), icon: '🐳', iconType: 'emoji', color: 'text-ice', bg: 'bg-ice/10', border: 'border-ice/40', switchBg: 'bg-ice' },
                    { id: 'characterBonusesEnabled', title: t('rules.captures'), desc: t('rules.capturesDesc'), icon: 'swords', iconType: 'material', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/40', switchBg: 'bg-gold' },
                    { id: 'fourteenBonusesEnabled', title: t('rules.14s'), desc: t('rules.14sDesc'), icon: '14', iconType: 'text', color: 'text-apricot', bg: 'bg-apricot/10', border: 'border-apricot/40', switchBg: 'bg-apricot' },
                    { id: 'extraBetEnabled', title: t('rules.extra'), desc: t('rules.extraDesc'), icon: 'casino', iconType: 'material', color: 'text-slate-mist', bg: 'bg-slate-mist/10', border: 'border-slate-mist/40', switchBg: 'bg-slate-mist' },
                    { id: 'lootEnabled', title: t('rules.loot'), desc: t('rules.lootDesc'), icon: 'handshake', iconType: 'material', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/40', switchBg: 'bg-gold' },
                  ].map((option) => {
                    const isEnabled = settings[option.id as keyof typeof settings];
                    return (
                      <div
                        key={option.id}
                        onClick={() => setSettings(s => ({ ...s, [option.id]: !isEnabled }))}
                        className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col gap-2 overflow-hidden group ${isEnabled
                          ? `bg-cabin-slate ${option.border} shadow-md`
                          : 'bg-dark-void border-transparent hover:border-slate-mist/20'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isEnabled ? `${option.bg} ${option.color}` : 'bg-cabin-slate text-slate-mist'}`}>
                            {option.iconType === 'material' && <span className="material-symbols-outlined text-xl">{option.icon as string}</span>}
                            {option.iconType === 'emoji' && <span className={`text-xl leading-none transition-all ${!isEnabled ? 'grayscale opacity-50' : ''}`}>{option.icon as string}</span>}
                            {option.iconType === 'text' && <span className="font-mono font-bold text-lg leading-none">{option.icon as string}</span>}
                          </div>
                          <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors duration-300 ${isEnabled ? option.switchBg : 'bg-dark-void border border-slate-mist/20'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </div>
                        <div className="mt-1">
                          <h4 className={`font-sans font-bold text-sm transition-colors ${isEnabled ? 'text-ice' : 'text-slate-mist group-hover:text-ice'}`}>{option.title}</h4>
                          <p className="font-mono text-[9px] text-slate-mist/60 mt-0.5 leading-tight uppercase tracking-wider">{option.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLocalSetup(false)}
                className="w-1/3 h-16 rounded-xl bg-cabin-slate text-ice border border-slate-mist/10 font-sans font-bold text-lg shadow-xl hover:bg-cabin-slate/80 transition-all active:scale-[0.97]"
              >
                {t('join.back')}
              </button>
              <button
                onClick={handleStartLocal}
                className="w-2/3 h-16 bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep rounded-xl font-sans font-bold text-xl shadow-xl shadow-gold/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-2xl">play_arrow</span>
                {t('join.startLocal')}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-12 relative min-h-screen bg-abyssal-deep">
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 5L52 48L95 50L52 52L50 95L48 52L5 50L48 48Z\' fill=\'var(--color-gold)\' fill-opacity=\'0.03\'/%3E%3C/svg%3E")' }}></div>

      <div className="relative w-full max-w-md flex flex-col items-center gap-12 text-center z-10">
        <section className="flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            className="w-24 h-24 mb-6 bg-cabin-slate rounded-full flex items-center justify-center shadow-xl shadow-black/40 border border-gold/20"
          >
            <span className="material-symbols-outlined text-gold" style={{ fontVariationSettings: "'FILL' 1", fontSize: '60px' }}>skull</span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-display font-bold text-ice tracking-tight leading-none mb-2">
            Skull King <span className="block italic text-gold">Scorer</span>
          </h2>
          <p className="font-mono text-apricot opacity-60 uppercase tracking-widest text-xs">{t('join.subtitle')}</p>
        </section>

        <section className="w-full space-y-8">
          {errorMsg && (
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-4 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-coral text-xl shrink-0 mt-0.5">warning</span>
              <p className="font-sans text-sm text-coral leading-tight">{errorMsg}</p>
            </div>
          )}

          <div className="group">
            <label className="block text-left font-mono text-xs uppercase tracking-widest text-apricot/60 mb-2 ml-1" htmlFor="nickname">{t('join.nicknameLabel')}</label>
            <div className="relative">
              <input
                id="nickname"
                type="text"
                value={nickname}
                maxLength={15}
                onChange={(e) => setNickname(sanitizeInput(e.target.value))}
                placeholder={t('join.nicknamePlaceholder')}
                className="w-full bg-dark-void border border-slate-mist/20 h-16 px-6 rounded-xl font-sans font-bold text-2xl text-ice placeholder:text-ice/20 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-ice/30 text-2xl">edit</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-cabin-slate rounded-xl p-5 text-left border border-slate-mist/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between group min-h-11"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gold text-xl">settings_suggest</span>
                  <p className="font-mono text-sm uppercase tracking-widest text-apricot/80 group-hover:text-apricot transition-colors">{t('join.rules')}</p>
                </div>
                {showSettings ? (
                  <span className="material-symbols-outlined text-apricot/60 group-hover:text-apricot transition-colors text-xl">expand_less</span>
                ) : (
                  <span className="material-symbols-outlined text-apricot/60 group-hover:text-apricot transition-colors text-xl">expand_more</span>
                )}
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {[
                        { id: 'krakenEnabled', title: t('rules.kraken'), desc: t('rules.krakenDesc'), icon: '🦑', iconType: 'emoji', color: 'text-coral', bg: 'bg-coral/10', border: 'border-coral/40', switchBg: 'bg-coral' },
                        { id: 'whiteWhaleEnabled', title: t('rules.whale'), desc: t('rules.whaleDesc'), icon: '🐳', iconType: 'emoji', color: 'text-ice', bg: 'bg-ice/10', border: 'border-ice/40', switchBg: 'bg-ice' },
                        { id: 'characterBonusesEnabled', title: t('rules.captures'), desc: t('rules.capturesDesc'), icon: 'swords', iconType: 'material', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/40', switchBg: 'bg-gold' },
                        { id: 'fourteenBonusesEnabled', title: t('rules.14s'), desc: t('rules.14sDesc'), icon: '14', iconType: 'text', color: 'text-apricot', bg: 'bg-apricot/10', border: 'border-apricot/40', switchBg: 'bg-apricot' },
                        { id: 'extraBetEnabled', title: t('rules.extra'), desc: t('rules.extraDesc'), icon: 'casino', iconType: 'material', color: 'text-slate-mist', bg: 'bg-slate-mist/10', border: 'border-slate-mist/40', switchBg: 'bg-slate-mist' },
                        { id: 'lootEnabled', title: t('rules.loot'), desc: t('rules.lootDesc'), icon: 'handshake', iconType: 'material', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/40', switchBg: 'bg-gold' },
                      ].map((option) => {
                        const isEnabled = settings[option.id as keyof typeof settings];
                        return (
                          <div
                            key={option.id}
                            onClick={() => setSettings({ ...settings, [option.id]: !isEnabled })}
                            className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col gap-2 overflow-hidden group ${isEnabled
                              ? `bg-cabin-slate ${option.border} shadow-md`
                              : 'bg-dark-void border-transparent hover:border-slate-mist/20'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isEnabled ? `${option.bg} ${option.color}` : 'bg-cabin-slate text-slate-mist'}`}>
                                {option.iconType === 'material' && <span className="material-symbols-outlined text-xl">{option.icon as string}</span>}
                                {option.iconType === 'emoji' && <span className={`text-xl leading-none transition-all ${!isEnabled ? 'grayscale opacity-50' : ''}`}>{option.icon as string}</span>}
                                {option.iconType === 'text' && <span className="font-mono font-bold text-lg leading-none">{option.icon as string}</span>}
                              </div>
                              <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors duration-300 ${isEnabled ? option.switchBg : 'bg-dark-void border border-slate-mist/20'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                            </div>
                            <div className="mt-1">
                              <h4 className={`font-sans font-bold text-sm transition-colors ${isEnabled ? 'text-ice' : 'text-slate-mist group-hover:text-ice'}`}>{option.title}</h4>
                              <p className="font-mono text-[9px] text-slate-mist/60 mt-0.5 leading-tight uppercase tracking-wider">{option.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full h-16 rounded-xl bg-gradient-to-r from-gold to-gold-hover text-abyssal-deep font-sans font-bold text-xl shadow-2xl shadow-gold/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-abyssal-deep/30 border-t-abyssal-deep rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl">meeting_room</span>
                  {t('join.createBtn')}
                </>
              )}
            </button>

            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-grow bg-slate-mist opacity-10"></div>
              <span className="font-mono text-xs text-apricot/40 uppercase tracking-widest">{t('join.or')}</span>
              <div className="h-px flex-grow bg-slate-mist opacity-10"></div>
            </div>

            <div className="bg-cabin-slate p-1.5 rounded-2xl flex items-center gap-2 shadow-inner border border-slate-mist/10 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition-all">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(sanitizeInput(e.target.value))}
                placeholder={t('join.codePlaceholder')}
                maxLength={4}
                className="w-full min-w-0 flex-grow bg-transparent border-none font-mono text-lg sm:text-xl tracking-[0.3em] sm:tracking-[0.5em] text-center text-gold placeholder:text-gold/20 focus:ring-0 focus:outline-none uppercase [font-variant-numeric:slashed-zero]"
              />
              <button
                onClick={handleJoin}
                disabled={loading || roomCode.length !== 4}
                className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-dark-void text-ice font-sans font-bold text-sm uppercase tracking-wider hover:bg-cabin-slate transition-colors active:scale-[0.97] duration-150 disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-ice/30 border-t-ice rounded-full animate-spin"></div>
                ) : (
                  t('join.joinBtn')
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-grow bg-slate-mist opacity-10"></div>
              <span className="font-mono text-xs text-apricot/40 uppercase tracking-widest">{t('join.or')}</span>
              <div className="h-px flex-grow bg-slate-mist opacity-10"></div>
            </div>

            <button
              onClick={() => setShowLocalSetup(true)}
              className="w-full h-16 rounded-xl bg-cabin-slate border border-slate-mist/10 text-ice font-sans font-bold text-xl shadow-xl hover:bg-cabin-slate/80 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-3xl">devices</span>
              {t('join.localModeBtn')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

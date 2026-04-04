import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createRoom, joinRoom } from '../services/gameService';
import { auth } from '../firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';

interface JoinCreateProps {
  onJoin: (roomId: string) => void;
}

export default function JoinCreate({ onJoin }: JoinCreateProps) {
  const [nickname, setNickname] = useState(auth.currentUser?.displayName || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    let user = auth.currentUser;
    if (!user) {
      const userCred = await signInAnonymously(auth);
      user = userCred.user;
    }
    if (user) {
      await updateProfile(user, {
        displayName: nickname,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${nickname}`
      });
    }
  };

  const [settings, setSettings] = useState({
    krakenEnabled: true,
    whiteWhaleEnabled: true,
    characterBonusesEnabled: true,
    extraBetEnabled: false,
    fourteenBonusesEnabled: true,
    lootEnabled: false,
  });
  const [showSettings, setShowSettings] = useState(false);

  const handleCreate = async () => {
    setErrorMsg('');
    if (!nickname.trim()) {
      setErrorMsg('¡Debes ingresar un apodo para continuar!');
      return;
    }
    setLoading(true);
    try {
      await handleAuth();
      const roomId = await createRoom(
        nickname.trim(), 
        auth.currentUser?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + nickname.trim(),
        settings
      );
      onJoin(roomId);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al crear la sala. Inténtalo de nuevo.');
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    setErrorMsg('');
    if (!nickname.trim()) {
      setErrorMsg('¡Debes ingresar un apodo para continuar!');
      return;
    }
    if (!roomCode || roomCode.trim().length !== 4) {
      setErrorMsg('Debes ingresar un código de 4 letras válido.');
      return;
    }
    setLoading(true);
    try {
      await handleAuth();
      await joinRoom(roomCode.trim().toUpperCase(), nickname.trim(), auth.currentUser?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + nickname.trim());
      onJoin(roomCode.trim().toUpperCase());
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'NICKNAME_TAKEN') {
        setErrorMsg(`Ya hay un jugador llamado "${nickname.trim()}" en esta sala. Por favor, elige otro apodo.`);
      } else {
        setErrorMsg('Error al unirse a la sala. Verifica que el código sea correcto.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-12 relative min-h-screen bg-[#041424]">
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 5L52 48L95 50L52 52L50 95L48 52L5 50L48 48Z\' fill=\'%23fabd04\' fill-opacity=\'0.03\'/%3E%3C/svg%3E")' }}></div>
      
      <div className="relative w-full max-w-md flex flex-col items-center gap-12 text-center z-10">
        <section className="flex flex-col items-center">
          <div className="w-24 h-24 mb-6 bg-[#1b2b3b] rounded-full flex items-center justify-center shadow-xl shadow-black/40 border-2 border-[#fabd04]/20">
            <span className="material-symbols-outlined text-[#fabd04] text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-[#d3e4fa] tracking-tight leading-none mb-2">
            Skull King <span className="block italic text-[#fabd04]">Tracker</span>
          </h2>
          <p className="font-mono text-[#f0bd8b] opacity-60 uppercase tracking-widest text-xs">Bitácora Digital del Capitán</p>
        </section>

        <section className="w-full space-y-8">
          {errorMsg && (
            <div className="bg-[#ffb3ae]/10 border border-[#ffb3ae]/30 rounded-xl p-4 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[#ffb3ae] text-xl shrink-0 mt-0.5">warning</span>
              <p className="font-sans text-sm text-[#ffb3ae] leading-tight">{errorMsg}</p>
            </div>
          )}

          <div className="group">
            <label className="block text-left font-mono text-xs uppercase tracking-widest text-[#f0bd8b]/60 mb-2 ml-1" htmlFor="nickname">Apodo del Capitán</label>
            <div className="relative">
              <input 
                id="nickname" 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ingresa tu apodo..." 
                className="w-full bg-[#f0bd8b] border-none h-16 px-6 rounded-xl font-serif text-2xl text-[#261a00] placeholder:text-[#261a00]/40 focus:ring-4 focus:ring-[#fabd04]/20 transition-all"
                style={{ backgroundImage: 'radial-gradient(#d4a373 0.5px, transparent 0.5px)', backgroundSize: '10px 10px', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1)' }}
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#261a00]/30 text-2xl">edit</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1b2b3b] rounded-xl p-5 text-left border border-[#fabd04]/20 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#fabd04]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fabd04] text-xl">settings_suggest</span>
                  <p className="font-mono text-sm uppercase tracking-widest text-[#f0bd8b]/80 group-hover:text-[#f0bd8b] transition-colors">Reglas de la Flota</p>
                </div>
                {showSettings ? (
                  <span className="material-symbols-outlined text-[#f0bd8b]/60 group-hover:text-[#f0bd8b] transition-colors text-xl">expand_less</span>
                ) : (
                  <span className="material-symbols-outlined text-[#f0bd8b]/60 group-hover:text-[#f0bd8b] transition-colors text-xl">expand_more</span>
                )}
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {[
                        { id: 'krakenEnabled', title: 'Kraken', desc: 'Destruye una baza por completo', icon: '🦑', iconType: 'emoji', color: 'text-[#ffb3ae]', bg: 'bg-[#ffb3ae]/10', border: 'border-[#ffb3ae]', switchBg: 'bg-[#ffb3ae]' },
                        { id: 'whiteWhaleEnabled', title: 'Ballena Blanca', desc: 'Anula capturas de personajes', icon: '🐳', iconType: 'emoji', color: 'text-[#d3e4fa]', bg: 'bg-[#d3e4fa]/10', border: 'border-[#d3e4fa]', switchBg: 'bg-[#d3e4fa]' },
                        { id: 'characterBonusesEnabled', title: 'Capturas', desc: 'Puntos por Sirena, Pirata y Rey', icon: 'swords', iconType: 'material', color: 'text-[#fabd04]', bg: 'bg-[#fabd04]/10', border: 'border-[#fabd04]', switchBg: 'bg-[#fabd04]' },
                        { id: 'fourteenBonusesEnabled', title: 'Cartas 14', desc: 'Bonus por ganar con cartas 14', icon: '14', iconType: 'text', color: 'text-[#f0bd8b]', bg: 'bg-[#f0bd8b]/10', border: 'border-[#f0bd8b]', switchBg: 'bg-[#f0bd8b]' },
                        { id: 'extraBetEnabled', title: 'Apuesta Extra', desc: 'Arriesga ±10 o ±20 puntos (Rascal)', icon: 'casino', iconType: 'material', color: 'text-[#c4c6cc]', bg: 'bg-[#c4c6cc]/10', border: 'border-[#c4c6cc]', switchBg: 'bg-[#c4c6cc]' },
                        { id: 'lootEnabled', title: 'El Botín', desc: 'Alianzas entre jugadores (+20 pts)', icon: 'handshake', iconType: 'material', color: 'text-[#fabd04]', bg: 'bg-[#fabd04]/10', border: 'border-[#fabd04]', switchBg: 'bg-[#fabd04]' },
                      ].map((option) => {
                        const isEnabled = settings[option.id as keyof typeof settings];
                        return (
                          <div
                            key={option.id}
                            onClick={() => setSettings({ ...settings, [option.id]: !isEnabled })}
                            className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-2 overflow-hidden group ${
                              isEnabled
                                ? `bg-[#263647] ${option.border} shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                                : 'bg-[#0c1d2c] border-transparent hover:border-[#44474c]'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isEnabled ? `${option.bg} ${option.color}` : 'bg-[#1b2b3b] text-[#c4c6cc]'}`}>
                                {option.iconType === 'material' && <span className="material-symbols-outlined text-xl">{option.icon as string}</span>}
                                {option.iconType === 'emoji' && <span className={`text-xl leading-none transition-all ${!isEnabled ? 'grayscale opacity-50' : ''}`}>{option.icon as string}</span>}
                                {option.iconType === 'text' && <span className="font-mono font-bold text-lg leading-none">{option.icon as string}</span>}
                              </div>
                              <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${isEnabled ? option.switchBg : 'bg-[#102130] border border-[#44474c]'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                            </div>
                            <div className="mt-1">
                              <h4 className={`font-sans font-bold text-sm transition-colors ${isEnabled ? 'text-[#d3e4fa]' : 'text-[#c4c6cc] group-hover:text-[#d3e4fa]'}`}>{option.title}</h4>
                              <p className="font-mono text-[9px] text-[#c4c6cc]/60 mt-0.5 leading-tight uppercase tracking-wider">{option.desc}</p>
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
              className="w-full h-16 rounded-xl bg-gradient-to-r from-[#fabd04] to-[#b68900] text-[#261a00] font-serif text-2xl font-bold shadow-2xl shadow-[#fabd04]/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-[#261a00]/30 border-t-[#261a00] rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl">meeting_room</span>
                  Crear Sala
                </>
              )}
            </button>

            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-grow bg-[#44474c] opacity-20"></div>
              <span className="font-mono text-xs text-[#f0bd8b]/40 uppercase tracking-widest">o únete a una flota</span>
              <div className="h-px flex-grow bg-[#44474c] opacity-20"></div>
            </div>

            <div className="bg-[#1b2b3b] p-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="CÓDIGO" 
                maxLength={4}
                className="w-full min-w-0 flex-grow bg-transparent border-none font-mono text-lg sm:text-xl tracking-[0.3em] sm:tracking-[0.5em] text-center text-[#fabd04] placeholder:text-[#fabd04]/20 focus:ring-0 uppercase [font-variant-numeric:slashed-zero]" 
              />
              <button 
                onClick={handleJoin}
                disabled={loading || roomCode.length !== 4}
                className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-[#263647] text-[#d3e4fa] font-mono font-bold text-sm uppercase tracking-wider hover:bg-[#2b3b4b] transition-colors active:scale-95 duration-150 disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#d3e4fa]/30 border-t-[#d3e4fa] rounded-full animate-spin"></div>
                ) : (
                  'Unirse'
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

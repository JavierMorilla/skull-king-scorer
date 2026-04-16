import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { AnimatePresence } from 'motion/react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { Room, Player, Bid, Result } from './types';
import { leaveRoom } from './services/gameService';
import { useLanguage } from './i18n/LanguageContext';
import JoinCreate from './components/JoinCreate';
import Lobby from './components/Lobby';
import Betting from './components/Betting';
import Results from './components/Results';
import Leaderboard from './components/Leaderboard';
import ConfirmModal from './components/ConfirmModal';
import Loader from './components/Loader';
import ScoresModal from './components/ScoresModal';
import LocalGame from './components/LocalGame';
import SideMenu from './components/SideMenu';
import PrivacyPolicy from './components/PrivacyPolicy';
import { Analytics } from '@vercel/analytics/react';
import { track } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(() => {
    return localStorage.getItem('skullking_roomId');
  });
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if we are on Capacitor (mobile)
    const initUI = async () => {
      try {
        // Set Status Bar to matching app background
        await StatusBar.setBackgroundColor({ color: '#041424' });
        await StatusBar.setStyle({ style: Style.Dark }); // White icons
        
        // Set Navigation Bar to matching app background
        await NavigationBar.setBackgroundColor({ color: '#041424' });
        
        setIsMobile(true);
      } catch (e) {
        // Not on a mobile device or plugin not available
        setIsMobile(false);
      }
    };
    initUI();
  }, []);

  useEffect(() => {
    // Check for direct /privacy URL
    if (window.location.pathname === '/privacy' || window.location.hash === '#privacy') {
      setShowPrivacy(true);
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const manageSleep = async () => {
      try {
        if (roomId) {
          localStorage.setItem('skullking_roomId', roomId);
          await KeepAwake.keepAwake();
        } else {
          localStorage.removeItem('skullking_roomId');
          await KeepAwake.allowSleep();
        }
      } catch (err) {
        // En navegadores de escritorio puede no estar sportado, silencioso
      }
    };
    manageSleep();
  }, [roomId]);

  useEffect(() => {
    if (!isAuthReady || !roomId || roomId === 'LOCAL_GAME' || !auth.currentUser) return;

    // Room listener
    const roomUnsub = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        setRoom(doc.data() as Room);
      } else {
        setRoomId(null); // Room deleted or invalid
      }
    });

    // Players listener
    const playersUnsub = onSnapshot(collection(db, `rooms/${roomId}/players`), (snapshot) => {
      const p: Player[] = [];
      let amIInRoom = false;
      snapshot.forEach(doc => {
        p.push(doc.data() as Player);
        if (doc.id === auth.currentUser?.uid) {
          amIInRoom = true;
        }
      });

      if (!amIInRoom && !snapshot.empty) {
        setRoomId(null); // Kicked or removed
      } else {
        setPlayers(p);
      }
    });

    return () => {
      roomUnsub();
      playersUnsub();
    };
  }, [roomId, isAuthReady]);

  const sortedPlayers = useMemo(() => {
    if (!players.length) return [];
    
    // Default sorting by joinedAt for stability
    const defaultSorted = [...players].sort((a, b) => {
      const timeA = a.joinedAt?.toMillis?.() || 0;
      const timeB = b.joinedAt?.toMillis?.() || 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    });

    if (!room?.playerOrder || room.playerOrder.length === 0) {
      return defaultSorted;
    }

    // Sort by playerOrder, and put any new players (not in playerOrder yet) at the end
    return [...players].sort((a, b) => {
      const indexA = room.playerOrder!.indexOf(a.id);
      const indexB = room.playerOrder!.indexOf(b.id);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither in playerOrder, use default sorting
      const timeA = a.joinedAt?.toMillis?.() || 0;
      const timeB = b.joinedAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
  }, [players, room?.playerOrder]);

  useEffect(() => {
    if (!isAuthReady || !roomId || roomId === 'LOCAL_GAME' || !room?.currentRound || !auth.currentUser) return;

    // Bids listener
    const bidsUnsub = onSnapshot(collection(db, `rooms/${roomId}/rounds/${room.currentRound}/bids`), (snapshot) => {
      const b: Bid[] = [];
      snapshot.forEach(doc => b.push(doc.data() as Bid));
      setBids(b);
    });

    // Results listener
    const resultsUnsub = onSnapshot(collection(db, `rooms/${roomId}/rounds/${room.currentRound}/results`), (snapshot) => {
      const r: Result[] = [];
      snapshot.forEach(doc => r.push(doc.data() as Result));
      setResults(r);
    });

    return () => {
      bidsUnsub();
      resultsUnsub();
    };
  }, [roomId, room?.currentRound, isAuthReady]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#041424] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <SideMenu onOpenPrivacy={() => setShowPrivacy(true)} />
        </div>
        <JoinCreate onJoin={setRoomId} />
      </div>
    );
  }

  if (roomId === 'LOCAL_GAME') {
    return (
      <div className="relative">
        <LocalGame onLeave={() => setRoomId(null)} />
      </div>
    );
  }

  if (roomId && roomId !== 'LOCAL_GAME' && !auth.currentUser) {
    // Si hay una sala guardada pero no hay usuario, volvemos al inicio
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <SideMenu onOpenPrivacy={() => setShowPrivacy(true)} />
        </div>
        <JoinCreate onJoin={setRoomId} />
      </div>
    );
  }

  if (!room && roomId && roomId !== 'LOCAL_GAME') {
    return (
      <div className="min-h-screen bg-[#041424] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const handleLeaveRoom = async () => {
    if (roomId) {
      await leaveRoom(roomId);
      setRoomId(null);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <div className="bg-[#041424] text-[#d3e4fa] font-sans min-h-screen flex flex-col overflow-x-hidden selection:bg-[#fabd04]/30">
      <header 
        style={{ paddingTop: 'calc(1rem + var(--safe-area-top))' }}
        className="bg-[#041424] shadow-lg shadow-blue-950/40 flex justify-between items-center w-full px-6 pb-4 fixed top-0 z-50 transition-[padding] duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#fabd04] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
          <h1 className="text-2xl font-serif font-bold text-[#fabd04]">{t('app.title')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <SideMenu 
            roomId={roomId} 
            onLeave={() => setShowLeaveConfirm(true)} 
            onOpenPrivacy={() => {
              setShowPrivacy(true);
              track('privacy_viewed_menu');
            }}
          />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {room && room.status === 'LOBBY' && <Lobby key="lobby" room={room} players={sortedPlayers} />}
        {room && room.status === 'BETTING' && <Betting key="betting" room={room} players={sortedPlayers} bids={bids} />}
        {room && room.status === 'RESULTS' && <Results key="results" room={room} players={sortedPlayers} bids={bids} results={results} />}
        {room && room.status === 'LEADERBOARD' && <Leaderboard key="leaderboard" room={room} players={sortedPlayers} results={results} />}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {room.status !== 'LOBBY' && (
        <nav 
          key={room.status} 
          style={{ paddingBottom: 'calc(1.5rem + var(--safe-area-bottom))' }}
          className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-2 bg-[#041424] shadow-[0_-10px_30px_rgba(0,15,30,0.8)] border-t border-[#1b2b3b]/80 transition-[padding] duration-300"
        >
          <div
            className={`flex-1 flex flex-col items-center justify-center py-2 mx-1 rounded-xl transition-all duration-300 ${room.status === 'BETTING' ? 'bg-[#1b2b3b] text-[#fabd04] shadow-inner' : 'bg-transparent text-[#f0bd8b]/60'}`}
          >
            <span className="material-symbols-outlined mb-1">edit_note</span>
            <span className="font-mono text-[10px] uppercase tracking-tighter">{t('app.bets')}</span>
          </div>
          <div
            className={`flex-1 flex flex-col items-center justify-center py-2 mx-1 rounded-xl transition-all duration-300 ${room.status === 'RESULTS' ? 'bg-[#1b2b3b] text-[#fabd04] shadow-inner' : 'bg-transparent text-[#f0bd8b]/60'}`}
          >
            <span className="material-symbols-outlined mb-1">equalizer</span>
            <span className="font-mono text-[10px] uppercase tracking-tighter">{t('app.results')}</span>
          </div>
          <div
            onClick={() => room.status !== 'LEADERBOARD' && setShowScoresModal(true)}
            className={`flex-1 flex flex-col items-center justify-center py-2 mx-1 rounded-xl transition-all duration-300 ${room.status === 'LEADERBOARD' ? 'bg-[#1b2b3b] text-[#fabd04] shadow-inner' : 'bg-transparent text-[#f0bd8b]/60 cursor-pointer active:scale-95'}`}
          >
            <span className="material-symbols-outlined mb-1">military_tech</span>
            <span className="font-mono text-[10px] uppercase tracking-tighter">{t('app.leaderboard')}</span>
          </div>
        </nav>
      )}

      <ScoresModal
        isOpen={showScoresModal}
        onClose={() => setShowScoresModal(false)}
        room={room}
        players={sortedPlayers}
      />

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title={t('app.leaveConfirmTitle')}
        message={t('app.leaveConfirmMsg')}
        confirmText={t('app.leave')}
        cancelText={t('app.stay')}
        isDestructive={true}
        onConfirm={handleLeaveRoom}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      <AnimatePresence>
        {showPrivacy && (
          <PrivacyPolicy onBack={() => {
            setShowPrivacy(false);
            if (window.location.pathname === '/privacy') {
              window.history.pushState({}, '', '/');
            }
          }} />
        )}
      </AnimatePresence>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

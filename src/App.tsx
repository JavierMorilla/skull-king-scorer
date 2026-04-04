import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, collection, onSnapshot, query } from 'firebase/firestore';
import { AnimatePresence } from 'motion/react';
import { Room, Player, Bid, Result } from './types';
import { leaveRoom } from './services/gameService';
import JoinCreate from './components/JoinCreate';
import Lobby from './components/Lobby';
import Betting from './components/Betting';
import Results from './components/Results';
import Leaderboard from './components/Leaderboard';
import ConfirmModal from './components/ConfirmModal';
import Loader from './components/Loader';
import ScoresModal from './components/ScoresModal';

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(() => {
    return localStorage.getItem('skullking_roomId');
  });
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showScoresModal, setShowScoresModal] = useState(false);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (roomId) {
      localStorage.setItem('skullking_roomId', roomId);
    } else {
      localStorage.removeItem('skullking_roomId');
    }
  }, [roomId]);

  useEffect(() => {
    if (!isAuthReady || !roomId || !auth.currentUser) return;

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
      
      // Sort players by joinedAt to maintain consistent order
      p.sort((a, b) => {
        const timeA = a.joinedAt?.toMillis?.() || 0;
        const timeB = b.joinedAt?.toMillis?.() || 0;
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id);
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

  useEffect(() => {
    if (!isAuthReady || !roomId || !room?.currentRound || !auth.currentUser) return;

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

  if (!roomId || !room) {
    return <JoinCreate onJoin={setRoomId} />;
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
      <header className="bg-[#041424] shadow-lg shadow-blue-950/40 flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#fabd04] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>anchor</span>
          <h1 className="text-2xl font-serif italic font-bold text-[#fabd04]">Skull King</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm text-[#fabd04] bg-[#1b2b3b] px-3 py-1 rounded-full border border-[#fabd04]/10 tracking-widest [font-variant-numeric:slashed-zero]">
            #{roomId}
          </div>
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="text-[#ffb3ae] hover:bg-[#ffb3ae]/10 p-2 rounded-full transition-colors flex items-center justify-center"
            title="Abandonar Sala"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {room.status === 'LOBBY' && <Lobby key="lobby" room={room} players={players} />}
        {room.status === 'BETTING' && <Betting key="betting" room={room} players={players} bids={bids} />}
        {room.status === 'RESULTS' && <Results key="results" room={room} players={players} bids={bids} results={results} />}
        {room.status === 'LEADERBOARD' && <Leaderboard key="leaderboard" room={room} players={players} results={results} />}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {room.status !== 'LOBBY' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-[#041424]/80 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,15,30,0.5)]">
          <div className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all ${room.status === 'BETTING' ? 'bg-[#1b2b3b] text-[#fabd04] rounded-xl' : 'text-[#f0bd8b]/60'}`}>
            <span className="material-symbols-outlined mb-1">edit_note</span>
            <span className="font-mono text-[10px] uppercase tracking-tighter">Apuestas</span>
          </div>
          <div className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all ${room.status === 'RESULTS' ? 'bg-[#1b2b3b] text-[#fabd04] rounded-xl' : 'text-[#f0bd8b]/60'}`}>
            <span className="material-symbols-outlined mb-1">equalizer</span>
            <span className="font-mono text-[10px] uppercase tracking-tighter">Resultados</span>
          </div>
          <div 
            onClick={() => room.status !== 'LEADERBOARD' && setShowScoresModal(true)}
            className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all ${room.status === 'LEADERBOARD' ? 'bg-[#1b2b3b] text-[#fabd04] rounded-xl' : 'text-[#f0bd8b]/60 cursor-pointer hover:text-[#f0bd8b] active:scale-95'}`}
          >
            <span className="material-symbols-outlined mb-1">military_tech</span>
            <span className="font-mono text-[10px] uppercase tracking-tighter">Clasificación</span>
          </div>
        </nav>
      )}

      <ScoresModal
        isOpen={showScoresModal}
        onClose={() => setShowScoresModal(false)}
        room={room}
        players={players}
      />

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Abandonar Sala"
        message="¿Estás seguro de que quieres abandonar esta sala? Tendrás que volver a unirte con el código si quieres regresar."
        confirmText="Abandonar"
        cancelText="Quedarme"
        isDestructive={true}
        onConfirm={handleLeaveRoom}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}

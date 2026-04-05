import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Player, RoomSettings, Bid, Result } from '../types';
import LocalBetting from './LocalBetting';
import LocalResults from './LocalResults';
import LocalLeaderboard from './LocalLeaderboard';
import ConfirmModal from './ConfirmModal';
import SideMenu from './SideMenu';

interface LocalGameProps {
  onLeave: () => void;
}

export default function LocalGame({ onLeave }: LocalGameProps) {
  const { t, language, setLanguage } = useLanguage();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState<'BETTING' | 'RESULTS' | 'LEADERBOARD'>('BETTING');
  const [bids, setBids] = useState<Bid[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const saveGameState = (
    currentPlayers: Player[], 
    round: number, 
    gameStatus: 'BETTING' | 'RESULTS' | 'LEADERBOARD',
    currentBids: Bid[],
    currentResults: Result[],
    currentSettings: RoomSettings
  ) => {
    const stateToSave = {
      players: currentPlayers.map(p => p.name),
      fullPlayers: currentPlayers,
      settings: currentSettings,
      currentRound: round,
      status: gameStatus,
      bids: currentBids,
      results: currentResults
    };
    localStorage.setItem('skullking_local_setup', JSON.stringify(stateToSave));
  };

  useEffect(() => {
    const setupData = localStorage.getItem('skullking_local_setup');
    if (setupData) {
      try {
        const parsedData = JSON.parse(setupData);
        
        if (parsedData.fullPlayers) {
          setPlayers(parsedData.fullPlayers);
          setSettings(parsedData.settings);
          setCurrentRound(parsedData.currentRound || 1);
          setStatus(parsedData.status || 'BETTING');
          setBids(parsedData.bids || []);
          setResults(parsedData.results || []);
        } else {
          const { players: playerNames, settings: savedSettings } = parsedData;
          const initialPlayers: Player[] = playerNames.map((name: string, index: number) => ({
            id: `local_p${index}`,
            name,
            score: 0,
            isHost: index === 0,
            joinedAt: null
          }));
          setPlayers(initialPlayers);
          setSettings(savedSettings);
          saveGameState(initialPlayers, 1, 'BETTING', [], [], savedSettings);
        }
      } catch (e) {
        console.error("Failed to parse local setup", e);
        onLeave();
      }
    } else {
      onLeave();
    }
  }, [onLeave]);

  if (!settings || players.length === 0) return null;

  const handleLeave = () => {
    localStorage.removeItem('skullking_local_setup');
    onLeave();
  };

  const handleBidsComplete = (newBids: Bid[]) => {
    setBids(newBids);
    setStatus('RESULTS');
    saveGameState(players, currentRound, 'RESULTS', newBids, results, settings);
  };

  const handleResultsComplete = (newResults: Result[], updatedPlayers: Player[]) => {
    setResults(newResults);
    setPlayers(updatedPlayers);
    setStatus('LEADERBOARD');
    saveGameState(updatedPlayers, currentRound, 'LEADERBOARD', bids, newResults, settings);
  };

  const handleNextRound = () => {
    if (currentRound < 10) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setBids([]);
      setResults([]);
      setStatus('BETTING');
      saveGameState(players, nextRound, 'BETTING', [], [], settings);
    } else {
      // Game over logic, maybe stay on leaderboard or show final screen
    }
  };

  return (
    <div className="bg-[#041424] text-[#d3e4fa] font-sans min-h-screen flex flex-col overflow-x-hidden selection:bg-[#fabd04]/30">
      <header className="bg-[#041424] shadow-lg shadow-blue-950/40 flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#fabd04] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skull</span>
          <h1 className="text-2xl font-serif font-bold text-[#fabd04]">{t('join.localMode')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <SideMenu isLocalMode={true} onLeave={() => setShowLeaveConfirm(true)} />
        </div>
      </header>

      <div className="pt-20 pb-24 flex-grow flex flex-col">
        {status === 'BETTING' && (
          <LocalBetting 
            players={players} 
            currentRound={currentRound} 
            onComplete={handleBidsComplete} 
          />
        )}
        {status === 'RESULTS' && (
          <LocalResults 
            players={players} 
            currentRound={currentRound} 
            bids={bids} 
            settings={settings}
            onComplete={handleResultsComplete} 
          />
        )}
        {status === 'LEADERBOARD' && (
          <LocalLeaderboard 
            players={players} 
            currentRound={currentRound} 
            onNextRound={handleNextRound} 
            onLeave={handleLeave}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title={t('app.leaveConfirmTitle')}
        message={t('app.leaveConfirmMsg')}
        confirmText={t('app.leave')}
        cancelText={t('app.stay')}
        isDestructive={true}
        onConfirm={handleLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}

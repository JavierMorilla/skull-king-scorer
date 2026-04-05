export type RoomStatus = 'LOBBY' | 'BETTING' | 'PLAYING' | 'RESULTS' | 'LEADERBOARD';

export interface RoomSettings {
  krakenEnabled: boolean;
  whiteWhaleEnabled: boolean;
  characterBonusesEnabled: boolean;
  extraBetEnabled: boolean;
  fourteenBonusesEnabled: boolean;
  lootEnabled: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  status: RoomStatus;
  currentRound: number;
  createdAt: any; // Firestore Timestamp
  settings: RoomSettings;
  roundError?: string;
  playerOrder?: string[];
  dealerId?: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
  joinedAt?: any; // Firestore Timestamp
}

export type RoundStatus = 'BETTING' | 'PLAYING' | 'RESULTS' | 'COMPLETED';

export interface Round {
  id: string;
  status: RoundStatus;
}

export interface Bid {
  playerId: string;
  bid: number;
  extraBet: number; // 0, 10, or 20
  isHighlighted?: boolean;
}

export interface Result {
  playerId: string;
  tricks: number;
  bonusSkullKingCaptured: boolean; // Mermaid captures SK (+50)
  bonusPiratesCaptured: number; // SK captures Pirates (+30 each)
  bonusMermaidsCaptured: number; // Pirate captures Mermaid (+20 each)
  bonus14sColor: number; // (+10 each)
  bonus14sBlack: boolean; // (+20)
  krakenUsed: boolean;
  whiteWhaleUsed: boolean;
  lootAlliance: string | null; // ID of allied player
  scoreChange: number;
}

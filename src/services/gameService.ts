import { db, auth } from '../firebase';
import { 
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, getDocs, serverTimestamp, 
  writeBatch, increment
} from 'firebase/firestore';
import { Room, Player, Round, Bid, Result } from '../types';

// Utility to generate a 4-character room code
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Error handler types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const userId = auth.currentUser?.uid;
  const message = error instanceof Error ? error.message : String(error);
  
  console.error(`[Firestore Error] ${operationType.toUpperCase()} at ${path || 'unknown'}:`, {
    userId,
    message,
    error
  });
  
  // Re-throw a cleaner error for the UI
  throw new Error(`FIREBASE_OPERATION_FAILED|${operationType}|${message}`);
}

// 1. Room Management
export const createRoom = async (hostName: string, settings: any): Promise<string> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  const roomId = generateRoomCode();
  const roomRef = doc(db, 'rooms', roomId);
  const playerRef = doc(db, `rooms/${roomId}/players`, auth.currentUser.uid);
  
  const batch = writeBatch(db);
  
  batch.set(roomRef, {
    id: roomId,
    hostId: auth.currentUser.uid,
    status: 'LOBBY',
    currentRound: 1,
    createdAt: serverTimestamp(),
    settings
  });
  
  batch.set(playerRef, {
    id: auth.currentUser.uid,
    name: hostName,
    score: 0,
    isReady: true,
    isHost: true,
    joinedAt: serverTimestamp()
  });
  
  try {
    await batch.commit();
    return roomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `rooms/${roomId}`);
    throw error;
  }
};

export const updateRoomSettings = async (roomId: string, settings: any): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, { settings });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    throw error;
  }
};

export const joinRoom = async (roomId: string, playerName: string): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      throw new Error("Room not found");
    }
    
    // Check for duplicate nicknames
    const playersRef = collection(db, `rooms/${roomId}/players`);
    const playersSnap = await getDocs(playersRef);
    const existingPlayer = playersSnap.docs.find(
      doc => doc.data().name.trim().toLowerCase() === playerName.trim().toLowerCase() && doc.id !== auth.currentUser!.uid
    );

    if (existingPlayer) {
      throw new Error("NICKNAME_TAKEN");
    }
    
    const playerRef = doc(db, `rooms/${roomId}/players`, auth.currentUser.uid);
    await setDoc(playerRef, {
      id: auth.currentUser.uid,
      name: playerName,
      score: 0,
      isReady: false,
      isHost: false,
      joinedAt: serverTimestamp()
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NICKNAME_TAKEN") {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `rooms/${roomId}/players`);
    throw error;
  }
};

export const leaveRoom = async (roomId: string): Promise<void> => {
  if (!auth.currentUser) return;
  const playerRef = doc(db, `rooms/${roomId}/players`, auth.currentUser.uid);
  try {
    await deleteDoc(playerRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, playerRef.path);
  }
};

export const kickPlayer = async (roomId: string, playerId: string): Promise<void> => {
  if (!auth.currentUser) return;
  const playerRef = doc(db, `rooms/${roomId}/players`, playerId);
  try {
    await deleteDoc(playerRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, playerRef.path);
  }
};

export const toggleReady = async (roomId: string, isReady: boolean): Promise<void> => {
  if (!auth.currentUser) return;
  const playerRef = doc(db, `rooms/${roomId}/players`, auth.currentUser.uid);
  try {
    await updateDoc(playerRef, { isReady });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, playerRef.path);
  }
};

export const updatePlayerOrder = async (roomId: string, playerIds: string[]): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, { playerOrder: playerIds });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomRef.path);
  }
};

export const startGame = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  const roundRef = doc(db, `rooms/${roomId}/rounds`, '1');
  const playersRef = collection(db, `rooms/${roomId}/players`);
  
  try {
    const playersSnap = await getDocs(playersRef);
    const playersData = playersSnap.docs.map(doc => doc.data() as Player);
    
    // Sort players by joinedAt to maintain consistent order
    playersData.sort((a, b) => {
      const timeA = a.joinedAt?.toMillis?.() || 0;
      const timeB = b.joinedAt?.toMillis?.() || 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    });
    
    const playerIds = playersData.map(p => p.id);
    
    // Pick a random dealer for the first round
    const randomDealerIndex = Math.floor(Math.random() * playerIds.length);

    const batch = writeBatch(db);
    batch.update(roomRef, { 
      status: 'BETTING', 
      currentRound: 1,
      playerOrder: playerIds,
      dealerId: playerIds[randomDealerIndex]
    });
    batch.set(roundRef, { id: '1', status: 'BETTING' });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomRef.path);
  }
};

// 2. Gameplay Actions
export const submitBid = async (roomId: string, roundId: number, bid: number, extraBet: number = 0): Promise<void> => {
  if (!auth.currentUser) return;
  const bidRef = doc(db, `rooms/${roomId}/rounds/${roundId}/bids`, auth.currentUser.uid);
  try {
    await setDoc(bidRef, {
      playerId: auth.currentUser.uid,
      bid,
      extraBet,
      isHighlighted: false
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, bidRef.path);
  }
};

export const toggleBidHighlight = async (roomId: string, roundId: number, playerId: string, isHighlighted: boolean): Promise<void> => {
  if (!auth.currentUser) return;
  const bidRef = doc(db, `rooms/${roomId}/rounds/${roundId}/bids`, playerId);
  try {
    await updateDoc(bidRef, { isHighlighted });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, bidRef.path);
  }
};

  krakenUsed: boolean,
  whiteWhaleUsed: boolean,
  whiteWhaleDestroyedTrick: boolean,
  lootAlliance: string | null
): Promise<void> => {
  if (!auth.currentUser) return;
  
  const resultRef = doc(db, `rooms/${roomId}/rounds/${roundId}/results`, auth.currentUser.uid);
  try {
    await setDoc(resultRef, {
      playerId: auth.currentUser.uid,
      tricks,
      bonusSkullKingCaptured,
      bonusPiratesCaptured,
      bonusMermaidsCaptured,
      bonus14sColor,
      bonus14sBlack,
      krakenUsed,
      whiteWhaleUsed,
      whiteWhaleDestroyedTrick,
      lootAlliance,
      scoreChange: 0 // This will be calculated globally by the host
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, resultRef.path);
  }
};

export const deleteResult = async (roomId: string, roundId: number): Promise<void> => {
  if (!auth.currentUser) return;
  const resultRef = doc(db, `rooms/${roomId}/rounds/${roundId}/results`, auth.currentUser.uid);
  try {
    await deleteDoc(resultRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, resultRef.path);
  }
};

// 3. Host Actions
export const transitionToResults = async (roomId: string, roundId: number): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  const roundRef = doc(db, `rooms/${roomId}/rounds`, roundId.toString());
  
  const batch = writeBatch(db);
  batch.update(roomRef, { status: 'RESULTS' });
  batch.update(roundRef, { status: 'RESULTS' });
  
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomRef.path);
  }
};

export const computeScores = (
  roundId: number, 
  results: Result[], 
  bids: Bid[]
): { playerId: string, scoreChange: number }[] => {
  // O(1) Lookup optimization
  const bidsMap = new Map(bids.map(b => [b.playerId, b]));
  
  // Strict Validations (Single Pass)
  let totalTricks = 0;
  let totalSkullKings = 0;
  let totalMermaids = 0;
  let totalPirates = 0;
  let total14s = 0;
  let krakenWasUsed = false;
  let whiteWhaleWasUsed = false;

  for (const result of results) {
    totalTricks += result.tricks;
    if (result.bonusSkullKingCaptured) totalSkullKings++;
    totalMermaids += result.bonusMermaidsCaptured;
    totalPirates += result.bonusPiratesCaptured;
    total14s += result.bonus14sColor + (result.bonus14sBlack ? 1 : 0);
    if (result.krakenUsed) krakenWasUsed = true;
    if (result.whiteWhaleUsed) whiteWhaleWasUsed = true;
    if (result.whiteWhaleDestroyedTrick) whiteWhaleWasUsed = true;
  }

  const whaleDestruction = results.some(r => r.whiteWhaleDestroyedTrick) ? 1 : 0;
  const expectedTricks = roundId - (krakenWasUsed ? 1 : 0) - whaleDestruction;

  if (totalTricks !== expectedTricks) {
    throw new Error(`ERROR_TRICKS_MISMATCH|${totalTricks}|${expectedTricks}`);
  }

  if (totalSkullKings > 1) throw new Error('ERROR_MULTIPLE_SKULL_KINGS');
  if (totalMermaids > 2) throw new Error('ERROR_TOO_MANY_MERMAIDS');
  if (totalPirates > 5) throw new Error('ERROR_TOO_MANY_PIRATES');
  if (total14s > 4) throw new Error('ERROR_TOO_MANY_14S');

  // Pre-calculate score changes
  const scoreChanges: { playerId: string, scoreChange: number }[] = [];

  for (const result of results) {
    const playerBid = bidsMap.get(result.playerId);
    if (!playerBid) continue;

    const { bid, extraBet } = playerBid;
    const { tricks } = result;
    const hitBid = tricks === bid;
    
    let scoreChange = 0;

    // Base score calculation
    if (bid === 0) {
      scoreChange = hitBid ? roundId * 10 : roundId * -10;
    } else {
      scoreChange = hitBid ? tricks * 20 : Math.abs(bid - tricks) * -10;
    }

    // Rascal (Extra Bet)
    if (extraBet > 0) {
      scoreChange += hitBid ? extraBet : -extraBet;
    }

    // Bonuses (only if hit bid)
    if (hitBid) {
      // Character bonuses (nullified by White Whale)
      if (!whiteWhaleWasUsed) {
        if (result.bonusSkullKingCaptured) scoreChange += 50;
        scoreChange += (result.bonusPiratesCaptured * 30) + (result.bonusMermaidsCaptured * 20);
      }

      // 14s bonuses
      scoreChange += (result.bonus14sColor * 10) + (result.bonus14sBlack ? 20 : 0);

      // Loot Alliance
      if (result.lootAlliance) {
        const alliedResult = results.find(r => r.playerId === result.lootAlliance);
        const alliedBid = bidsMap.get(result.lootAlliance || '');
        if (alliedResult && alliedBid && alliedResult.tricks === alliedBid.bid) {
          scoreChange += 20;
        }
      }

      // Reverse Loot Alliance (If someone allied with me)
      const alliedWithMe = results.filter(r => r.lootAlliance === result.playerId);
      for (const allyResult of alliedWithMe) {
        const alliedBid = bidsMap.get(allyResult.playerId);
        if (alliedBid && allyResult.tricks === alliedBid.bid) {
          scoreChange += 20;
        }
      }
    }

    scoreChanges.push({ playerId: result.playerId, scoreChange });
  }

  return scoreChanges;
};

export const calculateRoundScores = async (roomId: string, roundId: number, players: Player[]): Promise<void> => {
  const resultsRef = collection(db, `rooms/${roomId}/rounds/${roundId}/results`);
  const bidsRef = collection(db, `rooms/${roomId}/rounds/${roundId}/bids`);
  
  try {
    const [resultsSnap, bidsSnap] = await Promise.all([getDocs(resultsRef), getDocs(bidsRef)]);
    const results = resultsSnap.docs.map(doc => doc.data() as Result);
    const bids = bidsSnap.docs.map(doc => doc.data() as Bid);
    
    const scoreChanges = computeScores(roundId, results, bids);

    const batch = writeBatch(db);
    
    scoreChanges.forEach(({ playerId, scoreChange }) => {
      // Update result doc with calculated score
      const resultRef = doc(db, `rooms/${roomId}/rounds/${roundId}/results`, playerId);
      batch.update(resultRef, { scoreChange });

      // Update player total score
      const playerRef = doc(db, `rooms/${roomId}/players`, playerId);
      batch.update(playerRef, {
        score: increment(scoreChange)
      });
    });
    
    const roomRef = doc(db, 'rooms', roomId);
    const roundRef = doc(db, `rooms/${roomId}/rounds`, roundId.toString());
    
    batch.update(roomRef, { status: 'LEADERBOARD' });
    batch.update(roundRef, { status: 'COMPLETED' });
    
    await batch.commit();
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERROR_')) {
      throw error; // Re-throw validation errors to be caught by the UI
    }
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
};

export const finishGame = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);
  const playersRef = collection(db, `rooms/${roomId}/players`);
  
  try {
    const playersSnap = await getDocs(playersRef);
    const batch = writeBatch(db);
    
    // Reset all player scores to 0
    playersSnap.docs.forEach(playerDoc => {
      batch.update(playerDoc.ref, { score: 0, isReady: false });
    });
    
    // Reset room status to LOBBY
    batch.update(roomRef, { 
      status: 'LOBBY', 
      currentRound: 0,
      dealerId: null 
    });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomRef.path);
  }
};

export const nextRound = async (roomId: string, currentRound: number): Promise<void> => {
  if (currentRound >= 10) {
    await finishGame(roomId);
    return;
  }
  
  const nextRoundId = currentRound + 1;
  const roomRef = doc(db, 'rooms', roomId);
  const roundRef = doc(db, `rooms/${roomId}/rounds`, nextRoundId.toString());
  
  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as Room;
    
    let nextDealerId = roomData.dealerId;
    if (roomData.playerOrder && roomData.dealerId) {
      const currentIndex = roomData.playerOrder.indexOf(roomData.dealerId);
      const nextIndex = (currentIndex + 1) % roomData.playerOrder.length;
      nextDealerId = roomData.playerOrder[nextIndex];
    }

    const batch = writeBatch(db);
    batch.update(roomRef, { 
      status: 'BETTING', 
      currentRound: nextRoundId,
      dealerId: nextDealerId
    });
    batch.set(roundRef, { id: nextRoundId.toString(), status: 'BETTING' });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomRef.path);
  }
};

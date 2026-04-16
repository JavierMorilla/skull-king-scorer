import { describe, it, expect } from 'vitest';
import { computeScores } from './gameService';
import { Result, Bid } from '../types';

describe('computeScores', () => {
  it('should correctly calculate scores for correct non-zero bids', () => {
    const roundId = 2;
    const bids: Bid[] = [
      { playerId: 'p1', bid: 2, extraBet: 0 }
    ];
    const results: Result[] = [
      {
        playerId: 'p1', tricks: 2,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];

    const scoreChanges = computeScores(roundId, results, bids);
    expect(scoreChanges[0].scoreChange).toBe(40); // 2 * 20
  });

  it('should correctly calculate scores for incorrect non-zero bids', () => {
    const roundId = 3;
    const bids: Bid[] = [
      { playerId: 'p1', bid: 2, extraBet: 0 }
    ];
    const results: Result[] = [
      {
        playerId: 'p1', tricks: 1, // Missed by 1
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];

    // total tricks sum mismatch throws error, so let's add dummy players to match total tricks
    const validResults: Result[] = [
      results[0],
      {
        playerId: 'p2', tricks: 2,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];
    const validBids: Bid[] = [
      bids[0],
      { playerId: 'p2', bid: 2, extraBet: 0 } // hits
    ];

    const scoreChanges = computeScores(roundId, validResults, validBids);
    const p1Score = scoreChanges.find(sc => sc.playerId === 'p1')?.scoreChange;
    expect(p1Score).toBe(-10); // Math.abs(2 - 1) * -10
  });

  it('should correctly calculate scores for correct blind/zero bids', () => {
    const roundId = 4;
    const bids: Bid[] = [
      { playerId: 'p1', bid: 0, extraBet: 0 },
      { playerId: 'p2', bid: 4, extraBet: 0 }
    ];
    const results: Result[] = [
      {
        playerId: 'p1', tricks: 0, // Hit zero bid
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      },
      {
        playerId: 'p2', tricks: 4,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];

    const scoreChanges = computeScores(roundId, results, bids);
    const p1Score = scoreChanges.find(sc => sc.playerId === 'p1')?.scoreChange;
    expect(p1Score).toBe(40); // 4 * 10
  });

  it('should correctly apply character bonuses when user hits bid', () => {
    const roundId = 2;
    const bids: Bid[] = [
      { playerId: 'p1', bid: 1, extraBet: 0 },
      { playerId: 'p2', bid: 1, extraBet: 0 }
    ];
    const results: Result[] = [
      {
        playerId: 'p1', tricks: 1, // hits
        bonusSkullKingCaptured: true, bonusPiratesCaptured: 1, bonusMermaidsCaptured: 1,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      },
      {
        playerId: 'p2', tricks: 1,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];

    const scoreChanges = computeScores(roundId, results, bids);
    const p1Score = scoreChanges.find(sc => sc.playerId === 'p1')?.scoreChange;
    // hits (1*20=20) + SK(+50) + Pirate(+30) + Mermaid(+20) = 120
    expect(p1Score).toBe(120);
  });

  it('should completely nullify character bonuses if White Whale is used', () => {
    const roundId = 2;
    const bids: Bid[] = [
      { playerId: 'p1', bid: 1, extraBet: 0 },
      { playerId: 'p2', bid: 1, extraBet: 0 }
    ];
    const results: Result[] = [
      {
        playerId: 'p1', tricks: 1, // hits
        bonusSkullKingCaptured: true, bonusPiratesCaptured: 2, bonusMermaidsCaptured: 0,
        bonus14sColor: 1, // 14s should still apply!
        bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: true, lootAlliance: null, scoreChange: 0
      },
      {
        playerId: 'p2', tricks: 1,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];

    const scoreChanges = computeScores(roundId, results, bids);
    const p1Score = scoreChanges.find(sc => sc.playerId === 'p1')?.scoreChange;
    // hits (1*20=20) + 14sColor(+10) = 30. (SK and Pirates nullified)
    expect(p1Score).toBe(30);
  });

  it('should decrease expected tricks if Kraken is used', () => {
    const roundId = 3;
    const bids: Bid[] = [
      { playerId: 'p1', bid: 1, extraBet: 0 },
      { playerId: 'p2', bid: 1, extraBet: 0 }
    ];
    const results: Result[] = [
      {
        playerId: 'p1', tricks: 1,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: true, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      },
      {
        playerId: 'p2', tricks: 1,
        bonusSkullKingCaptured: false, bonusPiratesCaptured: 0, bonusMermaidsCaptured: 0,
        bonus14sColor: 0, bonus14sBlack: false, krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      }
    ];

    // Total tricks is 2. Round ID is 3. Since Kraken is used, expected tricks is 2.
    // So this should NOT throw an error.
    expect(() => computeScores(roundId, results, bids)).not.toThrow();

    const scoreChanges = computeScores(roundId, results, bids);
    expect(scoreChanges.find(sc => sc.playerId === 'p1')?.scoreChange).toBe(20);
    expect(scoreChanges.find(sc => sc.playerId === 'p2')?.scoreChange).toBe(20);
  });

  describe('Simulación Completa de Partida - 10 Rondas', () => {
    it('should accurately track expected cumulative scores through 10 mathematically complex rounds', () => {
      let aliceScore = 0;
      let bobScore = 0;
      let charlieScore = 0;

      const p1 = 'alice';
      const p2 = 'bob';
      const p3 = 'charlie';

      const buildBaseResult = (playerId: string): Result => ({
        playerId, tricks: 0, bonusSkullKingCaptured: false, bonusPiratesCaptured: 0,
        bonusMermaidsCaptured: 0, bonus14sColor: 0, bonus14sBlack: false,
        krakenUsed: false, whiteWhaleUsed: false, lootAlliance: null, scoreChange: 0
      });

      // --- ROUND 1: Básico ---
      // Alice bids 1, gets 1. Bob bids 0, misses (gets 1). Charlie bids 0, hits (gets 0).
      // Wait, if Bob misses his 0 bid by getting 1, total tricks = 2? No, round 1 max tricks is 1.
      // So Bob misses his 0 bid by getting 1 (if Kraken? No Kraken in round 1 yet).
      // Let's do: Alice bids 1, gets 1. Bob bids 0, gets 0. Charlie bids 0, gets 0.
      let roundId = 1;
      let bids: Bid[] = [
        { playerId: p1, bid: 1, extraBet: 0 },
        { playerId: p2, bid: 0, extraBet: 0 },
        { playerId: p3, bid: 0, extraBet: 0 },
      ];
      let results: Result[] = [
        { ...buildBaseResult(p1), tricks: 1 },
        { ...buildBaseResult(p2), tricks: 0 },
        { ...buildBaseResult(p3), tricks: 0 },
      ];
      let scoreChanges = computeScores(roundId, results, bids);
      // Alice: 1*20=20. Bob: 10. Charlie: 10.
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(20);
      expect(bobScore).toBe(10);
      expect(charlieScore).toBe(10);

      // --- ROUND 2: Skull King vs Piratas ---
      // Alice bids 1, gets 1, bonusPiratesCaptured: 1.
      // Bob bids 1, gets 1, misses. (Charlie gets 0). Total 2 tricks.
      roundId = 2;
      bids = [
        { playerId: p1, bid: 1, extraBet: 0 },
        { playerId: p2, bid: 1, extraBet: 0 },
        { playerId: p3, bid: 0, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 1, bonusPiratesCaptured: 1, bonusSkullKingCaptured: true }, // King + Pirate. Error, can't capture King if caching Pirate. Wait, King captures Pirate. Ah, `bonusPiratesCaptured` means "Pirates captured by SK".
        { ...buildBaseResult(p2), tricks: 1 },
        { ...buildBaseResult(p3), tricks: 0 },
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice: hits(20) + SK(+50) + Pirate(+30) = +100
      // Bob: hits(20) = +20
      // Charlie: hits(20) = +20 (0 bid hits for 2*10=20)
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(120); // 20 + 100
      expect(bobScore).toBe(30); // 10 + 20
      expect(charlieScore).toBe(30); // 10 + 20

      // --- ROUND 3: Kraken! ---
      // Kraken played -> expected tricks = 2.
      // Alice 1, Bob 1, Charlie 0 (tricks=0).
      roundId = 3;
      bids = [
        { playerId: p1, bid: 2, extraBet: 0 }, // misses (bids 2 gets 1)
        { playerId: p2, bid: 1, extraBet: 0 }, // hits (1 gets 1)
        { playerId: p3, bid: 0, extraBet: 0 }, // hits (0 gets 0)
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 1, krakenUsed: true },
        { ...buildBaseResult(p2), tricks: 1 },
        { ...buildBaseResult(p3), tricks: 0 },
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice: missed by 1 = -10
      // Bob: hits = +20
      // Charlie: hits 0 = +30
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(110);
      expect(bobScore).toBe(50);
      expect(charlieScore).toBe(60);

      // --- ROUND 4: Catorces ---
      // Colored 14 (+10/ea), Black 14 (+20)
      roundId = 4;
      bids = [
        { playerId: p1, bid: 2, extraBet: 0 },
        { playerId: p2, bid: 1, extraBet: 0 },
        { playerId: p3, bid: 1, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 2, bonus14sColor: 2 }, // Hits, +20 bonus
        { ...buildBaseResult(p2), tricks: 1, bonus14sBlack: true }, // Hits, +20 bonus
        { ...buildBaseResult(p3), tricks: 1 }, // Hits
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice: 40 + 20 = 60
      // Bob: 20 + 20 = 40
      // Charlie: 20
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(170);
      expect(bobScore).toBe(90);
      expect(charlieScore).toBe(80);

      // --- ROUND 5: Ballena Blanca ---
      // 5 tricks. White Whale nullifies SK/Pirates/Mermaids!
      roundId = 5;
      bids = [
        { playerId: p1, bid: 3, extraBet: 0 },
        { playerId: p2, bid: 1, extraBet: 0 },
        { playerId: p3, bid: 1, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 3, bonusSkullKingCaptured: true, bonusPiratesCaptured: 2, whiteWhaleUsed: true }, // +110 bonus normally, but NULLIFIED
        { ...buildBaseResult(p2), tricks: 1 }, 
        { ...buildBaseResult(p3), tricks: 1 },
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice: hits 3 = 60. Bonus = 0!
      // Bob = 20. Charlie = 20.
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(230);
      expect(bobScore).toBe(110);
      expect(charlieScore).toBe(100);

      // --- ROUND 6: Rascal / Extra Bets ---
      // Alice bids 0, places an extra blind bet of 20 points! Hits perfectly.
      roundId = 6;
      bids = [
        { playerId: p1, bid: 0, extraBet: 20 }, // 0 bid + 20 extra points!
        { playerId: p2, bid: 3, extraBet: 0 },
        { playerId: p3, bid: 3, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 0 },
        { ...buildBaseResult(p2), tricks: 3 }, 
        { ...buildBaseResult(p3), tricks: 3 },
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice hits 0 (60) + extra bet (+20) = +80
      // Bob hits 3 = 60. Charlie hits 3 = 60.
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(310); // 230 + 80
      expect(bobScore).toBe(170); // 110 + 60
      expect(charlieScore).toBe(160); // 100 + 60

      // --- ROUND 7: Capturas Extrañas (Sirena atrapa SK) ---
      roundId = 7;
      bids = [
        { playerId: p1, bid: 2, extraBet: 0 },
        { playerId: p2, bid: 3, extraBet: 0 },
        { playerId: p3, bid: 2, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 2 },
        { ...buildBaseResult(p2), tricks: 3, bonusMermaidsCaptured: 1 }, 
        { ...buildBaseResult(p3), tricks: 2 },
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice hits 2 (+40).
      // Bob hits 3 (60) + 20(Mermaid) = +80. If I activate bonusSkullKingCaptured it's +50.
      // Charlie hits 2 (+40).
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(350); // 310 + 40
      expect(bobScore).toBe(250); // 170 + 80
      expect(charlieScore).toBe(200); // 160 + 40

      // --- ROUND 8: El gran fracaso del cero ---
      roundId = 8;
      bids = [
        { playerId: p1, bid: 0, extraBet: 0 }, // tries 0
        { playerId: p2, bid: 4, extraBet: 0 },
        { playerId: p3, bid: 4, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 1 }, // gets 1, misses 0-bid! -80!
        { ...buildBaseResult(p2), tricks: 3 }, // misses by 1 = -10
        { ...buildBaseResult(p3), tricks: 4 }, // hits 4 = 80
      ];
      scoreChanges = computeScores(roundId, results, bids);
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(270); // 350 - 80 
      expect(bobScore).toBe(240); // 250 - 10
      expect(charlieScore).toBe(280); // 200 + 80

      // --- ROUND 9: Alianza de Botín fallida ---
      roundId = 9;
      bids = [
        { playerId: p1, bid: 4, extraBet: 0 },
        { playerId: p2, bid: 2, extraBet: 0 }, // Alice and Bob ally!
        { playerId: p3, bid: 3, extraBet: 0 },
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 4, lootAlliance: p2 }, // Hits, but bob misses
        { ...buildBaseResult(p2), tricks: 1, lootAlliance: p1 }, // Misses by 1! So Alliance breaks!
        { ...buildBaseResult(p3), tricks: 4 }, // Misses by 1
      ];
      scoreChanges = computeScores(roundId, results, bids);
      // Alice: Hits normally! = 80. Bob: -10. Charlie: -10.
      aliceScore += scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      expect(aliceScore).toBe(350); // 270 + 80
      expect(bobScore).toBe(230); // 240 - 10
      expect(charlieScore).toBe(270); // 280 - 10

      // --- ROUND 10: Botín Épico Perfecto ---
      roundId = 10;
      bids = [
        { playerId: p1, bid: 4, extraBet: 0 },
        { playerId: p2, bid: 2, extraBet: 0 },
        { playerId: p3, bid: 4, extraBet: 0 }, // Alice and Charlie ally!
      ];
      results = [
        { ...buildBaseResult(p1), tricks: 4, lootAlliance: p3 },
        { ...buildBaseResult(p2), tricks: 2 },
        { ...buildBaseResult(p3), tricks: 4, lootAlliance: p1 },
      ];
      scoreChanges = computeScores(roundId, results, bids);
      
      const aliceDelta = scoreChanges.find(s => s.playerId === p1)!.scoreChange;
      const charlieDelta = scoreChanges.find(s => s.playerId === p3)!.scoreChange;
      
      // Compute expected:
      // Alice bid 4 (4*20=80). Partner Charlie hits. Alliance bonus +20+20=40! Total 120.
      aliceScore += aliceDelta;
      bobScore += scoreChanges.find(s => s.playerId === p2)!.scoreChange;
      charlieScore += charlieDelta;
      
      expect(aliceDelta).toBe(120);
      expect(charlieDelta).toBe(120);

      expect(aliceScore).toBe(350 + 120);
      expect(bobScore).toBe(230 + 40); // hits 2 (+40)
      expect(charlieScore).toBe(270 + 120);
    });
  });
});

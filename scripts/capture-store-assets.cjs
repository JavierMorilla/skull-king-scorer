const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const viewports = [
  { name: 'mobile', width: 1080, height: 1920, scale: 1 },
  { name: 'tablet_7_inch', width: 2133, height: 1200, scale: 1 },
  { name: 'tablet_10_inch', width: 2844, height: 1600, scale: 1 }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
    console.log('🚀 Iniciando sesión de fotos fotográfica (Mock Mágico)...');
    const browser = await chromium.launch({ headless: true });
    
    const players = [
        { id: 'local_p0', name: 'Blackbeard', score: 120, isHost: true, joinedAt: null },
        { id: 'local_p1', name: 'Anne Bonny', score: 250, isHost: false, joinedAt: null },
        { id: 'local_p2', name: 'Calico Jack', score: -30, isHost: false, joinedAt: null },
        { id: 'local_p3', name: 'Captain Kidd', score: 80, isHost: false, joinedAt: null }
    ];
    
    const settings = { krakenEnabled: true, whiteWhaleEnabled: true, characterBonusesEnabled: true, fourteenBonusesEnabled: true, extraBetEnabled: true, lootEnabled: true };
    const baseState = {
        fullPlayers: players,
        players: players.map(p => p.name),
        settings: settings,
        currentRound: 6
    };

    const bids = [
         { playerId: 'local_p0', bid: 2, isDone: true },
         { playerId: 'local_p1', bid: 0, isDone: true },
         { playerId: 'local_p2', bid: 4, isDone: true },
         { playerId: 'local_p3', bid: 1, isDone: true }
    ];

    const results = [
         { playerId: 'local_p0', won: 2, bonus: 50 },
         { playerId: 'local_p1', won: 0, bonus: 0 },
         { playerId: 'local_p2', won: 2, bonus: 0 },
         { playerId: 'local_p3', won: 1, bonus: 0 }
    ];

    for (const v of viewports) {
       console.log(`\n📸 Configurando dispositivo: ${v.name} (${v.width}x${v.height})`);
       
       const outDir = path.join(__dirname, '../android/play_store_screenshots', v.name);
       if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

       const context = await browser.newContext({
          viewport: { width: v.width, height: v.height },
          deviceScaleFactor: v.scale
       });
       
       const page = await context.newPage();
       
       // Inject lang and clear
       await page.goto('http://localhost:3000');
       await page.evaluate(() => { localStorage.clear(); localStorage.setItem('skullking_lang', 'en'); });
       await page.reload();
       await sleep(1000);
       await page.screenshot({ path: path.join(outDir, '01_home.png') });
       console.log(`  ✓ 01_home.png capturada.`);

       // 2. Betting Phase
       const bettingState = { ...baseState, status: 'BETTING', bids: [], results: [] };
       await page.evaluate((state) => {
           localStorage.setItem('skullking_roomId', 'LOCAL_GAME');
           localStorage.setItem('skullking_local_setup', JSON.stringify(state));
       }, bettingState);
       await page.reload();
       await sleep(1500);
       
       // En betting, quitamos "Pass Phone" pulsando "I am"
       try { await page.click('button:has-text("I am ")'); } catch(e){}
       await sleep(500);
       
       await page.screenshot({ path: path.join(outDir, '02_betting.png') });
       console.log(`  ✓ 02_betting.png capturada.`);

       // 3. Results Phase
       const resultsState = { ...baseState, status: 'RESULTS', bids: bids, results: [] };
       await page.evaluate((state) => {
           localStorage.setItem('skullking_local_setup', JSON.stringify(state));
       }, resultsState);
       await page.reload();
       await sleep(1500);
       try { await page.click('button:has-text("I am ")'); } catch(e){}
       await sleep(500);
       await page.screenshot({ path: path.join(outDir, '03_results.png') });
       console.log(`  ✓ 03_results.png capturada.`);

       // 4. Leaderboard Phase
       const leaderboardState = { ...baseState, status: 'LEADERBOARD', bids: bids, results: results };
       await page.evaluate((state) => {
           localStorage.setItem('skullking_local_setup', JSON.stringify(state));
       }, leaderboardState);
       await page.reload();
       await sleep(1500);
       await page.screenshot({ path: path.join(outDir, '04_leaderboard.png') });
       console.log(`  ✓ 04_leaderboard.png capturada.`);

       // 5. Options Menu
       // Let's go to Options Menu in Home
       await page.evaluate(() => { localStorage.clear(); localStorage.setItem('skullking_lang', 'en'); });
       await page.reload();
       await sleep(1000);
       await page.click('button:has(span:text("menu"))');
       await sleep(1000);
       await page.screenshot({ path: path.join(outDir, '05_options.png') });
       console.log(`  ✓ 05_options.png capturada.`);

       await context.close();
    }
    
    await browser.close();
    console.log('\n✅ ¡Capturas fotográficas visuales finales generadas exitosamente!');
})();

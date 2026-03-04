const fs = require('fs');
let activeTrades = {};

// Pašlaik cena ir ~11634.9 (BID)
// Lai testētu slēgšanos "Phase_1", the script `fix_start_mon.js` checks:
// currentPrice <= sl vai currentPrice >= tp3 vai tp1
// Ieliksim tp1 = 11634.5 lai tas sakrīt.
activeTrades['CS.D.EURUSD.CFD.IP'] = {
    dealId: 'DIAAAAWR7QAMFAM',
    direction: 'BUY',
    openLevel: 11634.7,
    size: 1,
    tp1: 11634.5, // Ļoti tuvs mērķis
    tp2: 12034.7,
    tp3: 11636.0, 
    sl: 11630.0,
    status: 'PHASE_1',
    entryTimestamp: new Date().toISOString()
};

fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
console.log("Atjaunoti lokālie mērķi - Gatavs izsišanai");

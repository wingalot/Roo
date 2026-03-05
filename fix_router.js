const fs = require('fs');

const fileCode = fs.readFileSync('signal_router.js', 'utf8');

const updatedCode = fileCode.replace(
    /\/\/ Šeit var apstrādāt BUY \/ SELL \/ LIMIT/,
`
    // ======== FELIX SIGNALS BUY/SELL izpilde ========
    const { createMarketOrder } = require('./ig_rest_api');
    
    // Check if it's a MARKET order
    // Ex. "BUY XAUUSD 5152.9" or "SELL GBPJPY 209.39"
    const match = signal.text.match(/(BUY|SELL)\\s+([A-Z]+)\\s+([0-9.]+)/i);
    
    if (match && !signal.text.toLowerCase().includes('cancel') && !signal.text.toLowerCase().includes('hit')) {
        const direction = match[1].toUpperCase();
        let pair = match[2].toUpperCase();
        const price = parseFloat(match[3]);

        console.log(\`🔥 Pārbaudīts MARKET: \${direction} \${pair} pie \${price}\`);
        
        // Pārvēršam Felix pārus par IG Epic.
        let epic = '';
        if (pair === 'XAUUSD') epic = 'CS.D.CFDGOLD.CFDGC.IP';
        else if (pair === 'GBPUSD') epic = 'CS.D.GBPUSD.CFD.IP';
        else if (pair === 'GBPJPY') epic = 'CS.D.GBPJPY.CFD.IP';
        else if (pair === 'EURUSD') epic = 'CS.D.EURUSD.CFD.IP';
        else if (pair === 'EURAUD') epic = 'CS.D.EURAUD.CFD.IP';
        else console.log(\`⚠️ Nezināms pāris: \${pair}\`);

        if (epic) {
            try {
                // Lai saņemtu targetus SL un TP (ja vajag lokālajai bāzei)
                // "🔴SL: 5140.9" un "🤑TP1: 5154.4"
                const slMatch = signal.text.match(/SL:\\s*([0-9.]+)/i);
                const tp1Match = signal.text.match(/TP1:\\s*([0-9.]+)/i);
                const tp2Match = signal.text.match(/TP2:\\s*([0-9.]+)/i);
                const tp3Match = signal.text.match(/TP3:\\s*([0-9.]+)/i);
                
                const sl = slMatch ? parseFloat(slMatch[1]) : 0;
                const tp1 = tp1Match ? parseFloat(tp1Match[1]) : 0;
                const tp2 = tp2Match ? parseFloat(tp2Match[1]) : 0;
                const tp3 = tp3Match ? parseFloat(tp3Match[1]) : 0;
                
                const auth = await loginIG();
                
                // Mēs taisām size 1 kā baseline, vēlāk to var piesaistīt risk/SL. 
                const res = await createMarketOrder(auth, epic, direction, 1);
                
                console.log("MARKET TIRDZNIECĪBA IESNIEGTA IG. Deal:", res.dealReference);
                
                // Pēc atvēršanas reģistrējam to lokāli priekš TP/SL monitora.
                let activeTrades = {};
                if (fs.existsSync('active_trades.json')) {
                    activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
                }
                
                // Tā kā nevaram vārīties un gaidīt apstiprinājumu, liekam viltus PENDING_MARKET uzreiz
                const tradeKey = epic;
                activeTrades[tradeKey] = {
                    telegramMsgId: signal.id,
                    epic: epic,
                    direction: direction,
                    size: 1, // baseline
                    entry: price,
                    sl: sl,
                    tp1: tp1,
                    tp2: tp2,
                    tp3: tp3,
                    status: 'PHASE_1',
                    entryTimestamp: new Date().toISOString(),
                    dealReference: res.dealReference
                };
                
                fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
                console.log("Saglabāts \`active_trades.json\` sekmīgi!");
                
            } catch (err) {
                 console.error("Kļūda izpildot BUY/SELL MARKET: ", err.message);
            }
        }
    }
`
);

fs.writeFileSync('signal_router.js', updatedCode);
console.log('signal_router.js patched with true Felix signal execution!');

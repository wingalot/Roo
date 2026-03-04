require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

function logMsg(msg) {
    console.log(`[SYNC ${new Date().toISOString()}] ${msg}`);
}

async function login() {
    const lg = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    return { cst: lg.headers['cst'], secToken: lg.headers['x-security-token'] };
}

async function syncLoop() {
    logMsg("🔄 Sāku Sinhronizācijas Pārbaudi...");
    try {
        const auth = await login();
        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': auth.cst, 
            'X-SECURITY-TOKEN': auth.secToken, 
            'Version': '1' 
        };
        
        let pendingOrders = {};
        if (fs.existsSync('pending_orders.json')) {
            pendingOrders = JSON.parse(fs.readFileSync('pending_orders.json'));
        }
        
        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
        const igPositions = posRes.data.positions.map(p => ({
            dealId: p.position.dealId,
            epic: p.market.epic,
            direction: p.position.direction,
            dealSize: p.position.dealSize,
            currency: p.position.currency
        }));
        
        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json'));
        }
        
        const localDealIds = new Set(Object.values(activeTrades).map(t => t.dealId));
        const igDealIds = new Set(igPositions.map(p => p.dealId));
        let modificationsMade = false;

        // --- 3. PĀRBAUDAM TELEGRAM UPDATE (Move StopLoss) ---
        if (fs.existsSync('latest_signals.json')) {
            const signals = JSON.parse(fs.readFileSync('latest_signals.json', 'utf8'));
            let localTradesModified = false;
            
            for (const msg of signals) {
                if (!msg.text || !msg.reply_to) continue;
                
                const txt = msg.text.toLowerCase().replace(/sl:/g, "stoploss").replace(/ /g, "");

                // Mēģinām atrast Breakeven (BE) komandas
                if (txt.includes('stoplosstobreakeven') || txt.includes('sltobreakeven') || txt.includes('move sl to be') || msg.text.toLowerCase().includes('move stoploss to breakeven')) {
                    for (const [epic, trade] of Object.entries(activeTrades)) {
                        if (trade.telegramMsgId === msg.reply_to || !trade.telegramMsgId) {
                            if(trade.sl !== trade.entryPrice) {
                                logMsg(`📲 TELEGRAM UPDATE saņemts: Pārcelts SL uz BREAKEVEN (${trade.entryPrice}) instrumentam ${epic}`);
                                trade.sl = trade.entryPrice;
                                trade.telegramMsgId = msg.reply_to; // piesiets
                                localTradesModified = true;
                                modificationsMade = true;
                                
                                try {
                                    const { execSync } = require('child_process');
                                    execSync(`openclaw message send --target "395239117" --channel "telegram" --message "🛡️ **StopLoss Pārcelts uz Breakeven (Entry Price)!**\n\nInstruments: ${epic}\nJaunais SL: ${trade.entryPrice}\nPamatojums: Felix Update"`);
                                } catch(e) {}
                            }
                        }
                    }
                }

                const match = txt.match(/movestoploss/[a-z]*([0-9.]+)/i) || 
                              txt.match(/moveslto([0-9.]+)/i) || 
                              msg.text.toLowerCase().match(/move stoploss to ([0-9.]+)/) || 
                              msg.text.toLowerCase().match(/move sl to ([0-9.]+)/);

                if (match && match[1]) {
                    const parsedSl = parseFloat(match[1]);

                    // Pārbaudam Active Trades
                    for (const [epic, trade] of Object.entries(activeTrades)) {
                        if (trade.telegramMsgId === msg.reply_to && trade.sl !== parsedSl) {
                            logMsg(`📲 TELEGRAM UPDATE saņemts: Pārcelts SL uz ${parsedSl} instrumentam ${epic}`);
                            trade.sl = parsedSl;
                            localTradesModified = true;
                            modificationsMade = true;
                            
                            try {
                                const { execSync } = require('child_process');
                                execSync(`openclaw message send --target "395239117" --channel "telegram" --message "🔄 **StopLoss Automātiski Pārcelts!**\n\nInstruments: ${epic}\nJaunais SL: ${parsedSl}\nPamatojums: Saņemts atjauninājums no Felix"`);
                            } catch(e) {}
                        }
                    }
                    
                    // Pārbaudam arī Pending Orders (ja SL mainīts pirms limit orderis atvērts)
                    for (const [pKey, pData] of Object.entries(pendingOrders)) {
                        if (pData.telegramMsgId === msg.reply_to && pData.sl !== parsedSl) {
                            logMsg(`📲 TELEGRAM UPDATE saņemts (Limit): Pārcelts SL uz ${parsedSl} instrumentam ${pData.epic}`);
                            pData.sl = parsedSl;
                            fs.writeFileSync('pending_orders.json', JSON.stringify(pendingOrders, null, 2));
                            
                            try {
                                const { execSync } = require('child_process');
                                execSync(`openclaw message send --target "395239117" --channel "telegram" --message "🔄 **Limit Orderim StopLoss Pārcelts!**\n\nInstruments: ${pData.epic}\nJaunais SL: ${parsedSl}"`);
                            } catch(e) {}
                        }
                    }
                }
            }
            if (localTradesModified) {
                fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            }
        }
        // --- BEIGAS TELEGRAM UPDATE ---

        
        for (const igPos of igPositions) {
            if (!localDealIds.has(igPos.dealId)) {
                let matchedPendingKey = null;
                for (const [pKey, pData] of Object.entries(pendingOrders)) {
                    // Vienkārsojam: ja sakrīt epic (instruments)
                    if (pData.epic === igPos.epic) {
                        matchedPendingKey = pKey;
                        break;
                    }
                }
                
                if (matchedPendingKey) {
                    const pData = pendingOrders[matchedPendingKey];
                    logMsg(`🎯 ATPAZĪTS: Limit orderis izpildījies! Jaunais Deal ID: ${igPos.dealId} (${igPos.epic})`);
                    
                    activeTrades[igPos.epic] = {
                        dealId: igPos.dealId,
                        epic: igPos.epic,
                        direction: igPos.direction,
                        size: igPos.dealSize,
                        entryPrice: pData.entryPrice || 0,
                        tp1: pData.tp1,
                        tp2: pData.tp2,
                        sl: pData.sl,
                        phase: 1,
                        highestPnl: 0
                    };
                    
                    delete pendingOrders[matchedPendingKey];
                    fs.writeFileSync('pending_orders.json', JSON.stringify(pendingOrders, null, 2));
                    localDealIds.add(igPos.dealId);
                    modificationsMade = true;
                    
                    try {
                        const { execSync } = require('child_process');
                        console.log(`✅ Pievienoju... Paziņoju Telegramam.`);
                        execSync(`openclaw message send --target "395239117" --channel "telegram" --message "🎯 **Limit Orderis Aktivizēts!**\n\nInstruments: ${igPos.epic}\nTagad lokālais TP/SL dzinējs sāk to uzraudzīt. Deal ID: ${igPos.dealId}"`);
                    } catch(e) {}
                    continue;
                }
                
                logMsg(`🚨 KONFLIKTS: IG atrasta pozīcija, kuras nav lokālajā uzraudzībā! DealId: ${igPos.dealId} (${igPos.epic}). Prasu atļauju...`);
                try {
                    const { execSync } = require('child_process');
                    execSync(`openclaw message send --target "395239117" --channel "telegram" --message "⚠️ **Uzmanību! Atrasts fiktīvs (Orphan) orderis IG kontā!**\n\n**Instruments:** ${igPos.epic}\n**Deal ID:** ${igPos.dealId}\n**Izmērs:** ${igPos.dealSize} (${igPos.direction})\n\nŠī pozīcija atrodas atvērta IG, bet nav mūsu sistēmas uzskaitē. Vai vēlies, lai es to **aizveru** nekavējoties?"`);
                } catch(tgErr) {}
            }
        }
        
        for (const [key, tradeObj] of Object.entries(activeTrades)) {
            if (!igDealIds.has(tradeObj.dealId)) {
                logMsg(`🚨 KONFLIKTS: Lokāli ir gaidāma pozīcija ${tradeObj.dealId} (${key}), bet IG tā vairs neeksistē. Dzēšu lokālo.`);
                delete activeTrades[key];
                modificationsMade = true;
            }
        }
        
        if (modificationsMade) {
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            logMsg("💾 Lokālā datubāze atjaunināta.");
        } else {
            logMsg("✅ Sistēmas Sinhronizētas.");
        }
    } catch(err) {
        logMsg(`CRITICAL Kļūda Sinhronizatorā: ${err.message}`);
    }
}

setInterval(syncLoop, 30000);
logMsg("Sāku fona procesu - IG vs Local Monitoring & Tīrīšana...");
syncLoop();

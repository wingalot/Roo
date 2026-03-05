const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const SIGNALS_FILE = 'latest_signals.json';
const PROCESSED_FILE = 'processed_signals.json';

let processedIds = [];
if (fs.existsSync(PROCESSED_FILE)) {
    processedIds = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
}

async function loginIG() {
    const res = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    return {
        cst: res.headers['cst'],
        secToken: res.headers['x-security-token']
    };
}

// Vienkāršs parseris demonstrācijai / Limit atcelšanai
async function processSignal(signal) {
    if (processedIds.includes(signal.id)) return;
    console.log(`Pamanīts jauns signāls ID: ${signal.id}`);
    
    // Šeit apstrādā Limit Atcelšanu (Cancel)
    if (signal.text && signal.text.toLowerCase().includes('cancel')) {
        console.log(`Sāku atcelt atvērto Limit orderi no signāla ID: ${signal.reply_to || 'nezināms'}`);
        // Loģika kas atceļ...
        await cancelLimitLogic(signal.reply_to);
    }
    
    
    // ======== FELIX SIGNALS BUY/SELL izpilde ========
    const { createMarketOrder, createLimitOrder } = require('./ig_rest_api');
    
    // Šeit nolasām LIMIT vai MARKET.
    // LIMIT: "BUY LIMIT XAUUSD 5152.9"
    // MARKET: "BUY XAUUSD 5152.9"
    let isLimit = false;
    let limitPrice = null;
    let match = signal.text.match(/(BUY|SELL)\s+LIMIT\s+([A-Z]+)\s+([0-9.]+)/i);
    if(match) {
        isLimit = true;
    } else {
        match = signal.text.match(/(BUY|SELL)\s+([A-Z]+)\s+([0-9.]+)/i);
    }
    
    if (match && !signal.text.toLowerCase().includes('cancel') && !signal.text.toLowerCase().includes('hit')) {
        const direction = match[1].toUpperCase();
        let pair = match[2].toUpperCase();
        const price = parseFloat(match[3]);

        if(isLimit) {
            limitPrice = price;
            console.log(`⏱️ Pārbaudīts LIMIT: ${direction} ${pair} pie ${price}`);
        } else {
            console.log(`🔥 Pārbaudīts MARKET: ${direction} ${pair} pie ${price}`);
        }
        
        // Pārvēršam Felix pārus par IG Epic.
        let epic = '';
        if (pair === 'XAUUSD') epic = 'CS.D.CFDGOLD.CFDGC.IP';
        else if (pair === 'GBPUSD') epic = 'CS.D.GBPUSD.CFD.IP';
        else if (pair === 'GBPJPY') epic = 'CS.D.GBPJPY.CFD.IP';
        else if (pair === 'EURUSD') epic = 'CS.D.EURUSD.CFD.IP';
        else if (pair === 'EURAUD') epic = 'CS.D.EURAUD.CFD.IP';
        else console.log(`⚠️ Nezināms pāris: ${pair}`);

        if (epic) {
            try {
                // Lai saņemtu targetus SL un TP (ja vajag lokālajai bāzei)
                // "🔴SL: 5140.9" un "🤑TP1: 5154.4"
                const slMatch = signal.text.match(/SL:\s*([0-9.]+)/i);
                const tp1Match = signal.text.match(/TP1:\s*([0-9.]+)/i);
                const tp2Match = signal.text.match(/TP2:\s*([0-9.]+)/i);
                const tp3Match = signal.text.match(/TP3:\s*([0-9.]+)/i);
                
                const sl = slMatch ? parseFloat(slMatch[1]) : 0;
                const tp1 = tp1Match ? parseFloat(tp1Match[1]) : 0;
                const tp2 = tp2Match ? parseFloat(tp2Match[1]) : 0;
                const tp3 = tp3Match ? parseFloat(tp3Match[1]) : 0;
                
                const auth = await loginIG();
                
                // Mēs taisām size 1 kā baseline, vēlāk to var piesaistīt risk/SL. 
                let res;
                if(isLimit) {
                     res = await createLimitOrder(auth, epic, direction, 1, limitPrice);
                     console.log("LIMIT TIRDZNIECĪBA IESNIEGTA IG. DealRef:", res.dealReference);
                } else {
                     res = await createMarketOrder(auth, epic, direction, 1);
                     console.log("MARKET TIRDZNIECĪBA IESNIEGTA IG. DealRef:", res.dealReference);
                }
                
                // Pagaidām dažas sekundes, lai IG apstrādā orderi un iedod īsto Deal ID (kas sākas ar DIAAAA...)
                await new Promise(r => setTimeout(r, 2000));
                
                let realDealId = res.dealReference;
                try {
                    const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${res.dealReference}`, {
                        headers: { 
                            'X-IG-API-KEY': process.env.IG_API_KEY, 
                            'CST': auth.cst, 
                            'X-SECURITY-TOKEN': auth.secToken, 
                            'Version': '1' 
                        }
                    });
                    if (confRes.data && confRes.data.dealId) {
                        realDealId = confRes.data.dealId;
                        console.log("Izgūts reālais Deal ID: " + realDealId);
                    }
                } catch(e) { console.log("Neizdevās iegūt īsto dealId, izmantosim reference"); }


                
                // Pēc atvēršanas reģistrējam to lokāli priekš TP/SL monitora.
                let activeTrades = [];
                if (fs.existsSync('active_trades.json')) {
                    try {
                        activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
                        if (!Array.isArray(activeTrades)) {
                            // conver to array if it is object natively
                            activeTrades = Object.values(activeTrades);
                        }
                    } catch(e) {}
                }
                
                activeTrades.push({
                    telegramMsgId: signal.id,
                    epic: epic,
                    direction: direction,
                    size: 1, // baseline
                    entry: price,
                    sl: sl,
                    tp1: tp1,
                    tp2: tp2,
                    tp3: tp3,
                    status: isLimit ? 'PENDING' : 'PHASE_1',
                    entryTimestamp: new Date().toISOString(),
                    dealId: realDealId // Limit orderam IG uzreiz arī dod dealId (vai string order reference) tālākai operācijām!
                });
                
                fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
                console.log("Saglabāts `active_trades.json` sekmīgi!");
                
            } catch (err) {
                 console.error("Kļūda izpildot BUY/SELL MARKET: ", err.message);
            }
        }
    }

    
    processedIds.push(signal.id);
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedIds));
}

async function cancelLimitLogic(targetMsgId) {
    let activeTrades = {};
    if (fs.existsSync('active_trades.json')) {
        activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
    }
    
    const tradeKeys = Object.keys(activeTrades);
    for (const key of tradeKeys) {
        const trade = activeTrades[key];
        if (trade.status === 'PENDING' && trade.telegramMsgId == targetMsgId) {
            console.log(`Dzēsīšu IG deal ${trade.dealId}`);
            try {
                const auth = await loginIG();
                const headers = { 
                    'X-IG-API-KEY': process.env.IG_API_KEY, 
                    'CST': auth.cst, 
                    'X-SECURITY-TOKEN': auth.secToken, 
                    'Version': '2',
                    'X-HTTP-Method-Override': 'DELETE',
                    'Content-Type': 'application/json'
                };
                await axios.post(`${process.env.IG_API_URL}/workingorders/otc/${trade.dealId}`, {}, { headers });
                console.log(`✅ Orderis ${trade.dealId} veiksmīgi atcelts!`);
                delete activeTrades[key];
                fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            } catch (err) {
                console.error("Kļūda dzēšot:", err.message);
            }
        }
    }
}

setInterval(() => {
    if (fs.existsSync(SIGNALS_FILE)) {
        try {
            const signals = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
            for (let i = signals.length - 1; i >= 0; i--) {
                const sig = signals[i];
                if (sig.id && !processedIds.includes(sig.id)) {
                    processSignal(sig).catch(console.error);
                }
            }
        } catch (e) {
            // Ignorē parse errorus
        }
    }
}, 2000);

console.log("🔥 Signal Router palaists. Gaidu jaunus signālus...");

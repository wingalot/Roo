require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Logu funkcija
function logMsg(msg) {
    console.log(`[SYNC ${new Date().toISOString()}] ${msg}`);
}

async function login() {
    const lg = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    return {
        cst: lg.headers['cst'],
        secToken: lg.headers['x-security-token']
    };
}

async function closeOrphanPosition(auth, position) {
    try {
        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': auth.cst, 
            'X-SECURITY-TOKEN': auth.secToken, 
            'Version': '1', 
            'X-HTTP-Method-Override': 'DELETE' 
        };
        await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            dealId: position.dealId,
            epic: position.epic,
            direction: position.direction === 'BUY' ? 'SELL' : 'BUY',
            size: position.dealSize,
            orderType: 'MARKET',
            currencyCode: position.currency,
            guaranteedStop: false,
            forceOpen: false,
            expiry: '-'
        }, { headers: h1 });
        logMsg(`✅ Veiksmīgi AIZVĒRTA nezināma (Orphan) pozīcija: ${position.dealId} (${position.epic})`);
    } catch(err) {
        logMsg(`❌ Kļūda AIZVEROT pozīciju ${position.dealId}: ${JSON.stringify(err.response?.data || err.message)}`);
    }
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
        
        // 1. Iegūstam Live pozīcijas no IG
        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
        const igPositions = posRes.data.positions.map(p => ({
            dealId: p.position.dealId,
            epic: p.market.epic,
            direction: p.position.direction,
            dealSize: p.position.dealSize,
            currency: p.position.currency
        }));
        
        // 2. Iegūstam lokālo atmiņu
        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json'));
        }
        
        // Izveidojam set lokālajiem DealId
        const localDealIds = new Set(Object.values(activeTrades).map(t => t.dealId));
        const igDealIds = new Set(igPositions.map(p => p.dealId));
        
        let modificationsMade = false;
        
        // SCENĀRIJS A: Pozīcija ir IG, bet nav LOKĀLI (Orphan / Uzkarināts Dublikāts)
        for (const igPos of igPositions) {
            if (!localDealIds.has(igPos.dealId)) {
                logMsg(`🚨 KONFLIKTS: IG atrasta pozīcija, kuras nav lokālajā uzraudzībā! DealId: ${igPos.dealId} (${igPos.epic}). Slēdzu ārā!`);
                await closeOrphanPosition(auth, igPos);
            }
        }
        
        // SCENĀRIJS B: Pozīcija ir LOKĀLI, bet nav IG (Aizvērta vai StopOut uz servera)
        for (const [key, tradeObj] of Object.entries(activeTrades)) {
            if (!igDealIds.has(tradeObj.dealId)) {
                logMsg(`🚨 KONFLIKTS: Lokāli ir gaidāma pozīcija ${tradeObj.dealId} (${key}), bet IG tā vairs neeksistē (Iespējams slēgta). Dzēšu lokālo uztveri.`);
                delete activeTrades[key];
                modificationsMade = true;
            }
        }
        
        // Saglabājam ja veicām lokālas izmaiņas
        if (modificationsMade) {
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            logMsg("💾 Lokālā datubāze atjaunināta, lai sakristu ar IG Serveri.");
        } else {
            logMsg("✅ Sistēmas ir Pilnībā Sinhronizētas (1:1). Turpinu dežūru.");
        }
        
    } catch(err) {
        logMsg(`CRITICAL Kļūda Sinhronizatorā: ${err.message}`);
    }
}

// Ciklisks izsaukums ik pēc 30 sekundēm
setInterval(syncLoop, 30000);

// Palaižam uzreiz pirmo reizi
logMsg("Sāku fona procesu - IG vs Local Monitoring & Tīrīšana...");
syncLoop();

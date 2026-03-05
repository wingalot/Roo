require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

let ignoredIgPositions = new Set();
// Saglabāsim paziņotos ID starp restartiem
const ignoredFile = 'ignored_deals.json';
if (fs.existsSync(ignoredFile)) {
    ignoredIgPositions = new Set(JSON.parse(fs.readFileSync(ignoredFile)));
}

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
        
        const axiosConfig = {
            headers: h1
        };

        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, axiosConfig);
        const igPositions = posRes.data.positions || [];
        
        let igWorkingOrders = [];
        try {
            const woRes = await axios.get(`${process.env.IG_API_URL}/workingorders`, axiosConfig);
            igWorkingOrders = woRes.data.workingOrders || [];
        } catch(e) { logMsg(`Brīdinājums: Nevarēja nolasīt limit orderus ${e.message}`); }
        
        const activeTradesPath = 'active_trades.json';
        let activeTrades = {};
        if (fs.existsSync(activeTradesPath)) {
            const fileData = fs.readFileSync(activeTradesPath, 'utf8');
            if (fileData.trim() !== '') {
                // Support both array and object formats for active_trades.json
                const parsed = JSON.parse(fileData);
                if (Array.isArray(parsed)) {
                    parsed.forEach(t => activeTrades[t.epic || t.dealId] = t);
                } else {
                    activeTrades = parsed;
                }
            }
        }
        
        const localDealIds = new Set(Object.values(activeTrades).map(t => t.dealId));
        
        let igDealIds = new Set();
        igPositions.forEach(p => igDealIds.add(p.position.dealId));
        igWorkingOrders.forEach(w => igDealIds.add(w.workingOrderData.dealId));
        
        let modificationsMade = false;

        // Pārbaudam vai ir IG pozīcijas, kuru nav lokāli
        for (const p of igPositions) {
            const igPos = {
                dealId: p.position.dealId,
                epic: p.market.epic,
                direction: p.position.direction,
                dealSize: p.position.dealSize,
                currency: p.position.currency
            };
            if (!localDealIds.has(igPos.dealId)) {
                
                // Brīdinām tikai vienreiz par šo pozīciju starp sistēmas sesijām
                if (!ignoredIgPositions.has(igPos.dealId)) {
                    logMsg(`🚨 KONFLIKTS: IG atrasta pozīcija, kuras nav lokālajā uzraudzībā! DealId: ${igPos.dealId} (${igPos.epic}). Sūtu paziņojumu lietotājam...`);
                    
                    try {
                        const tgMsg = `⚠️ Brīdinājums: Nesakritība sistēmās!\n\nIG platformā eksistē aktīva pozīcija (Instruments: ${igPos.epic}, Virziens: ${igPos.direction}, DealID: ${igPos.dealId}), kuras nav mūsu lokālajā datubāzē.\n\nKo man darīt ar šo pozīciju?\nVariācijas: Aizvērt to vai Ignorēt to (nepieskarties).`;
                        const { execSync } = require('child_process');
                        execSync(`openclaw message send --target "telegram:395239117" --message "${tgMsg}"`);
                        
                        // Pievienojam ignora sarakstam
                        ignoredIgPositions.add(igPos.dealId);
                        fs.writeFileSync(ignoredFile, JSON.stringify([...ignoredIgPositions]));
                    } catch(tgErr) {
                        logMsg(`Neizdevās nosūtīt OpenClaw paziņojumu: ${tgErr.message}`);
                    }
                }
            }
        }
        
        // Pārbaudam vai ir lokālas pozīcijas, kuru vairs nav IG (izdzēstas manuāli IG pusē vai izsistas)
        for (const [key, tradeObj] of Object.entries(activeTrades)) {
            if (!igDealIds.has(tradeObj.dealId)) {
                logMsg(`🚨 KONFLIKTS: Lokāli ir pozīcija ${tradeObj.dealId} (${tradeObj.epic}), bet IG tā vairs neeksistē. Sūtu paziņojumu izdzēšanai...`);
                
                try {
                    const tgMsg = `ℹ️ Info: Sinhronizācija.\n\nPozīcija ${tradeObj.epic} (DealID: ${tradeObj.dealId}) vairs neeksistē IG kontā. Dzēšu to no lokālās atmiņas.`;
                    const { execSync } = require('child_process');
                    execSync(`openclaw message send --target "telegram:395239117" --message "${tgMsg}"`);
                } catch(tgErr) {
                    logMsg(`Neizdevās nosūtīt OpenClaw paziņojumu: ${tgErr.message}`);
                }
                
                delete activeTrades[key];
                modificationsMade = true;
            }
        }
        
        if (modificationsMade) {
            // Saglabājam masīva formātā, tā kā trading_engine.js parasti sagaida datus masīvā
            const arr = Object.values(activeTrades);
            fs.writeFileSync(activeTradesPath, JSON.stringify(arr, null, 2));
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

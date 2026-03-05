require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { createMarketOrder } = require('./ig_rest_api');

// Konfigurācija 5 pāriem
const assets = [
    { epic: 'CS.D.EURUSD.CFD.IP', dir: 'BUY', size: 1, type: 'forex' },
    { epic: 'CS.D.GBPUSD.CFD.IP', dir: 'SELL', size: 1, type: 'forex' },
    { epic: 'CS.D.CFDGOLD.CFDGC.IP', dir: 'BUY', size: 1, type: 'gold' },
    { epic: 'CS.D.EURGBP.CFD.IP', dir: 'SELL', size: 1, type: 'forex' },
    { epic: 'IX.D.DOW.DAILY.IP', dir: 'BUY', size: 1, type: 'index' }
];

async function run() {
    console.log("🔐 Autentificējos IG...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const authData = {
        cst: loginRes.headers['cst'],
        secToken: loginRes.headers['x-security-token']
    };
    
    console.log("🚀 Atveru 5 pozīcijas izmantojot Market orderus...");
    const dealRefs = [];
    
    for (const a of assets) {
        try {
            console.log(`➡️ Atveru ${a.epic} | Virziens: ${a.dir}`);
            const res = await createMarketOrder(authData, a.epic, a.dir, a.size);
            console.log(`   ✅ DealReference: ${res.dealReference}`);
            dealRefs.push(res.dealReference);
        } catch(e) {
            console.log(`   ❌ Kļūda:`, e.response?.data?.errorCode || e.message);
        }
    }
    
    console.log("⏳ Gaidu 3 sekundes, lai orderi izpildās un parādās positions...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("📡 Iegūstu atvērtās pozīcijas no IG, lai fiksētu openLevel un aprēķinātu lokālos TP/SL...");
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { 
        headers: { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '1' 
        } 
    });
    
    let activeTrades = {};
    if (fs.existsSync('active_trades.json')) {
        try { activeTrades = JSON.parse(fs.readFileSync('active_trades.json')); } catch(e){}
    }
    
    const positions = posRes.data.positions;
    for (const p of positions) {
        const epic = p.market.epic;
        const dir = p.position.direction;
        const openPrice = p.position.openLevel;
        const dealId = p.position.dealId;
        
        // Atrodam mūsu cfg
        const cfg = assets.find(a => a.epic === epic);
        if(!cfg) continue;

        let pipMulti = 1;
        let tp1d, tp2d, tp3d, sld;
        
        if (cfg.type === 'forex') {
            pipMulti = 0.0001; // 1 pip
            tp1d = 20 * pipMulti; tp2d = 40 * pipMulti; tp3d = 80 * pipMulti; sld = 30 * pipMulti;
        } else if (cfg.type === 'gold') {
            pipMulti = 1; // 1 pts
            tp1d = 3 * pipMulti; tp2d = 6 * pipMulti; tp3d = 12 * pipMulti; sld = 5 * pipMulti;
        } else if (cfg.type === 'index') {
            pipMulti = 1; // 1 pts
            tp1d = 30 * pipMulti; tp2d = 60 * pipMulti; tp3d = 120 * pipMulti; sld = 40 * pipMulti;
        }

        let tp1, tp2, tp3, sl;
        if(dir === 'BUY') {
            tp1 = openPrice + tp1d; tp2 = openPrice + tp2d; tp3 = openPrice + tp3d; sl = openPrice - sld;
        } else {
            tp1 = openPrice - tp1d; tp2 = openPrice - tp2d; tp3 = openPrice - tp3d; sl = openPrice + sld;
        }
        
        // Formatēsim cenas (forex = 5 cipari asimilācijai, gold = 2)
        const roundTo = (num, type) => type === 'forex' ? parseFloat(num.toFixed(5)) : parseFloat(num.toFixed(2));
        
        activeTrades[`${epic}_REAL`] = {
            dealId: dealId,
            dealType: 'MARKET',
            direction: dir,
            openLevel: openPrice,
            tp1: roundTo(tp1, cfg.type),
            tp2: roundTo(tp2, cfg.type),
            tp3: roundTo(tp3, cfg.type),
            sl: roundTo(sl, cfg.type),
            status: 'PHASE_1',
            fallbackDistance: roundTo(Math.abs(tp2 - tp1) * 0.10, cfg.type)
        };
        console.log(`   ➡️ Fiksēts ${epic} @ ${openPrice} -> TP1: ${roundTo(tp1, cfg.type)} | SL: ${roundTo(sl, cfg.type)}`);
    }
    
    fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
    console.log("✅ Ieraksti saglabāti lokālajā TP/SL sistēmā (active_trades.json)");
}

run();

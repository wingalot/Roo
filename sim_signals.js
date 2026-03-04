require('dotenv').config();
const fs = require('fs');
const { createMarketOrder, createLimitOrder } = require('./ig_rest_api');
const axios = require('axios');

async function login() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });
    return {
        cst: loginRes.headers['cst'],
        secToken: loginRes.headers['x-security-token']
    };
}

async function sim() {
    console.log("🚀 Sāku 10 signālu simulāciju...");
    const authData = await login();
    let localMemory = {};
    if (fs.existsSync('active_trades.json')) {
        localMemory = JSON.parse(fs.readFileSync('active_trades.json'));
    }

    const epicMap = {
        'EUR/USD': 'CS.D.EURUSD.CFD.IP',
        'GBP/USD': 'CS.D.GBPUSD.CFD.IP',
        'GOLD': 'CS.D.CFDGOLD.CFDGC.IP',
        'US30': 'IX.D.DOW.DAILY.IP',
        'BTC': 'CS.D.BITCOIN.CFD.IP'
    };

    const signals = [
        // Market orderi
        { epic: epicMap['EUR/USD'], type: 'MARKET', dir: 'BUY', size: 0.5, tp1: 1.1000, tp2: 1.1050, tp3: 1.1100, sl: 1.0800 },
        { epic: epicMap['GBP/USD'], type: 'MARKET', dir: 'SELL', size: 0.5, tp1: 1.2500, tp2: 1.2450, tp3: 1.2400, sl: 1.2700 },
        { epic: epicMap['GOLD'], type: 'MARKET', dir: 'BUY', size: 0.5, tp1: 2050.0, tp2: 2060.0, tp3: 2075.0, sl: 2020.0 },
        { epic: epicMap['US30'], type: 'MARKET', dir: 'SELL', size: 1.0, tp1: 38500, tp2: 38300, tp3: 38000, sl: 39000 },
        { epic: epicMap['BTC'], type: 'MARKET', dir: 'BUY', size: 0.1, tp1: 65000, tp2: 67000, tp3: 70000, sl: 58000 },
        { epic: epicMap['EUR/USD'], type: 'MARKET', dir: 'SELL', size: 0.5, tp1: 1.0700, tp2: 1.0650, tp3: 1.0600, sl: 1.0900 },
        { epic: epicMap['GBP/USD'], type: 'MARKET', dir: 'BUY', size: 0.5, tp1: 1.2800, tp2: 1.2850, tp3: 1.2900, sl: 1.2500 },
        { epic: epicMap['GOLD'], type: 'MARKET', dir: 'SELL', size: 0.5, tp1: 2010.0, tp2: 2000.0, tp3: 1980.0, sl: 2040.0 },
        // Limit orderi
        { epic: epicMap['EUR/USD'], type: 'LIMIT', dir: 'BUY', size: 0.5, level: 1.0500, tp1: 1.0600, tp2: 1.0650, tp3: 1.0700, sl: 1.0400 },
        { epic: epicMap['GOLD'], type: 'LIMIT', dir: 'SELL', size: 0.5, level: 2100.0, tp1: 2080.0, tp2: 2070.0, tp3: 2050.0, sl: 2120.0 }
    ];

    for (let i = 0; i < signals.length; i++) {
        const sig = signals[i];
        try {
            console.log(`📡 Atveru Signālu #${i+1}: ${sig.type} ${sig.dir} ${Object.keys(epicMap).find(k=>epicMap[k]===sig.epic)}...`);
            let dealRef;
            if (sig.type === 'MARKET') {
                const res = await createMarketOrder(authData, sig.epic, sig.dir, sig.size);
                dealRef = res.dealReference;
            } else {
                const res = await createLimitOrder(authData, sig.epic, sig.dir, sig.size, sig.level);
                dealRef = res.dealReference;
            }

            localMemory[`${sig.epic}_SIM_${i}`] = {
                dealId: dealRef,
                direction: sig.dir,
                tp1: sig.tp1,
                tp2: sig.tp2,
                tp3: sig.tp3,
                sl: sig.sl,
                status: sig.type === 'LIMIT' ? 'PENDING' : 'PHASE_1',
                fallbackDistance: Math.abs(sig.tp2 - sig.tp1) * 0.10,
                dealType: sig.type // Atceramies vai tas ir LIMIT / MARKET
            };
            console.log(`✅ Piešķirts lokālais DealRef: ${dealRef}`);
        } catch (e) {
            console.log(`❌ Neizdevās atvērt #${i+1}`, e.response?.data?.errorCode || e.message);
        }
    }

    fs.writeFileSync('active_trades.json', JSON.stringify(localMemory, null, 2));
    console.log("💾 10 Signālu lokālā atmiņa saglabāta un sinhronizēta ar IG Demo.");
}

sim();

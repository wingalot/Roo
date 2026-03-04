require('dotenv').config();
const axios = require('axios');
const ls = require('lightstreamer-client-node');

const IG_API_URL = process.env.IG_API_URL;
const IG_API_KEY = process.env.IG_API_KEY;

// Lokālo pozīciju atmiņa
// Saglabāsim informāciju: { epic, direction, openLevel, tp1, tp2, tp3, status, fallbackDistance, dealId }
let activeTrades = {}; 
let lsClient = null;

// Sistēmas autentifikācija
async function login() {
    console.log("🔒 Autentificējos IG platformā...");
    const res = await axios.post(`${IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': IG_API_KEY, 'Version': '2' }
    });
    return {
        cst: res.headers['cst'],
        secToken: res.headers['x-security-token'],
        accountId: res.data.currentAccountId,
        lsEndpoint: res.data.lightstreamerEndpoint
    };
}

// 2% rilska pozīcijas izmērs (skelets)
async function getPositionSize(cst, secToken) {
    const res = await axios.get(`${IG_API_URL}/accounts`, {
        headers: { 'X-IG-API-KEY': IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1' }
    });
    const balance = res.data.accounts[0].balance.balance;
    const riskAmount = balance * 0.02; // 2% no konta
    console.log(`💰 Riska definīcija: Konta atlikums ${balance}, 2% risks = ${riskAmount}`);
    return riskAmount;
}

// Lightstreamer (Websocket) savienojums cenu saņemšanai
function connectLiveStream(authData) {
    lsClient = new ls.LightstreamerClient(authData.lsEndpoint);
    lsClient.connectionDetails.setUser(authData.accountId);
    lsClient.connectionDetails.setPassword(`CST-${authData.cst}|XST-${authData.secToken}`);
    
    lsClient.addListener({
        onStatusChange: (status) => console.log(`📡 Stream Status: ${status}`)
    });
    lsClient.connect();
}

// Simulēta signāla pievienošana mūsu lokālajai uzraudzībai
function startMonitoringLocalTrade(epic, dealId, direction, tp1, tp2, tp3) {
    activeTrades[epic] = {
        dealId, direction, tp1, tp2, tp3,
        status: 'PHASE_1', // Fāze 1 gaida TP2
        fallbackDistance: Math.abs(tp2 - tp1) * 0.10 // 10% no distances
    };
    console.log(`\n👁️ Sāku uzraudzību: ${epic} | Virziens: ${direction} | TP2: ${tp2} | Fallback Buffer: ${activeTrades[epic].fallbackDistance}`);

    // Abonējam instrumenta pirkšanas/pārdošanas cenas (OFR = Ask, BID = Bid)
    const subscription = new ls.Subscription("MERGE", [`MARKET:${epic}`], ["BID", "OFR"]);
    subscription.setDataAdapter("QUOTE_ADAPTER");
    
    subscription.addListener({
        onItemUpdate: (update) => {
            const bid = parseFloat(update.getValue("BID"));
            const ofr = parseFloat(update.getValue("OFR"));
            if (bid && ofr) {
                // Lai būtu droši, novērtējam ar vidējo cenu vai Ask/Bid atkarībā no virziena
                const currentPrice = direction === 'BUY' ? bid : ofr; 
                evaluateTradeLogic(epic, currentPrice);
            }
        }
    });

    lsClient.subscribe(subscription);
}

// BŪTISKĀKĀ DAĻA: Lokālā TP/SL Loģika
function evaluateTradeLogic(epic, currentPrice) {
    const trade = activeTrades[epic];
    if (!trade) return;

    if (trade.status === 'PHASE_1') {
        // Mērķis: Sasniegt TP2
        if (trade.direction === 'BUY' && currentPrice >= trade.tp2) {
            console.log(`🔥 [${epic}] TP2 SASNIEGTS (${currentPrice})! Pārslēdzu lokālo SL uz TP1 (${trade.tp1}).`);
            trade.status = 'PHASE_2';
        } 
        else if (trade.direction === 'SELL' && currentPrice <= trade.tp2) {
            console.log(`🔥 [${epic}] TP2 SASNIEGTS (${currentPrice})! Pārslēdzu lokālo SL uz TP1 (${trade.tp1}).`);
            trade.status = 'PHASE_2';
        }
    } 
    else if (trade.status === 'PHASE_2') {
        // Mērķis: Gaidām TP3 vai 10% drop no TP2
        if (trade.direction === 'BUY') {
            if (currentPrice >= trade.tp3) {
                closePosition(epic, trade.dealId, 'TP3 SASNIEGTS - Peļņa nofiksēta');
            } else if (currentPrice <= (trade.tp2 - trade.fallbackDistance)) {
                closePosition(epic, trade.dealId, '10% KRITUMS ZEM TP2 - Lokālais SL izsists');
            }
        } 
        else if (trade.direction === 'SELL') {
            if (currentPrice <= trade.tp3) {
                closePosition(epic, trade.dealId, 'TP3 SASNIEGTS - Peļņa nofiksēta');
            } else if (currentPrice >= (trade.tp2 + trade.fallbackDistance)) {
                closePosition(epic, trade.dealId, '10% KĀPUMS VIRS TP2 - Lokālais SL izsists');
            }
        }
    }
}

function closePosition(epic, dealId, reason) {
    console.log(`\n🛑 AIZVERU POZĪCIJU [${epic}] -> ${reason}`);
    // Te pievienosim axios.delete(`/positions/otc`) API zvanu uz IG
    delete activeTrades[epic];
}

async function boot() {
    const authData = await login();
    await getPositionSize(authData.cst, authData.secToken);
    connectLiveStream(authData);

    const fs = require('fs');
    if (fs.existsSync('active_trades.json')) {
        const history = JSON.parse(fs.readFileSync('active_trades.json'));
        // Pielādē no atmiņas esošos zelta mērķus
        if (history['CS.D.CFDGOLD.CFDGC.IP']) {
            const tr = history['CS.D.CFDGOLD.CFDGC.IP'];
            startMonitoringLocalTrade('CS.D.CFDGOLD.CFDGC.IP', tr.dealId, tr.direction, tr.tp1, tr.tp2, tr.tp3);
            activeTrades['CS.D.CFDGOLD.CFDGC.IP'].sl = tr.sl; // SL pielāgojums Pamatuzraudzībai 
        }
    }
}

boot();
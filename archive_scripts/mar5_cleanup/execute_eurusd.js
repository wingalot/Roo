require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

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

async function runRealSignal() {
    try {
        const authData = await login();
        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        const epic = 'CS.D.EURUSD.CFD.IP';
        const direction = 'BUY';
        const size = 1.0; 

        const reqBody = {
            epic: epic,
            expiry: 'DFB',
            direction: direction,
            size: size,
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'USD'
        };

        console.log("🚀 Sūtu EURUSD BUY MARKET uz IG...");
        const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
        
        console.log("✅ IEKŠĀ! Veiksmīgi atvērts EURUSD, Deal Reference:", res.data.dealReference);
        
        console.log(`⏰ Gaidu 2 sekundes un pārbaudu ordera konfirmāciju...`);
        await new Promise(r => setTimeout(r, 2000));
        
        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '1' 
        };
        const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${res.data.dealReference}`, { headers: h1 });
        const dealId = confRes.data.dealId;
        const level = confRes.data.level;
        
        console.log(`📌 Konfirmēts! DealId: ${dealId}, Level: ${level}`);

        // Aprēķinām pips. EURUSD parasti ir 5 decimals.
        // 1 pip is counted as 0.00010.
        // In IG format (which multiplies levels usually):
        // 11636.8 IG level represents ~1.16368 or similar scaling (often 10,000 multiplier).
        // 1 Pip = 10 units on the 11636.8 scale.
        const pipVal = 10;
        const entry = parseFloat(level);
        const slLevel = entry - (15 * pipVal);
        
        // Pieliekam TP levels pēc Felix standarta (+20, +40, +80 pips)
        const tp1Level = entry + (20 * pipVal);
        const tp2Level = entry + (40 * pipVal);
        const tp3Level = entry + (80 * pipVal);

        console.log(`\n📋 Mērķi:
        ENTRY: ${entry}
        SL (-15p): ${slLevel}
        TP1 (+20p): ${tp1Level}
        TP2 (+40p): ${tp2Level}
        TP3 (+80p): ${tp3Level}`);

        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
        }

        activeTrades[epic] = {
            dealId: dealId,
            direction: direction,
            openLevel: entry,   
            size: size,         
            tp1: tp1Level,
            tp2: tp2Level,
            tp3: tp3Level,
            sl: slLevel,
            status: 'PHASE_1',
            entryTimestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log(`\n💾 Lokālā Treida Atmiņa saglabāta un Mission Control to tagad uztvers!`);

    } catch (err) { 
        console.error("Kļūda izpildot signālu:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

runRealSignal();

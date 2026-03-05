require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function login() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: {
            'X-IG-API-KEY': process.env.IG_API_KEY,
            'Version': '2',
            'Content-Type': 'application/json'
        }
    });
    return {
        cst: loginRes.headers['cst'],
        secToken: loginRes.headers['x-security-token']
    };
}

async function runRealSignal() {
    try {
        console.log("🚀 Lūdzu IG API tokenus...");
        const authData = await login();

        const headers = {
            'X-IG-API-KEY': process.env.IG_API_KEY,
            'CST': authData.cst,
            'X-SECURITY-TOKEN': authData.secToken,
            'Version': '2',
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept': 'application/json; charset=UTF-8'
        };

        const epic = 'CS.D.CFDGOLD.CFDGC.IP';
        const direction = 'SELL'; 
        const size = 1;

        console.log(`🚀 Sūtu ${epic} ${direction} MARKET uz IG...`);

        const reqBody = {
            epic: epic,
            expiry: '-',
            direction: direction,
            size: size,
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'USD'
        };

        const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers });
        console.log("✅ API Deal Reference:", res.data.dealReference);
        
        await new Promise(r => setTimeout(r, 2000));
        
        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '1' 
        };
        const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${res.data.dealReference}`, { headers: h1 });
        const conf = confRes.data;
        
        if(conf.dealStatus === 'ACCEPTED') {
            const entry = parseFloat(conf.level);
            console.log(`✅ ACCEPTED!! EntryLevel: ${entry} DealId: ${conf.dealId}`);

            // Signāla jēldati no Telegram:
            // SELL XAUUSD 5144.0. TP1: 5142.5. TP2: 5141.0. TP3: 5132.0. SL: 5156.0
            
            // Reālajā Demo Gold cena ir savādāka (~2888). 
            // Tāpēc TP/SL pielāgosim punktu izteiksmē (1.5 punkti TP1, 3 punkti TP2 utt.), 
            // atņemot no TAVAS atvēršanas cenas, nevis signāla pliks cipars (kurš bija 5144.0)!
            
            // XAUUSD SELL: SL = entry + 12 (1200 pips of 5156-5144), TP1 = entry - 1.5, TP2 = entry - 3, TP3 = entry - 12
            const tp1Level = entry - 1.5;
            const tp2Level = entry - 3.0;
            const tp3Level = entry - 12.0;
            const slLevel = entry + 12.0;

            let activeTrades = {};
            if (fs.existsSync('active_trades.json')) activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));

            activeTrades[epic] = {
                dealId: conf.dealId,
                direction: direction,
                openLevel: entry,
                size: size,
                tp1: tp1Level,
                tp2: tp2Level,
                tp3: tp3Level,
                sl: slLevel,
                status: 'PHASE_1',
                telegramMsgId: 8447, // Piesaistam log_id (telegram id no pēdējā XAUUSD), lai "SL hit" reply varētu mainīt ja šis būtu strādājis.
                entryTimestamp: new Date().toISOString()
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log(`\n💾 Lokālā TP/SL datubāze atjaunināta! Zelta mērķi ielādēti Phase 1 dzinējā:\nEntry: ${entry}\nSL: ${slLevel}\nTP1: ${tp1Level}\nTP2: ${tp2Level}\nTP3: ${tp3Level}`);
        } else {
             console.log("Noraidīts:", JSON.stringify(conf, null, 2));
        }

    } catch (err) {
        console.error("Kļūda:", err.response ? err.response.data : err.message);
    }
}

runRealSignal();

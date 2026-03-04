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
        // EURUSD base currency is USD, CFD currency might be 'USD' or 'EUR'.
        // "REJECT_SPREADBET_ORDER_ON_CFD_ACCOUNT" comes up when currency is USD but account currency doesn't allow standard CFDs in that format, 
        // OR the API endpoint for V2 requires size, but if size makes it spreadbet, maybe we are missing something in standard headers?
        // Let's use currencyCode = 'USD'
        // Let's use size 0.1? CFD min size is 0.5. Let's use 1.0.

        console.log("🚀 Sūtu EURUSD BUY MARKET uz IG ...");
        
        const reqBody = {
            epic: epic,
            expiry: '-', // Let's try expiry '-' instead of 'DFB' for CFD? The info says expiry: "-"
            direction: 'BUY',
            size: 0.5,
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'USD'
        };

        const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
        console.log("✅ Deal Reference:", res.data.dealReference);
        
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
            console.log("✅ ACCEPTED!! EntryLevel:", conf.level, "DealId:", conf.dealId);
            const dealId = conf.dealId;
            const entry = parseFloat(conf.level);
            
            const pipVal = 10;
            const slLevel = entry - (15 * pipVal);
            const tp1Level = entry + (20 * pipVal);
            const tp2Level = entry + (40 * pipVal);
            const tp3Level = entry + (80 * pipVal);

            let activeTrades = {};
            if (fs.existsSync('active_trades.json')) activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));

            activeTrades[epic] = {
                dealId: dealId,
                direction: 'BUY',
                openLevel: entry,   
                size: 0.5,         
                tp1: tp1Level,
                tp2: tp2Level,
                tp3: tp3Level,
                sl: slLevel,
                status: 'PHASE_1',
                entryTimestamp: new Date().toISOString()
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log(`\n💾 Saglabāts Mērķis: \nEntry: ${entry}\nSL (-15p): ${slLevel}\nTP1: ${tp1Level}\nTP2: ${tp2Level}`);
            
        } else {
             console.log("Noraidīts:", JSON.stringify(conf, null, 2));
        }

    } catch (err) { 
        console.error("Kļūda:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

runRealSignal();

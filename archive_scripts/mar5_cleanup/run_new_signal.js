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
        
        // CFD minimum order size for EURUSD looks like 10 (or 1 lot of standard). 
        // We saw "lotSize": 10 in the instrument spec. 
        // Let's try size 10 
        const testSize = 1; // Wait, wait. 0.5 was MINIMUM_ORDER_SIZE_ERROR. 10 might work. Let's test 10 for EURUSD or EUR is EUR CFD. 
        // Or 1 "Contract"? The info said: unit: CONTRACTS, and lotSize: 10. Let's try size: 1
        
        console.log("🚀 Sūtu EURUSD BUY MARKET uz IG ...");
        
        const reqBody = {
            epic: epic,
            expiry: '-', // Let's try expiry '-' instead of 'DFB' for CFD? The info says expiry: "-"
            direction: 'BUY',
            size: 1, // trying size 1 based on unit: CONTRACTS
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'USD'
        };

        let res;
        try{
            res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
        } catch(e) {
            console.log("Kļūda:", e.response ? JSON.stringify(e.response.data) : e.message); 
            // Try with EUR?
            if(e.response && e.response.data.errorCode === 'REJECT_SPREADBET_ORDER_ON_CFD_ACCOUNT'){
               // That usually happens if currencyCode is wrong.  Let's try 'EUR'.
                reqBody.currencyCode = 'EUR';
                res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
            }
        }
        
        if(!res) return;
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
            
            // EURUSD scalings usually mean: 1.1636 -> IG: 11636 
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
                size: 1,         
                tp1: tp1Level,
                tp2: tp2Level,
                tp3: tp3Level,
                sl: slLevel,
                status: 'PHASE_1',
                entryTimestamp: new Date().toISOString()
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log(`\n💾 Saglabāts Mērķis: \nEntry: ${entry}\nSL (-15p): ${slLevel}\nTP1: ${tp1Level}\nTP2: ${tp2Level}`);
            
            // Also save to mission control signals
            let signals = [];
            if (fs.existsSync('latest_signals.json')) {
               signals = JSON.parse(fs.readFileSync('latest_signals.json', 'utf8'));
            }
            signals.unshift({
               time: new Date().toLocaleTimeString('en-US', { timeZone: 'Europe/Riga', hour12: false }) + " GMT+2",
               text: "EURUSD BUY NOW 1.16367\nSet SL 15 Pips",
               isNew: true
            });
            if(signals.length > 10) signals = signals.slice(0, 10);
            fs.writeFileSync('latest_signals.json', JSON.stringify(signals, null, 2));
            console.log("Mission Control log atjaunināts!");
            
        } else {
             console.log("Noraidīts:", JSON.stringify(conf, null, 2));
        }

    } catch (err) { 
        console.error("Kļūda:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

runRealSignal();

const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function runGBPJPY() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const authData = {
            cst: loginRes.headers['cst'],
            secToken: loginRes.headers['x-security-token']
        };

        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        const epic = 'CS.D.GBPJPY.CFD.IP';
        console.log("🚀 Sūtu GBPJPY BUY MARKET uz IG ...");
        
        let reqBody = {
            epic: epic,
            expiry: '-',
            direction: 'BUY',
            size: 1, 
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'EUR' // Mēģinām ar bāzes valūtu EUR
        };

        let res;
        try{
            res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
        } catch(e) {
            console.log("⛔ Kļūda:", e.response ? JSON.stringify(e.response.data) : e.message);
            return;
        }
        
        if(!res) return;
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
            const pipFactor = 0.01;
            const entryLevel = parseFloat(conf.level);
            console.log("✅ ACCEPTED!! EntryLevel:", entryLevel, "DealId:", conf.dealId);
            
            // Reāls aprēķins izmatojot pip faktoru no Entry price
            // Signal: SL 209.28 (29 pips zem), TP1 209.61 (4 pips klāt), TP2 209.70 (13 pips)
            const pipDisSL = 0.29; 
            const slLevel = entryLevel - pipDisSL;
            const tp1Level = entryLevel + 0.04;
            const tp2Level = entryLevel + 0.13;

            let activeTrades = {};
            if (fs.existsSync('active_trades.json')) Object.assign(activeTrades, JSON.parse(fs.readFileSync('active_trades.json', 'utf8')));

            activeTrades[epic] = {
                dealId: conf.dealId,
                direction: 'BUY',
                openLevel: entryLevel,   
                size: 1,         
                tp1: parseFloat(tp1Level.toFixed(3)),
                tp2: parseFloat(tp2Level.toFixed(3)),
                tp3: parseFloat(tp2Level.toFixed(3)),
                sl: parseFloat(slLevel.toFixed(3)),
                status: 'PHASE_1',
                entryTimestamp: new Date().toISOString(),
                telegramMsgId: 8454
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log(`\n💾 Saglabāts \nEntry: ${entryLevel}\nSL: ${slLevel}\nTP1: ${tp1Level}\nTP2: ${tp2Level}`);
        } else {
            console.log("⛔ Noraidīts:", JSON.stringify(conf, null, 2));
        }

    } catch (err) { 
        console.error("Kļūda:", err.message); 
    }
}
runGBPJPY();

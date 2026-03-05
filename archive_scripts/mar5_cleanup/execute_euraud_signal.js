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

async function runEuroAudMarket() {
    try {
        const authData = await login();
        console.log("🚀 Sūtu EURAUD BUY MARKET uz IG ...");

        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        const reqBody = {
            epic: 'CS.D.EURAUD.CFD.IP', 
            expiry: '-',
            direction: 'BUY',
            size: 1, 
            orderType: 'MARKET',
            timeInForce: "EXECUTE_AND_ELIMINATE",
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'USD' 
        };

        let res;
        try {
           res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
        } catch(e) {
           if(e.response) {
               console.log("Kļūda ar USD valūtu:", e.response.data.errorCode);
               console.log("Mēģinu ar AUD currencyCode...");
               reqBody.currencyCode = 'AUD';
               res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
           } else {
               throw e;
           }
        }
        
        console.log("Deal Reference:", res.data.dealReference);
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
            const dealId = conf.dealId;
            const entry = parseFloat(conf.level);
            console.log("✅ ACCEPTED!! EntryLevel:", entry, "DealId:", dealId);

            const slLevel = 1.64255;
            const tp1Level = 1.64755;
            const tp2Level = 1.65200;
            const tp3Level = 1.65800;

            let activeTrades = {};
            if (fs.existsSync('active_trades.json')) activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));

            activeTrades['CS.D.EURAUD.CFD.IP'] = {
                dealId: conf.dealId,
                direction: 'BUY',
                openLevel: entry,   
                size: 1,         
                tp1: tp1Level,
                tp2: tp2Level,
                tp3: tp3Level,
                sl: slLevel,
                status: 'PHASE_1',
                entryTimestamp: new Date().toISOString(),
                telegramMsgId: 8450
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log(`\n💾 Saglabāti Mērķi aktīvajos treidos!`);
        } else {
             console.log("⛔ Noraidīts:", conf.reason || JSON.stringify(conf));
        }

    } catch (err) { 
        console.error("⛔ Kļūda:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

runEuroAudMarket();
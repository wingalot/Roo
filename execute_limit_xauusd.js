require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function runSellLimitXAUUSD() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
        
        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        let reqBody = {
            epic: 'CS.D.CFDGOLD.CFDGC.IP', 
            expiry: '-',
            direction: 'SELL',
            size: 1, 
            type: 'LIMIT', // FIX for /workingorders/otc request which needs type instead of orderType
            level: 5155.75, 
            timeInForce: "GOOD_TILL_CANCELLED",
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'USD' 
        };

        const res = await axios.post(`${process.env.IG_API_URL}/workingorders/otc`, reqBody, { headers: headers2 });
        await new Promise(r => setTimeout(r, 2000));
        
        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '1' 
        };
        const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${res.data.dealReference}`, { headers: h1 });
        const conf = confRes.data;
        
        if(conf.dealStatus === 'ACCEPTED') {
            const slLevel = 5166.10;
            const tp1Level = 5153;
            const tp2Level = 5120;
            const tp3Level = 5120;

            let activeTrades = {};
            if (fs.existsSync('active_trades.json')) activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));

            activeTrades['CS.D.CFDGOLD.CFDGC.IP_LIMIT'] = {
                dealId: conf.dealId,
                direction: 'SELL',
                openLevel: parseFloat(conf.level),   
                size: 1,         
                tp1: tp1Level,
                tp2: tp2Level,
                tp3: tp3Level,
                sl: slLevel,
                status: 'PENDING',
                entryTimestamp: new Date().toISOString(),
                telegramMsgId: 8451
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log(`✅ XAUUSD Limit PENDING Order atvērts un failos iezīmēts!`);
        } else {
             console.log("⛔ Noraidīts:", JSON.stringify(conf, null, 2));
        }

    } catch (err) { 
        console.error("⛔ Kļūda:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}
runSellLimitXAUUSD();
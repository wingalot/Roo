const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function exec() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const authData = {
            cst: loginRes.headers['cst'],
            secToken: loginRes.headers['x-security-token']
        };

        const headersDelete = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '1', // V1 priekš _method = DELETE otc body
            'Content-Type': 'application/json',
            '_method': 'DELETE'
        };

        const dealId = 'DIAAAAWSLTMYABD';
        console.log(`❌ Mēģinu aizvērt eksistējošo pozīciju: ${dealId}`);
        try {
            const delRes = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: dealId,
                direction: 'SELL',
                size: 1,
                orderType: 'MARKET'
            }, { headers: headersDelete });
            console.log("✅ Pozīcija Aizvērta. DealReference:", delRes.data.dealReference);
        } catch(e) { console.log('Kļūda dzēšot', e.response ? e.response.data : e.message) }
        
        await new Promise(r => setTimeout(r, 2000));

        const headersCreate = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        console.log("🚀 Veru vaļā jaunu GBPJPY BUY pozīciju...");
        let reqBody = {
            epic: 'CS.D.GBPJPY.CFD.IP',
            expiry: '-',
            direction: 'BUY',
            size: 1, 
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'JPY'
        };

        const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headersCreate });
        console.log("✅ ACCEPTED!! Jauns DealReference:", res.data.dealReference);
        
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
            console.log("📝 Saglabājam active_trades.json -> Entry:", conf.level);
            
            // Reāls aprēķins izmatojot pip faktoru no Entry price. GBPJPY pips = 0.01.
            const entryLevel = parseFloat(conf.level);
            const slLevel = entryLevel - 0.29;
            const tp1Level = entryLevel + 0.04;
            const tp2Level = entryLevel + 0.13;

            let activeTrades = {};
            if (fs.existsSync('active_trades.json')) activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));

            activeTrades['CS.D.GBPJPY.CFD.IP'] = {
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
                telegramMsgId: 8888 // demo ID
            };
            fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
            console.log("✅ Sistēmas atmiņa atjaunota un reģistrēta sekošanai!");
            
        } else {
            console.log("Noraidījums Confirms:", conf);
        }

    } catch (err) { 
        console.error("Kļūda:", err.message); 
    }
}
exec();

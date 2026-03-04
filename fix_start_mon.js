require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function login() {
    const lg = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    return {
        cst: lg.headers['cst'],
        secToken: lg.headers['x-security-token']
    };
}

async function startLocalMonitorHack() {
    console.log("🔥 Uzbrūkam cenām lokāli (Test SL/TP)...");
    const auth = await login();
    
    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': auth.cst, 
        'X-SECURITY-TOKEN': auth.secToken, 
        'Version': '1' 
    };

    let activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
    
    for(let i=0; i<3; i++) {
        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
        const openPositions = posRes.data.positions;
        
        for (const epic in activeTrades) {
            const trade = activeTrades[epic];
            const igPos = openPositions.find(p => p.position.dealId === trade.dealId);
            
            if(!igPos) continue;
    
            const currentPrice = trade.direction === 'BUY' ? parseFloat(igPos.market.bid) : parseFloat(igPos.market.offer);
            console.log(`[${epic}] Cena atjaunota: ${currentPrice} | SL: ${trade.sl} / TP3: ${trade.tp3}`);
            
            if (trade.direction === 'BUY') {
                if(currentPrice <= trade.sl) {
                    console.log(`🛑 [SL Izsists] Cena ${currentPrice} ir <= ${trade.sl}. Slēdzam!`);
                    await forceClose(epic, trade, auth.cst, auth.secToken);
                } else if (currentPrice >= trade.tp3 || currentPrice >= trade.tp1) {
                     console.log(`✅ [TP Izsists] Cena ${currentPrice} sasniegusi mērķus. Slēdzam ciet!`);
                     await forceClose(epic, trade, auth.cst, auth.secToken);
                }
            }
        }
        await new Promise(r => setTimeout(r, 2000));
    }
}

async function forceClose(epic, trade, cst, secToken) {
    const h_del = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': cst, 
        'X-SECURITY-TOKEN': secToken, 
        'Version': '1', 
        '_method': 'DELETE' 
    };
    try {
        const reqBody = {
             dealId: trade.dealId,
             direction: trade.direction === 'BUY' ? 'SELL' : 'BUY',
             size: trade.size,
             orderType: 'MARKET'
         };
         // We do not send epic or anything else that limits DELETE OTC to match dealId specifically
         const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: h_del });
         console.log(`SLĒGTS! Reference: ${res.data.dealReference}`);
         
         let activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
         delete activeTrades[epic];
         fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));

    } catch (e) {
         console.log("Kļūda slēdzot:", e.response ? JSON.stringify(e.response.data) : e.message);
    }
}

startLocalMonitorHack();

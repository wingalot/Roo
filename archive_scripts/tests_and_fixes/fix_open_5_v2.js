require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function run() {
    console.log("Sāku fiksēt...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const authData = { cst: loginRes.headers['cst'], secToken: loginRes.headers['x-security-token'] };
    
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { 
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': authData.cst, 'X-SECURITY-TOKEN': authData.secToken, 'Version': '1' } 
    });
    
    let activeTrades = {};
    if (fs.existsSync('active_trades.json')) {
        try { activeTrades = JSON.parse(fs.readFileSync('active_trades.json')); } catch(e){}
    }
    
    const cfgMap = {
        'CS.D.EURUSD.CFD.IP': 'forex',
        'CS.D.GBPUSD.CFD.IP': 'forex',
        'CS.D.CFDGOLD.CFDGC.IP': 'gold',
        'CS.D.EURGBP.CFD.IP': 'forex',
        'IX.D.DOW.DAILY.IP': 'index'
    };

    const positions = posRes.data.positions;
    for (const p of positions) {
        const epic = p.market.epic;
        const dir = p.position.direction;
        const openPrice = p.position.openLevel;
        const dealId = p.position.dealId;
        
        const type = cfgMap[epic];
        if(!type) continue; 

        let pipMulti = 1;
        let tp1d, tp2d, tp3d, sld;
        
        if (type === 'forex') {
            pipMulti = 0.0001; 
            tp1d = 20 * pipMulti; tp2d = 40 * pipMulti; tp3d = 80 * pipMulti; sld = 30 * pipMulti;
        } else if (type === 'gold') {
            pipMulti = 1; 
            tp1d = 3 * pipMulti; tp2d = 6 * pipMulti; tp3d = 12 * pipMulti; sld = 5 * pipMulti;
        } else if (type === 'index') {
            pipMulti = 1; 
            tp1d = 30; tp2d = 60; tp3d = 120; sld = 40;
        }

        let tp1, tp2, tp3, sl;
        if(dir === 'BUY') {
            tp1 = openPrice + tp1d; tp2 = openPrice + tp2d; tp3 = openPrice + tp3d; sl = openPrice - sld;
        } else {
            tp1 = openPrice - tp1d; tp2 = openPrice - tp2d; tp3 = openPrice - tp3d; sl = openPrice + sld;
        }
        
        const roundTo = (num, t) => t === 'forex' ? parseFloat(num.toFixed(5)) : parseFloat(num.toFixed(2));
        
        activeTrades[`${epic}_REAL`] = {
            dealId: dealId,
            dealType: 'MARKET',
            direction: dir,
            openLevel: openPrice,
            tp1: roundTo(tp1, type),
            tp2: roundTo(tp2, type),
            tp3: roundTo(tp3, type),
            sl: roundTo(sl, type),
            status: 'PHASE_1',
            fallbackDistance: roundTo(Math.abs(tp2 - tp1) * 0.10, type)
        };
        console.log(`➡️ Fiksēts ${epic} @ ${openPrice} -> TP1: ${roundTo(tp1, type)} | SL: ${roundTo(sl, type)}`);
    }
    
    fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
    console.log("✅ Ieraksti fiksēti!");
}
run();

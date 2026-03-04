require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function fix() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });

    const cst = loginRes.headers['cst'];
    const secToken = loginRes.headers['x-security-token'];
    
    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': cst, 
        'X-SECURITY-TOKEN': secToken, 
        'Version': '1' 
    };
    
    // Dabūnam reālo level un DealId (kas ir aktīvs no tikko atvērtas pozīcijas)
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
    const pos = posRes.data.positions.find(p => p.market.epic === 'CS.D.EURUSD.CFD.IP');
    
    if(pos) {
        const dealId = pos.position.dealId;
        const entry = parseFloat(pos.position.openLevel);
        const pipVal = 10;
        
        const slLevel = entry - (15 * pipVal);
        const tp1Level = entry + (20 * pipVal);
        const tp2Level = entry + (40 * pipVal);
        const tp3Level = entry + (80 * pipVal);

        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
        }

        activeTrades['CS.D.EURUSD.CFD.IP'] = {
            dealId: dealId,
            direction: 'BUY',
            openLevel: entry,   
            size: 1.0,         
            tp1: tp1Level,
            tp2: tp2Level,
            tp3: tp3Level,
            sl: slLevel,
            status: 'PHASE_1',
            entryTimestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log(`✅ Fiksēts Live Level: ${entry}. Pielāgots SL: ${slLevel}, TP1: ${tp1Level}, TP2: ${tp2Level}, TP3: ${tp3Level}.`);

    } else {
        console.log("Nav tādas pozīcijas atrastas.");
    }
}
fix();

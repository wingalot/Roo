require('dotenv').config();
const axios = require('axios');
const { closePositionAPI } = require('./ig_rest_api');

async function fixPositions() {
    console.log("🔐 Autentificējos...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });
    
    const authData = {
        cst: loginRes.headers['cst'],
        secToken: loginRes.headers['x-security-token']
    };

    const headers1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': authData.cst, 'X-SECURITY-TOKEN': authData.secToken, 'Version': '1' };
    
    console.log("📡 Pieprasu atvērtās pozīcijas...");
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: headers1 });
    
    const goldPositions = posRes.data.positions.filter(p => p.market.epic === 'CS.D.CFDGOLD.CFDGC.IP');
    
    console.log(`🔍 Atrastas ${goldPositions.length} zelta pozīcijas.`);

    if (goldPositions.length > 1) {
        // Atstājam pirmo (ar labāko/pirmo entry)
        const toKeep = goldPositions[0];
        console.log(`✅ ATSTĀJAM vaļā šo: DealId ${toKeep.position.dealId} at ${toKeep.position.openLevel}`);

        // Aizveram pārējās
        for (let i = 1; i < goldPositions.length; i++) {
            const p = goldPositions[i];
            console.log(`🛑 Slēdzu dublikātu: DealId ${p.position.dealId} at ${p.position.openLevel}`);
            await closePositionAPI(authData, p.position.dealId, p.market.epic, p.position.direction, p.position.dealSize);
        }
        
        // Saglabājam sistēmā šo vienu konkrēto!
        const fs = require('fs');
        const activeTrades = {
            [toKeep.market.epic]: {
                dealId: toKeep.position.dealId,
                direction: toKeep.position.direction,
                openLevel: toKeep.position.openLevel,
                tp1: 5160.3,
                tp2: 5161.8,
                tp3: 5170.8,
                sl: 5146.8,
                status: 'PHASE_1',
                fallbackDistance: Math.abs(5161.8 - 5160.3) * 0.10 // 10% no TP2 un TP1 distances
            }
        };
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log("💾 Sistēmā ierakstīts viens lokālais Zelta treids!");
    } else {
        console.log("Viss kārtībā, ir tikai 1 vai 0 zelta pozīcijas.");
    }
}
fixPositions();
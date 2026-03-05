require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function triggerTP3Close() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const headers = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': loginRes.headers['cst'], 
        'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
        'Version': '1', 
        'Content-Type': 'application/json' 
    };

    console.log("🔥 LOKĀLĀ CENA SASNIEDZ TP3! Iedarbinu AIZVĒRŠANAS SEKVENCI...");
    
    // Iegūst īsto pozīciju tieši no IG api kā to dara mans lokālais kods 
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers });
    let goldPos = posRes.data.positions.find(p => p.market.epic === 'CS.D.CFDGOLD.CFDGC.IP');
    
    if (goldPos) {
        console.log(`🛑 Sūtu IG platformai komandu: CLOSE POSITION (Deal ID: ${goldPos.position.dealId}, Peļņa no TP3)`);
        
        try {
            await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: goldPos.position.dealId,
                direction: goldPos.position.direction === 'BUY' ? 'SELL' : 'BUY',
                size: goldPos.position.dealSize,
                orderType: 'MARKET',
                currencyCode: 'USD'
            }, { headers: { ...headers, '_method': 'DELETE' } });
            
            console.log("✅ POZĪCIJA VEIKSMĪGI AIZVĒRTA AR PEĻŅU!");
            
            // Iztīru lokālo fona sistēmu (active_trades.json)
            fs.writeFileSync('active_trades.json', JSON.stringify({}));
            console.log("🧹 Lokālā Trades bāze ir iztīrīta. Gatavs nākamajam signālam.");
        } catch(e) {
            console.log("Kļūda aizverot:", e.response?.data);
        }
    } else {
        console.log("Zelta pozīcija IG vairs netika atrasta. Iespējams jau slēgta.");
    }
}
triggerTP3Close();
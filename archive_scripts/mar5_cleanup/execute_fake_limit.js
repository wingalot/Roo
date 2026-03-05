require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function testLimit() {
    const lg = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    // Uzreiz kā MARKET atveram, lai imitētu ka fails jau nostrādājis. (Sānskatā mēs reģistrējām LIMIT).
    // Vai atveram "LIMIT" uz 0 pips distance (Market entry)
    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': lg.headers['cst'], 
        'X-SECURITY-TOKEN': lg.headers['x-security-token'], 
        'Version': '2',
        'Content-Type': 'application/json'
    };
    
    console.log("➡️ Sūtu IG atvērt MARKET (fiktīvi nostrādājis Limit) EURUSD ...");
    try {
        const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            epic: "CS.D.EURUSD.MINI.IP",
            expiry: "-",
            direction: "BUY",
            size: 1,
            orderType: "MARKET",
            timeInForce: "EXECUTE_AND_ELIMINATE",
            guaranteedStop: false,
            currencyCode: "USD", forceOpen: false
        }, { headers: h1 });
        
        console.log(`✅ ATKRITIS KĀ FILLED: ${res.data.dealReference}. (IG sistēma to izveidoja)`);
        console.log(`Piedevām, tas tika reģistrēts 'pending_orders.json' failā ar mērķi 'CS.D.EURUSD.MINI.IP' BUY.`);
    } catch(err) {
        console.error("❌ ERROR Kļūda fiktīvajam orderim:", err.response ? JSON.stringify(err.response.data) : err.message);
    }
}
testLimit();

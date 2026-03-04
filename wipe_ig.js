require('dotenv').config();
const axios = require('axios');

async function wipeAccount() {
    console.log("🔐 Autentificējos...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });
    
    const cst = loginRes.headers['cst'];
    const secToken = loginRes.headers['x-security-token'];
    const headers1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1', 'Version': '2' };
    
    console.log("📡 Dzēšu atvērtās pozīcijas...");
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: { ...headers1, 'Version': '1' } });
    const positions = posRes.data.positions;
    
    for(const p of positions) {
        console.log(`❌ Dzēšu ${p.position.dealId} (${p.market.epic})`);
        try {
            await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: p.position.dealId,
                direction: p.position.direction === 'BUY' ? 'SELL' : 'BUY',
                size: p.position.dealSize,
                orderType: 'MARKET'
            }, { 
                headers: { ...headers1, 'X-HTTP-Method-Override': 'DELETE' } 
            });
            console.log("   ✅ Dzēsts!");
        } catch(e) { console.log("   ❌ Kļūda", e.response?.data); }
    }
}
wipeAccount();

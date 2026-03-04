require('dotenv').config();
const axios = require('axios');
async function wipeAccount() {
    console.log("🔐 Autentificējos...");
    const lg = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    let h1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': lg.headers['cst'], 'X-SECURITY-TOKEN': lg.headers['x-security-token'], 'Version': '1' };
    
    let posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
    let positions = posRes.data.positions;
    
    // Sortējam un atstāsim jaunākās 2 pozīcijas (1 zeltam, 1 gbpusd). 
    // Vai vislabāk - slēgsim visu un atvērsim tīri.
    for(const p of positions) {
        console.log(`❌ Dzēšu ${p.position.dealId} (${p.market.epic})...`);
        try {
            await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: p.position.dealId,
                epic: p.market.epic,
                direction: p.position.direction === 'BUY' ? 'SELL' : 'BUY',
                size: p.position.dealSize,
                orderType: 'MARKET',
                currencyCode: p.position.currency
            }, { headers: { ...h1, 'X-HTTP-Method-Override': 'DELETE' } });
            console.log("   ✅ Aizvērts!");
        } catch(e) { console.log("   ❌", e.response?.data); }
    }
}
wipeAccount();

require('dotenv').config();
const axios = require('axios');
async function wipeAccount() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, { identifier: process.env.IG_USERNAME, password: process.env.IG_PASSWORD }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    const cst = loginRes.headers['cst']; const secToken = loginRes.headers['x-security-token'];
    const h1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1', 'X-HTTP-Method-Override': 'DELETE' };
    
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: { ...h1, 'X-HTTP-Method-Override': 'GET' } });
    for(const p of posRes.data.positions) {
        console.log(`❌ Dzēšu ${p.position.dealId}...`);
        try {
            await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: p.position.dealId,
                direction: p.position.direction === 'BUY' ? 'SELL' : 'BUY',
                size: p.position.dealSize,
                orderType: 'MARKET',
                currencyCode: 'USD'
            }, { headers: h1 });
            console.log("   ✅ Dzēsts!");
        } catch(e) { console.log(e.response?.data); }
    }
}
wipeAccount();

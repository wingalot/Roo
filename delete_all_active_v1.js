const axios = require('axios');
require('dotenv').config();
const { loginIG } = require('./ig_rest_api');

async function go() {
    const auth = await loginIG();
    const headers = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': auth.cst, 
        'X-SECURITY-TOKEN': auth.secToken, 
        'Version': '2'
    };

    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers });
    const positions = posRes.data.positions || [];
    
    console.log(`Atrasti atvērti orderi: ${positions.length}`);

    for (const p of positions) {
        console.log(`Dzēšu: ${p.position.dealId}`);
        const closeDirection = p.position.direction === "BUY" ? "SELL" : "BUY";
        try {
            const resp = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: p.position.dealId,
                direction: closeDirection,
                size: p.position.dealSize,
                orderType: "MARKET"
            }, {
                headers: {
                    ...headers,
                    'Version': '1', 
                    '_method': 'DELETE',
                    'X-HTTP-Method-Override': 'DELETE'
                }
            });
            console.log("✅ Closed", p.position.dealId);
        } catch(e) {
            console.log("❌ Kļūda:", e.response?.data || e.message);
        }
    }
}
go();

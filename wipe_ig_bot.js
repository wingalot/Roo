const axios = require('axios');
require('dotenv').config();

async function loginIG() {
    const res = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    return {
        cst: res.headers['cst'],
        secToken: res.headers['x-security-token']
    };
}

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

    // Dzēšam visus atvērtos Market (OTC) deal
    for (const p of positions) {
        console.log(`Dzēšu: ${p.position.dealId}  ${p.market.epic}  Size: ${p.position.dealSize} Type: ${p.position.direction}`);
        const closeDirection = p.position.direction === "BUY" ? "SELL" : "BUY";
        try {
            const resp = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: p.position.dealId,
                direction: closeDirection,
                size: p.position.dealSize.toString(),
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

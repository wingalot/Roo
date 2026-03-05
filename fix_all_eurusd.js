require('dotenv').config();
const axios = require('axios');

async function login() {
    const lg = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    return { cst: lg.headers['cst'], secToken: lg.headers['x-security-token'] };
}

async function run() {
    const auth = await login();
    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': auth.cst, 
        'X-SECURITY-TOKEN': auth.secToken, 
        'Version': '1',
        'X-HTTP-Method-Override': 'DELETE'
    };
    
    // Nolasu visas esošās pozīcijas no IG
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { 
        headers: {
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': auth.cst, 
            'X-SECURITY-TOKEN': auth.secToken, 
            'Version': '1'
        }
    });

    console.log(`🔎 Atrastas ${posRes.data.positions.length} atvērtas pozīcijas. Meklēju EUR/USD...`);

    for(const p of posRes.data.positions) {
        if(p.market.epic === "CS.D.EURUSD.MINI.IP") {
            console.log(`💥 Mēģinu dzēst fiktīvo EURUSD Orderi: ${p.position.dealId}`);
            try {
                await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                    dealId: p.position.dealId,
                    direction: p.position.direction === 'BUY' ? 'SELL' : 'BUY',
                    size: p.position.dealSize,
                    epic: p.market.epic, orderType: 'MARKET',
                    currencyCode: p.position.currency,
                    guaranteedStop: false,
                    forceOpen: false,
                    expiry: '-'
                }, { headers: h1 });
                console.log(`✅ ${p.position.dealId} IZDZĒSTS.`);
            } catch(e) {
                console.log(`❌ Kļūda ar ${p.position.dealId}:`, e.response?.data || e.message);
            }
        }
    }
}
run();

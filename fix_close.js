const axios = require('axios');
require('dotenv').config();

async function doIt() {
    const res = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

    const cst = res.headers['cst'];
    const sec = res.headers['x-security-token'];
    
    const hGet = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': cst, 
        'X-SECURITY-TOKEN': sec, 
        'Version': '2'
    };

    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: hGet });
    const positions = posRes.data.positions || [];
    console.log(`Pāri palika Atvērti: ${positions.length}`);

    for (const p of positions) {
        const dId = p.position.dealId;
        const dir = p.position.direction === 'BUY' ? 'SELL' : 'BUY';
        const sz = p.position.size.toString(); // <--- size, not dealSize
        try {
            await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: dId,
                direction: dir,
                size: sz,
                orderType: 'MARKET'
            }, {
                headers: {
                    'X-IG-API-KEY': process.env.IG_API_KEY,
                    'CST': cst,
                    'X-SECURITY-TOKEN': sec,
                    'Version': '1', 
                    '_method': 'DELETE'
                }
            });
            console.log("Nodzēsts:", dId);
        } catch(e) { console.log("Neizdevās:", dId, e.response?.data?.errorCode); }
    }
}
doIt();

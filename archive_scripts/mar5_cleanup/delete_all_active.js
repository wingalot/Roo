require('dotenv').config();
const axios = require('axios');

async function exec() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '1' ,
            '_method': 'DELETE',
            'Content-Type': 'application/json'
        };

        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { 
            headers: { ...h1, '_method': 'GET', 'Version': '2' } 
        });
        
        console.log(`Gatavojos dzēst ${posRes.data.positions.length} pozīcijas...`);
        for (const p of posRes.data.positions) {
            console.log(`Dzēšu: ${p.position.dealId} ...`);
            try {
                await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                    dealId: p.position.dealId,
                    direction: p.position.direction === 'BUY' ? 'SELL' : 'BUY',
                    size: p.position.size,
                    orderType: 'MARKET'
                }, { headers: h1 });
                console.log(`✅ Oky!`);
            } catch(e) {
                console.error("Kļūda dzēšot:", e.response ? e.response.data : e.message);
            }
        }
        
    } catch (e) { console.error(e.message); }
}
exec();

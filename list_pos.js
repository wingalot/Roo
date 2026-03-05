const axios = require('axios');
require('dotenv').config();

async function getPos() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const headers = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '2',
        };

        const res = await axios.get(`${process.env.IG_API_URL}/positions`, { headers });
        console.log(JSON.stringify(res.data.positions.map(p => ({dealId: p.position.dealId, epic: p.market.epic, dir: p.position.direction, size: p.position.size})), null, 2));

    } catch (err) {
        console.error("Kļūda:", err.message);
    }
}
getPos();

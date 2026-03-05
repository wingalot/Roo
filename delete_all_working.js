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
            'Version': '2' ,
            '_method': 'DELETE',
            'Content-Type': 'application/json'
        };

        const wOrdersRes = await axios.get(`${process.env.IG_API_URL}/workingorders`, { 
            headers: { ...h1, '_method': 'GET' } 
        });
        
        console.log(`Gatavojos dzēst ${wOrdersRes.data.workingOrders.length} limit orderus...`);
        for (const o of wOrdersRes.data.workingOrders) {
            console.log(`Dzēšu LIMIT: ${o.workingOrderData.dealId} ...`);
            try {
                await axios.post(`${process.env.IG_API_URL}/workingorders/otc/${o.workingOrderData.dealId}`, {}, { headers: h1 });
                console.log(`✅ Oky limit order deleted!`);
            } catch(err) {
                console.error("Kļūda dzēšot limit:", err.response ? JSON.stringify(err.response.data) : err.message);
            }
        }
        
    } catch (e) { console.error(e.message); }
}
exec();

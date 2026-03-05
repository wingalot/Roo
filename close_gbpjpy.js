const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function exec() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const authData = {
            cst: loginRes.headers['cst'],
            secToken: loginRes.headers['x-security-token']
        };

        const headersDelete = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '1', 
            'Content-Type': 'application/json',
            '_method': 'DELETE'
        };

        const dealId = 'DIAAAAWSTEPGLA7';
        console.log(`❌ Mēģinu aizvērt eksistējošo pozīciju: ${dealId}`);
        try {
            const delRes = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: dealId,
                direction: 'SELL',
                size: 1,
                orderType: 'MARKET'
            }, { headers: headersDelete });
            console.log("✅ Pozīcija Aizvērta. DealReference:", delRes.data.dealReference);
        } catch(e) { console.log('Kļūda dzēšot', e.response ? e.response.data : e.message) }

    } catch (err) { 
        console.error("Kļūda:", err.message); 
    }
}
exec();
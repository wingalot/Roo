const { loginIG } = require('./ig_rest_api');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function login() {
    const res = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    return {
        cst: res.headers['cst'],
        secToken: res.headers['x-security-token']
    };
}


async function closeAll() {
    try {
        const auth = await login();
        const headers = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': auth.cst, 
            'X-SECURITY-TOKEN': auth.secToken, 
            'Version': '2'
        };

        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers });
        const positions = posRes.data.positions || [];
        
        console.log(`Atrastas ${positions.length} atvērtas pozīcijas IG Kontā.`);
        
        for (const pos of positions) {
            const dealId = pos.position.dealId;
            const size = pos.position.dealSize;
            const dir = pos.position.direction === 'BUY' ? 'SELL' : 'BUY';
            
            const closeHeaders = { ...headers, '_method': 'DELETE', 'Content-Type': 'application/json' };
            const payload = {
                dealId: dealId,
                direction: dir,
                size: size,
                orderType: 'MARKET'
            };
            
            try {
                await axios.post(`${process.env.IG_API_URL}/positions/otc`, payload, { headers: closeHeaders });
                console.log(`✅ Pozīcija ${dealId} sekmīgi aizvērta!`);
            } catch (e) {
                console.error(`❌ Neizdevās aizvērt ${dealId}:`, e.response ? JSON.stringify(e.response.data) : e.message);
            }
        }
        
        // Iztīrām arī lokālo bāzi no šiem izdzēstajiem atlikumiem
        fs.writeFileSync('active_trades.json', '[]');
        console.log("Lokālā bāze `active_trades.json` arī iztukšota!");
        
    } catch (e) {
        console.error("Kļūda:", e.message);
    }
}

closeAll();

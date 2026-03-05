const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function deleteOrder() {
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
            '_method': 'DELETE',
            'Content-Type': 'application/json'
        };

        const targetId = 'DIAAAAWSLKSRWAR';
        console.log(`Mēģinu dzēst working order ${targetId}`);
        const delRes = await axios.post(`${process.env.IG_API_URL}/workingorders/otc/${targetId}`, {}, { headers });
        console.log('✅ Dzēsts veiksmīgi:', delRes.data);

        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
            if (activeTrades['CS.D.CFDGOLD.CFDGC.IP_LIMIT']) {
                delete activeTrades['CS.D.CFDGOLD.CFDGC.IP_LIMIT'];
                fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
                console.log('Izvākts no faila!');
            }
        }

    } catch (err) {
        console.error("Kļūda:", err.response ? err.response.data : err.message);
    }
}
deleteOrder();

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function cancelLimit() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '2',
            'X-HTTP-Method-Override': 'DELETE',
            'Content-Type': 'application/json'
        };

        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
        }

        const tradeKeys = Object.keys(activeTrades);
        for (const key of tradeKeys) {
            const trade = activeTrades[key];
            if (trade.status === 'PENDING' && trade.telegramMsgId === 8451) {
                console.log(`Dzēšam Limit Orderi ${trade.dealId} (ID: 8451)...`);
                try {
                    // IG API expects DELETE request to /workingorders/otc/{dealId}
                    await axios.post(`${process.env.IG_API_URL}/workingorders/otc/${trade.dealId}`, {}, { headers: headers2 });
                    console.log(`✅ Limit Orderis ${trade.dealId} izdzēsts.`);
                    delete activeTrades[key];
                    fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
                    console.log("active_trades.json atjaunināts!");
                } catch (err) {
                    console.error("Kļūda dzēšot:", err.response ? JSON.stringify(err.response.data) : err.message);
                }
            }
        }
    } catch (err) {
        console.error("⛔ Login Kļūda:", err.message);
    }
}
cancelLimit();

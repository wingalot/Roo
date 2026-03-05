require('dotenv').config();
const axios = require('axios');

async function testTrade() {
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
            'Content-Type': 'application/json'
        };

        const reqBody = {
            epic: 'CS.D.EURAUD.MINI.IP', // Mēģinām MINI kontraktu EURAUD
            expiry: '-',
            direction: 'BUY',
            size: 1, 
            orderType: 'MARKET',
            timeInForce: "EXECUTE_AND_ELIMINATE",
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'EUR' // Tā kā tavs konts ir EUR
        };

        console.log("Sūtu EURAUD Mini ar currencyCode: EUR...");
        try {
            const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers });
            console.log("✅ Deals panākts!", res.data.dealReference);
        } catch (e) {
            console.log("⛔ Kļūda:", e.response ? e.response.data.errorCode : e.message);
        }

    } catch (e) {
        console.error("Kļūda autentificējoties:", e.message);
    }
}
testTrade();
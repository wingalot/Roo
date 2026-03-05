const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function runGBPJPY() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const authData = {
            cst: loginRes.headers['cst'],
            secToken: loginRes.headers['x-security-token']
        };

        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        const epic = 'CS.D.GBPJPY.CFD.IP';
        console.log("🚀 Sūtu GBPJPY BUY MARKET uz IG ...");
        
        let reqBody = {
            epic: epic,
            expiry: '-',
            direction: 'BUY',
            size: 1, 
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: 'JPY' // IG prasa JPY bāzes valūtu CFD instrumentam saskaņā ar dokumentāciju un API check_cur.js
        };

        let res;
        try{
            res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: headers2 });
            console.log("✅ ACCEPTED!! DealReference:", res.data.dealReference);
        } catch(e) {
            console.log("⛔ Kļūda:", e.response ? JSON.stringify(e.response.data) : e.message);
        }
    } catch (err) { 
        console.error("Kļūda:", err.message); 
    }
}
runGBPJPY();

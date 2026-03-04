require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function login() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });
    return {
        cst: loginRes.headers['cst'],
        secToken: loginRes.headers['x-security-token']
    };
}

async function runRealSignal() {
    try {
        const authData = await login();
        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json'
        };

        const epic = 'CS.D.EURUSD.CFD.IP';
        const direction = 'BUY';
        const size = 10000; // CFD account for EURUSD typically needs lot sizes in currency amounts or standard CFD contract sizes. e.g. 1 lot = 100000 or mini 10000
        
        // CFD EURUSD contract size check: size might need to be e.g. 1 on CFD instead of a spreadbet size.
        // wait, 'REJECT_SPREADBET_ORDER_ON_CFD_ACCOUNT' means the epic is probably correct, but we sent it via spreadbet endpoints or sizing?
        // Let's try size 10000 for standard sizing if it's volume, or size 1 for 1 contract.
        // Wait, IG limits on CFD. 

        console.log("🚀 Sūtu EURUSD BUY MARKET uz IG...");
        const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            epic: epic,
            expiry: 'DFB',
            direction: direction,
            size: 1.0, // Retrying with 1.0
            orderType: 'MARKET',
            guaranteedStop: false,
            forceOpen: true, // We must not use parameters specific to spreadbet
            currencyCode: 'USD'
        }, { headers: headers2 });
        
        console.log("✅ Deal Reference:", res.data.dealReference);
        
        console.log(`⏰ Gaidu 2 sec...`);
        await new Promise(r => setTimeout(r, 2000));
        
        const h1 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '1' 
        };
        const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${res.data.dealReference}`, { headers: h1 });
        console.log(JSON.stringify(confRes.data, null, 2));

    } catch (err) { 
        console.error("Kļūda izpildot signālu:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

runRealSignal();

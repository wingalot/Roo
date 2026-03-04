require('dotenv').config();
const fs = require('fs');
const { createLimitOrder } = require('./ig_rest_api');
const axios = require('axios');

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

async function sim() {
    const authData = await login();
    let localMemory = {};
    if (fs.existsSync('active_trades.json')) {
        localMemory = JSON.parse(fs.readFileSync('active_trades.json'));
    }

    // izveidojam limitu kurš nostrādās #9 un #10
    console.log("📡 Mēģinu vēlreiz izveidot LIMIT orderus...");
    try {
        const res9 = await createLimitOrder(authData, 'CS.D.EURUSD.CFD.IP', 'BUY', 0.5, 1.0500);
        localMemory['CS.D.EURUSD.CFD.IP_SIM_8'] = { dealId: res9.dealReference, direction: 'BUY', status: 'PENDING', dealType: 'LIMIT', tp1: 1.06, tp2: 1.065, tp3: 1.07, sl: 1.04 };
        console.log("✅ LIMIT BUY EUR/USD Atvērts!");
    } catch(e) { console.log(e.response?.data); }

    try {
        const res10 = await createLimitOrder(authData, 'CS.D.CFDGOLD.CFDGC.IP', 'SELL', 0.5, 2100.0);
        localMemory['CS.D.CFDGOLD.CFDGC.IP_SIM_9'] = { dealId: res10.dealReference, direction: 'SELL', status: 'PENDING', dealType: 'LIMIT', tp1: 2080, tp2: 2070, tp3: 2050, sl: 2120 };
        console.log("✅ LIMIT SELL GOLD Atvērts!");
    } catch(e) { console.log(e.response?.data); }

    fs.writeFileSync('active_trades.json', JSON.stringify(localMemory, null, 2));
}
sim();

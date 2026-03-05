require('dotenv').config();
const axios = require('axios');
const { createMarketOrder, createLimitOrder } = require('./ig_rest_api');

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

async function run() {
    try {
        const authData = await login();
        console.log("✅ Autentifikācija veiksmīga, palaidu orderus...");

        // 1. EURUSD Testa Market
        try {
            await createMarketOrder(authData, 'CS.D.EURUSD.CFD.IP', 'BUY', 1);
        } catch(e) { console.log("EURUSD kļūda (ignorējam testam)"); }

        // 2. XAUUSD Testa Limit
        try {
            await createLimitOrder(authData, 'CS.D.CFDGOLD.CFDGC.IP', 'BUY', 1, 5150.0);
        } catch(e) { console.log("XAUUSD Limit kļūda"); }

        // 3. EURGBP Testa Market
        try {
            await createMarketOrder(authData, 'CS.D.EURGBP.CFD.IP', 'BUY', 1);
        } catch(e) { console.log("EURGBP kļūda"); }

        // 4. 🔥 REĀLAIS KAUJAS SIGNĀLS (XAUUSD Market)
        console.log("🔥 Izpildu kaujas signālu: XAUUSD BUY MARKET");
        try {
            const realTrade = await createMarketOrder(authData, 'CS.D.CFDGOLD.CFDGC.IP', 'BUY', 1);
            console.log("KAUJAS ORDERIS ATVĒRTS! DealRef:", realTrade.dealReference);
        } catch(e) { console.log("Kaujas ordera ķļūda!", e.response ? e.response.data : e.message); }

    } catch (err) {
        console.error("Kritiskā kļūda:", err.message);
    }
}

run();
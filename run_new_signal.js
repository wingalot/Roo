require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { createMarketOrder } = require('./ig_rest_api');

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

async function runNewSignal() {
    try {
        const authData = await login();
        console.log("🔥 Izpildu JAUNO kaujas signālu: XAUUSD BUY MARKET");
        
        // Atveram pozīciju (kā noskaidrojām - 0.5 lotes Demo ierobežojumu dēļ un ar USD currency)
        const realTrade = await createMarketOrder(authData, 'CS.D.CFDGOLD.CFDGC.IP', 'BUY', 0.5); 
        console.log("IEGĀDE VEIKSMĪGA, DEAL ID:", realTrade.dealReference);
        
        // Pievienojam mūsu lokālajai bāzei izveidoto treidu ar jaunajiem parametriem
        let activeTrades = {};
        if (fs.existsSync('active_trades.json')) {
            activeTrades = JSON.parse(fs.readFileSync('active_trades.json'));
        }
        
        const tp1 = 5154.6;
        const tp2 = 5156.1;
        const tp3 = 5165.1;
        const sl = 5141.1;
        
        activeTrades['CS.D.CFDGOLD.CFDGC.IP_NEW'] = {
            dealId: realTrade.dealReference,
            direction: 'BUY',
            tp1: tp1,
            tp2: tp2,
            tp3: tp3,
            sl: sl,
            status: 'PHASE_1',
            fallbackDistance: Math.abs(tp2 - tp1) * 0.10 // 10% no (5156.1 - 5154.6) = 0.15
        };
        
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log("💾 Jaunā 100% lokālā uzraudzības loģika saglabāta aktīvajos treidos.");

    } catch (err) { 
        console.log("Kļūda izpildot signālu:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

runNewSignal();
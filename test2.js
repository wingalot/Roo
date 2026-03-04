require('dotenv').config();
const axios = require('axios');
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

async function runTest2() {
    try {
        const authData = await login();
        
        console.log("🔥 Izpildu kaujas signālu: XAUUSD BUY MARKET (V2 ar automātisko valūtu)");
        try {
            // IG test environments prasa ciparus "pip/punktos" dažreiz kā .5 loti (depend on instrument). 
            // Demo accounts: CFD Gold var teikt mēs ievadām "0.5" margin constraints dēļ..
            const realTrade = await createMarketOrder(authData, 'CS.D.CFDGOLD.CFDGC.IP', 'BUY', 0.5); 
            console.log("KVĪTS REĢISTRĒTA:", realTrade.dealReference);
            
            // Poga pagaidīt un pārbaudīt, vai dealReffference ir REJECTED vai ACCEPTED
            setTimeout(async () => {
                const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${realTrade.dealReference}`, { 
                    headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': authData.cst, 'X-SECURITY-TOKEN': authData.secToken, 'Version': '1' } 
                });
                console.log("Darījuma statuss:", confRes.data.dealStatus, confRes.data.reason);
            }, 3000);

        } catch(e) { console.log("Kļūda!", e.response ? e.response.data : e.message); }

    } catch (err) { }
}

runTest2();
require('dotenv').config();
const axios = require('axios');

async function searchEURAUD() {
    try {
        console.log("🔐 Autentificējos...");
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, {
            headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
        });
        
        const cst = loginRes.headers['cst'];
        const secToken = loginRes.headers['x-security-token'];
        const headers1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1' };
        
        console.log("🔍 Meklējam EURAUD un valūtas ierobežojumus...");
        const searchRes = await axios.get(`${process.env.IG_API_URL}/markets?searchTerm=EURAUD`, { headers: headers1 });
        
        searchRes.data.markets.forEach(m => {
            console.log(`Epic: ${m.epic} | Nosaukums: ${m.instrumentName} | Bid: ${m.bid} | Ask: ${m.offer}`);
        });

        const targetEpic = "CS.D.EURAUD.CFD.IP";
        console.log(`\n📄 Detaļas par instrumentu: ${targetEpic}`);
        const instRes = await axios.get(`${process.env.IG_API_URL}/markets/${targetEpic}`, { headers: headers1 });
        
        console.log("Currency:", instRes.data.instrument.currencies);
        console.log("Min Deal Size:", instRes.data.rules.minDealSize);

    } catch (e) {
         console.error("Kļūda:", e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
searchEURAUD();
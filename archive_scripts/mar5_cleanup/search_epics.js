require('dotenv').config();
const axios = require('axios');

async function searchAndExecute() {
    try {
        // 1. Login
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
        
        // 2. Meklējam Epics
        const queries = ['EURUSD', 'Gold', 'EURGBP'];
        const epics = {};
        
        for (let q of queries) {
            const searchRes = await axios.get(`${process.env.IG_API_URL}/markets?searchTerm=${q}`, { headers: headers1 });
            // Paņemam pirmo piemēroto (vēlamies spot/FX)
            const market = searchRes.data.markets.find(m => m.epic.includes('CS.D.') || m.epic.includes('IX.D.')) || searchRes.data.markets[0];
            if(market) {
                epics[q] = { epic: market.epic, bid: market.bid, offer: market.offer };
                console.log(`🔍 Atlaidu: ${q} -> Epic: ${market.epic} | Market: ${market.bid} / ${market.offer}`);
            }
        }

        // Tālāk - es, kā aģents, izmantošu šos datus, lai aprēķinātu un palaistu orderus nākamajā solī.
    } catch (e) {
        console.error("Kļūda:", e.response ? e.response.data : e.message);
    }
}
searchAndExecute();
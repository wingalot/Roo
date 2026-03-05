const axios = require('axios');
require('dotenv').config();

async function search() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const headers = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '1',
        };

        const res = await axios.get(`${process.env.IG_API_URL}/markets?searchTerm=GBPJPY`, { headers });
        console.log(JSON.stringify(res.data.markets[0], null, 2));
    } catch (err) {
        console.error("Kļūda:", err.message);
    }
}
search();

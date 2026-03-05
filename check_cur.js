const axios = require('axios');
require('dotenv').config();

async function checkCur() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const headers = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': loginRes.headers['cst'], 
            'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
            'Version': '3', // Usually markets endpoint is v1, v2 or v3
        };

        const res = await axios.get(`${process.env.IG_API_URL}/markets/CS.D.GBPJPY.CFD.IP`, { headers });
        console.log("Valūta:", res.data.instrument.currencies[0].code);
        console.log("Viss instrument:", JSON.stringify(res.data.instrument, null, 2));

    } catch (err) {
        console.error("Kļūda:", err.response ? JSON.stringify(err.response.data) : err.message);
    }
}
checkCur();

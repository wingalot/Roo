require('dotenv').config();
const axios = require('axios');

async function checkAccountStatus() {
    try {
        console.log("🔐 Autentificējos lai pārbaudītu kontu...");
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, {
            headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
        });
        
        const cst = loginRes.headers['cst'];
        const secToken = loginRes.headers['x-security-token'];
        const headers1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1' };
        
        console.log("📡 Pieprasu atvērtās pozīcijas...");
        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: headers1 });
        console.log("Atvērtās pozīcijas:", JSON.stringify(posRes.data.positions, null, 2));

        console.log("📡 Pieprasu deal confirmation (YBRUARWP3ULTYNK)...");
        try {
            const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/YBRUARWP3ULTYNK`, { 
                headers: { ...headers1, 'Version': '1' } 
            });
            console.log("Deal statuss:", confRes.data.dealStatus, confRes.data.reason);
        } catch(e) {
            console.log("Nevarēju atrast deal info", e.response?.data);
        }

    } catch (e) {
        console.error("Kļūda:", e.response ? e.response.data : e.message);
    }
}
checkAccountStatus();
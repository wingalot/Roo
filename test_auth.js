require('dotenv').config();
const axios = require('axios');
const ls = require('lightstreamer-client-node');

const IG_API_URL = process.env.IG_API_URL;
const IG_API_KEY = process.env.IG_API_KEY;
const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

async function run() {
    try {
        console.log("Vai mēģinām sakonektēties ar IG Demo brokera sistēmu...");
        
        // 1. Iegūstam REST Autorizāciju (CST + X-SECURITY-TOKEN)
        const response = await axios.post(`${IG_API_URL}/session`, {
            identifier: IG_USERNAME,
            password: IG_PASSWORD
        }, {
            headers: {
                'X-IG-API-KEY': IG_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json; charset=UTF-8',
                'Version': '2'
            }
        });

        const cst = response.headers['cst'];
        const securityToken = response.headers['x-security-token'];
        const activeAccountId = response.data.currentAccountId;
        const lightstreamerEndpoint = response.data.lightstreamerEndpoint;

        console.log("✅ Autorizējāmies! Akounta ID:", activeAccountId);
        
        // 2. Te būtu Lightstreamer pieslēgšanās:
        console.log("Lightstreamer serveris ir apslēpts šeit:", lightstreamerEndpoint);
        
        // Testam aizveram savienojumu lēnītēm mīksti...
        setTimeout(() => {
           console.log("Pārbaude beidzās veiksmīgi!");
           process.exit(0);
        }, 2000);

    } catch (err) {
        console.error("❌ Kļūme savienojumā:", err.response ? err.response.data : err.message);
    }
}

run();
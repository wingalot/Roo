require('dotenv').config();
const axios = require('axios');
async function check() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': loginRes.headers['cst'], 
        'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
        'Version': '2' 
    };
    
    const posRes = await axios.get(`${process.env.IG_API_URL}/workingorders`, { headers: h1 });
    console.log(`📡 Atvērti Working Orders: ${posRes.data.workingOrders.length}`);
}
check();

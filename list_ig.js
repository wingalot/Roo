require('dotenv').config();
const axios = require('axios');

async function checkAccountStatus() {
    console.log("🔐 Pārbaudu aktuālos datus no IG Demo...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': loginRes.headers['cst'], 
        'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
        'Version': '1' 
    };
    
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
    const count = posRes.data.positions.length;
    console.log(`📡 Atvērtas pozīcijas šobrīd: ${count}\n`);
    
    posRes.data.positions.forEach(p => {
        console.log(`DealId: ${p.position.dealId}`);
        console.log(`Epic: ${p.market.epic}`);
        console.log(`Virziens: ${p.position.direction}`);
        console.log(`Atvēršanas cena: ${p.position.openLevel}`);
        console.log(`Izmērs: ${p.position.dealSize}\n`);
    });
}
checkAccountStatus();

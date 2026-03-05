const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function loginIG() {
    const res = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    return { cst: res.headers['cst'], secToken: res.headers['x-security-token'] };
}

async function check() {
    try {
        const auth = await loginIG();
        const res = await axios.get(`${process.env.IG_API_URL}/positions`, {
            headers: { 
                'X-IG-API-KEY': process.env.IG_API_KEY, 
                'CST': auth.cst, 
                'X-SECURITY-TOKEN': auth.secToken, 
                'Version': '2' 
            }
        });
        console.log("=== IG POZĪCIJAS ===");
        const igPositions = res.data.positions || [];
        igPositions.forEach(p => {
            console.log(`- DealID: ${p.position.dealId}, Epic: ${p.market.epic}, Dir: ${p.position.direction}, Size: ${p.position.size}`);
        });
        if(igPositions.length === 0) console.log("0 pozīcijas atvērtas IG.");

        console.log("\n=== LOKĀLĀ DATUBĀZE (active_trades.json) ===");
        let localTrades = [];
        if (fs.existsSync('active_trades.json')) {
            localTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
        }
        localTrades.forEach(t => {
            console.log(`- DealID: ${t.dealId}, Epic: ${t.epic}, Dir: ${t.direction}, Size: ${t.size}, Status: ${t.status}`);
        });
        if(localTrades.length === 0) console.log("0 pozīcijas lokālajā datubāzē.");

    } catch(e) { console.error("Error:", e.message); }
}
check();

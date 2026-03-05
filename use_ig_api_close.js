const { loginIG, closePositionAPI } = require('./ig_rest_api');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function start() {
    try {
        const auth = await loginIG();
        const headers = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': auth.cst, 
            'X-SECURITY-TOKEN': auth.secToken, 
            'Version': '2'
        };

        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers });
        const positions = posRes.data.positions || [];
        
        console.log(`Mēģinu dzēst visas pozīcijas, izmantojot bibliotēkas 'closePositionAPI' metodi.`);
        
        for (const pos of positions) {
            console.log(`Dzēšu Deal: ${pos.position.dealId}`);
            try {
                // (authData, dealId, epic, originalDirection, originalSize)
                await closePositionAPI(auth, pos.position.dealId, pos.market.epic, pos.position.direction, pos.position.dealSize);
                console.log(`✅ Aizvērta: ${pos.position.dealId}`);
            } catch (e) {
                console.error(`❌ Kļūda:`, e.response?.data || e.message);
            }
        }
    } catch (e) {
        console.error("Kļūda:", e.message);
    }
}
start();

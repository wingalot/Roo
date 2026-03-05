require('dotenv').config();
const axios = require('axios');

async function getSpecs() {
    console.log("🔐 Autentificējos...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });
    
    const cst = loginRes.headers['cst'];
    const secToken = loginRes.headers['x-security-token'];
    const headers = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '2' }; // Version 2 creates OTC order, maybe Version 2 needs to use currencyCode and without expiry?
}

require('dotenv').config();
const axios = require('axios');
const { createLimitOrder } = require('./ig_rest_api');

async function loginIG() {
    const response = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });
    return { cst: response.headers['cst'], secToken: response.headers['x-security-token'] };
}

async function run() {
    const start = Date.now();
    try {
        const auth = await loginIG();
        await createLimitOrder(auth, 'CS.D.CFDGOLD.CFDGC.IP', 'SELL', 1, 5186.0);
        const end = Date.now();
        console.log(`⏱️ Kopējais API izpildes laiks (Login + Order): ${end - start} ms`);
    } catch (e) {
        console.error("Kļūda:", e.message);
    }
}
run();

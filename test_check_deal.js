require('dotenv').config();
const axios = require('axios');
async function test() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

    const cst = loginRes.headers['cst'];
    const stk = loginRes.headers['x-security-token'];

    const res = await axios.get(`${process.env.IG_API_URL}/confirms/9L58DQJL438TYP5`, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': stk, 'Version': '1' }
    });
    console.log(JSON.stringify(res.data, null, 2));
}
test().catch(e => console.error(e.response.data));

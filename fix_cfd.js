require('dotenv').config();
const axios = require('axios');

async function fixCfd() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

    const cst = loginRes.headers['cst'];
    const secToken = loginRes.headers['x-security-token'];
    
    // Mēģināsim uzzināt patieso CFD EURUSD account epicu vai dealing settingus
    const h1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1' };
    const res = await axios.get(`${process.env.IG_API_URL}/markets/CS.D.EURUSD.CFD.IP`, { headers: h1 });
    console.log(JSON.stringify(res.data.instrument, null, 2));
    console.log("Dealing rules:");
    console.log(JSON.stringify(res.data.dealingRules, null, 2));
}

fixCfd();

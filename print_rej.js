require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function checkRef() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, {
        headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
    });

    const h1 = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': loginRes.headers['cst'], 
        'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
        'Version': '1' 
    };

    const ref = 'YSHTGS3EC9UTYNK';
    try {
        const confRes = await axios.get(`${process.env.IG_API_URL}/confirms/${ref}`, { headers: h1 });
        console.log(JSON.stringify(confRes.data, null, 2));
    } catch(err) {
        console.log("Error fetching conf:");
        console.log(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

checkRef();

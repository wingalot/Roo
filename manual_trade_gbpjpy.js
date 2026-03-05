const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function runGBPJPY() {
    try {
        const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

        const authData = {
            cst: loginRes.headers['cst'],
            secToken: loginRes.headers['x-security-token']
        };

        const headers2 = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': authData.cst, 
            'X-SECURITY-TOKEN': authData.secToken, 
            'Version': '2',
            'Content-Type': 'application/json',
            '_method': 'DELETE'
        };

        const epic = 'CS.D.GBPJPY.CFD.IP';
        const dealId = 'DIAAAAWSLTEVGA8';
        console.log("Aizveram pozīciju...");
        
        try {
            const delRes = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: 'DIAAAAWSLV5G5BA', // Ievietoju pareizo Deal ID no vakardienas IG skata attēla / logiem (W3KERPE4F6YTYNK resultēja šajā: DIAAAAWSLV5G5BA - I'll check working positions first to be sure)
                direction: 'SELL',
                size: 1,
                orderType: 'MARKET'
            }, { headers: headers2 });
            console.log("Aizvērts:", delRes.data);
        } catch (e) {
             console.log("Kļūda dzēšot:", e.response ? JSON.stringify(e.response.data) : e.message);
        }

    } catch (err) { 
        console.error("Kļūda:", err.message); 
    }
}
runGBPJPY();

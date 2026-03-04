require('dotenv').config();
const axios = require('axios');

async function manualKillVal() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const headers = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': loginRes.headers['cst'], 
        'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
        'Version': '1', 
        'Content-Type': 'application/json' 
    };
    
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers });
    let golds = posRes.data.positions.filter(p => p.market.epic === 'CS.D.CFDGOLD.CFDGC.IP');
    
    // Sort and keep newest and original
    for (let i = 0; i < golds.length; i++) {
        let p = golds[i];
        if (p.position.dealId !== 'GAZWP5WCT5CTYNK') { 
            console.log(`Killing: ${p.position.dealId}`);
            try {
                // DELETE methods IG API prasa epic, expiry, utt
                await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                    dealId: p.position.dealId,
                    epic: p.market.epic,
                    expiry: p.market.expiry,
                    direction: 'SELL',
                    size: 0.5,
                    orderType: 'MARKET'
                }, {
                   headers: { ...headers, '_method': 'DELETE' } // IG fallback override
                });
                console.log(`Deleted ${p.position.dealId} OK`);
            } catch(e) { 
                console.log("Fallback failed.. Trying DELETE verb");
                try {
                await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                    dealId: p.position.dealId,
                    epic: p.market.epic,
                    expiry: p.market.expiry,
                    direction: 'SELL',
                    size: 0.5,
                    orderType: 'MARKET'
                }, {
                   headers: { ...headers, 'X-HTTP-Method-Override': 'DELETE' } // IG specific override
                });
                 console.log(`Deleted ${p.position.dealId} via HTTP-Method-Override OK`);
                } catch(e2) {
                    console.log("Failed 2: ", e2.response.data);
                }
            }
        }
    }
}

manualKillVal();
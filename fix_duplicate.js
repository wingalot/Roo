require('dotenv').config();
const axios = require('axios');

async function fixDuplicate() {
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });
    
    const headers = { 
        'X-IG-API-KEY': process.env.IG_API_KEY, 
        'CST': loginRes.headers['cst'], 
        'X-SECURITY-TOKEN': loginRes.headers['x-security-token'], 
        'Version': '1', 
        'Content-Type': 'application/json',
        '_method': 'DELETE'
    };
    
    const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { 
        headers: { ...headers, '_method': undefined } 
    });
    
    let golds = posRes.data.positions.filter(p => p.market.epic === 'CS.D.CFDGOLD.CFDGC.IP');
    console.log(`Pašlaik atvērtas Zelta pozīcijas: ${golds.length}`);
    
    // Mēs gribam atstāt TIKAI vienu no jaunajām pozīcijām.
    // Sašķirojam pēc laika (jaunākās)
    golds.sort((a,b) => b.position.dealId.localeCompare(a.position.dealId));
    
    for (let i = 1; i < golds.length; i++) { // Atstājam pirmo indeksu (vienu jaunāko)
        let p = golds[i];
        console.log(`Mēģinu aizvērt dublikātu: ${p.position.dealId}`);
        try {
            await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
                dealId: p.position.dealId,
                direction: p.position.direction === 'BUY' ? 'SELL' : 'BUY',
                size: p.position.dealSize,
                orderType: 'MARKET',
                currencyCode: 'USD' // Pievienots, lai apmierinātu IG Demo validāciju
            }, { headers });
            console.log(`✅ Aizvērts veiksmīgi: ${p.position.dealId}`);
        } catch(e) { 
            console.log(`❌ Neizdevās aizvērt: ${p.position.dealId}`, e.response?.data); 
        }
    }
}
fixDuplicate();
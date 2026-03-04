require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function checkAndClosePositions() {
    console.log("📡 Uzsākam Live Mērķu (TP/SL) skenēšanu...");
    const loginRes = await axios.post(`${process.env.IG_API_URL}/session`, {
        identifier: process.env.IG_USERNAME,
        password: process.env.IG_PASSWORD
    }, { headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' } });

    const cst = loginRes.headers['cst'];
    const secToken = loginRes.headers['x-security-token'];
    
    const h1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '1' };
    const h2 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': cst, 'X-SECURITY-TOKEN': secToken, 'Version': '2', 'Content-Type': 'application/json', '_method': 'DELETE' };

    let running = true;
    while(running) {
        if (!fs.existsSync('active_trades.json')) {
            console.log("Nav aktīvo treidu bāzes.");
            break;
        }
        let activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
        
        const posRes = await axios.get(`${process.env.IG_API_URL}/positions`, { headers: h1 });
        const openPositions = posRes.data.positions;

        let closedSomething = false;

        for (const epic in activeTrades) {
            const trade = activeTrades[epic];
            // Atrodam IG aktuālo pozīciju
            const igPos = openPositions.find(p => p.position.dealId === trade.dealId || p.market.epic === epic);
            
            if(!igPos) {
                console.log(`Pozīcija ${epic} vairs neeksistē IG kontā. Dzēšu no bāzes.`);
                delete activeTrades[epic];
                closedSomething = true;
                continue;
            }

            // Bid = cena pa kuru pārdos(buy slēgsies), Offer = cena pa kuru pirks(sell slēgsies)
            const currentPrice = trade.direction === 'BUY' ? igPos.market.bid : igPos.market.offer;
            // console.log(`[${epic}] Aktuālā Cena: ${currentPrice} | SL: ${trade.sl} | TP1: ${trade.tp1} | TP3/Test: ${trade.tp3}`);

            if (trade.direction === 'BUY') {
                if(currentPrice <= trade.sl) {
                    console.log(`\n🛑 [${epic}] SL SASNIEGTS at ${currentPrice} (SL bija ${trade.sl}). Slēdzam ciet!`);
                    await closePosition(epic, trade.dealId, trade.direction, trade.size, h2);
                    delete activeTrades[epic];
                    closedSomething = true;
                } else if (currentPrice >= trade.tp3) {
                     console.log(`\n✅ [${epic}] TESTA TP3 SASNIEGTS at ${currentPrice} (TP3 bija ${trade.tp3}). Slēdzam ciet!`);
                     await closePosition(epic, trade.dealId, trade.direction, trade.size, h2);
                     delete activeTrades[epic];
                     closedSomething = true;
                }
            }
        }
        
        if (closedSomething) {
             fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
             running = false; // Testam pietiks
        } else {
             await new Promise(r => setTimeout(r, 2000));
        }
    }
}

async function closePosition(epic, dealId, direction, size, h) {
     const closeDirection = direction === 'BUY' ? 'SELL' : 'BUY';
     const reqBody = {
         dealId: dealId,
         direction: closeDirection,
         size: size,
         orderType: 'MARKET'
     };
     try {
         const res = await axios.post(`${process.env.IG_API_URL}/positions/otc`, reqBody, { headers: h });
         console.log(`SLĒGŠANAS REFERENC: ${res.data.dealReference}`);
     } catch (e) {
         console.log("Kļūda slēdzot:", e.response ? JSON.stringify(e.response.data) : e.message);
     }
}

checkAndClosePositions();

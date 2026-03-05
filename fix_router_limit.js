const fs = require('fs');

let code = fs.readFileSync('signal_router.js', 'utf8');

// Replace the current single matching logic to handle 
// LIMIT orders ("BUY LIMIT", "SELL LIMIT") vs MARKET ("BUY XAU", "SELL XAU")

code = code.replace(
/const { createMarketOrder } = require\('\.\/ig_rest_api'\);[\s\S]*?console\.log\(\`🔥 Pārbaudīts MARKET: \${direction} \${pair} pie \${price}\`\);/g,
`const { createMarketOrder, createLimitOrder } = require('./ig_rest_api');
    
    // Šeit nolasām LIMIT vai MARKET.
    // LIMIT: "BUY LIMIT XAUUSD 5152.9"
    // MARKET: "BUY XAUUSD 5152.9"
    let isLimit = false;
    let limitPrice = null;
    let match = signal.text.match(/(BUY|SELL)\s+LIMIT\s+([A-Z]+)\s+([0-9.]+)/i);
    if(match) {
        isLimit = true;
    } else {
        match = signal.text.match(/(BUY|SELL)\s+([A-Z]+)\s+([0-9.]+)/i);
    }
    
    if (match && !signal.text.toLowerCase().includes('cancel') && !signal.text.toLowerCase().includes('hit')) {
        const direction = match[1].toUpperCase();
        let pair = match[2].toUpperCase();
        const price = parseFloat(match[3]);

        if(isLimit) {
            limitPrice = price;
            console.log(\`⏱️ Pārbaudīts LIMIT: \${direction} \${pair} pie \${price}\`);
        } else {
            console.log(\`🔥 Pārbaudīts MARKET: \${direction} \${pair} pie \${price}\`);
        }`
);

// Second, replace the creation logic
code = code.replace(
`const res = await createMarketOrder(auth, epic, direction, 1);
                
                console.log("MARKET TIRDZNIECĪBA IESNIEGTA IG. DealRef:", res.dealReference);`,
`let res;
                if(isLimit) {
                     res = await createLimitOrder(auth, epic, direction, 1, limitPrice);
                     console.log("LIMIT TIRDZNIECĪBA IESNIEGTA IG. DealRef:", res.dealReference);
                } else {
                     res = await createMarketOrder(auth, epic, direction, 1);
                     console.log("MARKET TIRDZNIECĪBA IESNIEGTA IG. DealRef:", res.dealReference);
                }`
);

code = code.replace(
`activeTrades.push({
                    telegramMsgId: signal.id,
                    epic: epic,
                    direction: direction,
                    size: 1, // baseline
                    entry: price,
                    sl: sl,
                    tp1: tp1,
                    tp2: tp2,
                    tp3: tp3,
                    status: 'PHASE_1',
                    entryTimestamp: new Date().toISOString(),
                    dealId: realDealId
                });`,
`activeTrades.push({
                    telegramMsgId: signal.id,
                    epic: epic,
                    direction: direction,
                    size: 1, // baseline
                    entry: price,
                    sl: sl,
                    tp1: tp1,
                    tp2: tp2,
                    tp3: tp3,
                    status: isLimit ? 'PENDING' : 'PHASE_1',
                    entryTimestamp: new Date().toISOString(),
                    dealId: realDealId // Limit orderam IG uzreiz arī dod dealId (vai string order reference) tālākai operācijām!
                });`
);

fs.writeFileSync('signal_router.js', code);
console.log("Patched router directly for LIMIT variants");

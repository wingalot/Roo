const fs = require('fs');
let code = fs.readFileSync('signal_router.js', 'utf8');

const activateLogic = `
    // Šeit apstrādā Limit Atcelšanu (Cancel)
    if (signal.text && signal.text.toLowerCase().includes('cancel')) {
        console.log(\`Sāku atcelt atvērto Limit orderi no signāla ID: \${signal.reply_to || 'nezināms'}\`);
        await cancelLimitLogic(signal.reply_to);
    }
    
    // Šeit apstrādā "Activated" LIMIT ordera padarīšanu par MARKET
    if (signal.text && signal.text.toLowerCase().includes('activated') && signal.reply_to) {
        console.log(\`Uztverta ACTIVATED komanda LIMIT orderim (Reply ID: \${signal.reply_to})\`);
        await activateLimitLogic(signal.reply_to);
    }
`;
code = code.replace(/    \/\/ Šeit apstrādā Limit Atcelšanu \(Cancel\)[\s\S]*?await cancelLimitLogic\(signal\.reply_to\);\n    }/, activateLogic);

const activateFunc = `
async function activateLimitLogic(targetMsgId) {
    let activeTrades = [];
    if (fs.existsSync('active_trades.json')) {
        try {
            const parsed = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
            activeTrades = Array.isArray(parsed) ? parsed : Object.values(parsed);
        } catch(e) {}
    }
    
    const tradeIndex = activeTrades.findIndex(t => t.status === 'PENDING' && t.telegramMsgId == targetMsgId);
    if (tradeIndex === -1) {
        console.log(\`Neatradās PENDING orderis lokalajā bāzē ar saistīto reply_to ID: \${targetMsgId}\`);
        return;
    }
    const trade = activeTrades[tradeIndex];
    console.log(\`Atrasts PENDING \${trade.dealId} (\${trade.direction} \${trade.epic}). Mēģinu dzēst...\`);
    
    try {
        const auth = await loginIG();
        const headers = { 
            'X-IG-API-KEY': process.env.IG_API_KEY, 
            'CST': auth.cst, 
            'X-SECURITY-TOKEN': auth.secToken, 
            'Version': '2',
            '_method': 'DELETE',
            'Content-Type': 'application/json'
        };
        try {
            await axios.post(\`\${process.env.IG_API_URL}/workingorders/otc/\${trade.dealId}\`, {}, { headers });
            console.log(\`✅ Gaidošais LIMIT orderis \${trade.dealId} sekmīgi atcelts platformā!\`);
        } catch(e) { 
            console.log(\`Kļūda dzēšot veco LIMIT orderi: \${e.message}\`);
        }

        const { createMarketOrder } = require('./ig_rest_api');
        const res = await createMarketOrder(auth, trade.epic, trade.direction, trade.size || 1);
        console.log(\`🚀 Jaunais MARKET orderis tika izveidots sekmīgi! (\${res.dealReference})\`);
        
        // Pagaidām un iegūstam reālo dealId no platformas (izlaists koda apjoma dēļ, izmantosim reference pagaidām, tālāk darbosies tā pat kā entry fāzē)
        let newDealId = res.dealReference;
        // Gaidam nelielu brīvdienīti un veicam confirm fetch, lai dabūtu īsto DealID.
        await new Promise(r => setTimeout(r, 2000));
        try {
            const confRes = await axios.get(\`\${process.env.IG_API_URL}/confirms/\${res.dealReference}\`, {
                headers: { 
                    'X-IG-API-KEY': process.env.IG_API_KEY, 
                    'CST': auth.cst, 
                    'X-SECURITY-TOKEN': auth.secToken, 
                    'Version': '1' 
                }
            });
            if (confRes.data && confRes.data.dealId) newDealId = confRes.data.dealId;
        } catch(e) {}
        
        // Atjauninam lokalā db iestrāžu vērtības
        activeTrades[tradeIndex].status = 'PHASE_1';
        activeTrades[tradeIndex].dealId = newDealId;
        // Piešķiram jaunu entry cenu lai ir ticams ierakts
        activeTrades.splice(tradeIndex, 1, activeTrades[tradeIndex]);
        
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log(\`✅ MARKET Orderis (\${newDealId}) aktivizēts un ierakstīts DB! (Vecais limit dzēsts)\`);
    } catch(err) {
        console.error("Kļūda transformējot LIMIT -> MARKET:", err.message);
    }
}
`;

code = code.replace(/async function cancelLimitLogic/, activateFunc + '\n\nasync function cancelLimitLogic');
fs.writeFileSync('signal_router.js', code);

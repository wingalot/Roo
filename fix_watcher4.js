const fs = require('fs');
let code = fs.readFileSync('sync_watcher.js', 'utf8');

// Iztīram lieko, kas sačakarējās regex no fix_watcher2 / fix_watcher3
// Pievienosim pārdomātu un tīru ciklu

code = code.replace(/\/\/ SCENĀRIJS A: Pozīcija ir IG, bet nav LOKĀLI[\s\S]+?for \(const igPos of igPositions\) {/, `
        // SCENĀRIJS A: Pozīcija ir IG, bet nav LOKĀLI
        for (const igPos of igPositions) {
            if (!localDealIds.has(igPos.dealId)) {
                
                // Mēģinam atrast pending listē
                let matchedPendingKey = null;
                for (const [pKey, pData] of Object.entries(pendingOrders)) {
                    if (pData.epic === igPos.epic && pData.direction === igPos.direction) {
                        matchedPendingKey = pKey;
                        break;
                    }
                }
                
                if (matchedPendingKey) {
                    const pData = pendingOrders[matchedPendingKey];
                    logMsg(\`🎯 ATPAZĪTS: Limit orderis izpildījies! Jaunais Deal ID: \${igPos.dealId} (\${igPos.epic})\`);
                    
                    activeTrades[igPos.epic] = {
                        dealId: igPos.dealId,
                        epic: igPos.epic,
                        direction: igPos.direction,
                        size: igPos.dealSize,
                        entryPrice: pData.entryPrice || 0,
                        tp1: pData.tp1,
                        tp2: pData.tp2,
                        sl: pData.sl,
                        phase: 1,
                        highestPnl: 0
                    };
                    
                    delete pendingOrders[matchedPendingKey];
                    fs.writeFileSync('pending_orders.json', JSON.stringify(pendingOrders, null, 2));
                    
                    modificationsMade = true;
                    localDealIds.add(igPos.dealId);
                    
                    try {
                        const { execSync } = require('child_process');
                        console.log(\`✅ Pievienoju atvērto Limit orderi (\${igPos.dealId}) vietējai uzraudzībai.\`);
                        execSync(\`openclaw message send --target "395239117" --channel "telegram" --message "🎯 **Limit Orderis Aktivizēts!**\\n\\nInstruments: \${igPos.epic}\\nTagad lokālais TP/SL dzinējs sāk to uzraudzīt. Deal ID: \${igPos.dealId}"\`);
                    } catch(e) {}
                    
                    continue; 
                }

                logMsg(\`🚨 KONFLIKTS: IG atrasta pozīcija, kuras nav lokālajā uzraudzībā! DealId: \${igPos.dealId} (\${igPos.epic}). Prasu atļauju...\`);
`);

fs.writeFileSync('sync_watcher.js', code);

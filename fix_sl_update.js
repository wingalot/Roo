const fs = require('fs');

function checkUpdates() {
    if (!fs.existsSync('latest_signals.json') || !fs.existsSync('active_trades.json')) return;

    const signals = JSON.parse(fs.readFileSync('latest_signals.json', 'utf8'));
    let activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
    let pendingOrders = {};
    if (fs.existsSync('pending_orders.json')) pendingOrders = JSON.parse(fs.readFileSync('pending_orders.json', 'utf8'));

    let modified = false;

    for (const msg of signals) {
        if (!msg.text || !msg.reply_to) continue;

        // "Buy Activated Move stoploss to 5200.10"
        const lowerText = msg.text.toLowerCase();
        if (lowerText.includes('move stoploss to') || lowerText.includes('move sl to')) {
            const match = lowerText.match(/to\s+([0-9.]+)/);
            if (match && match[1]) {
                const newSl = parseFloat(match[1]);

                // Meklējam Active Trades
                for (const [epic, trade] of Object.entries(activeTrades)) {
                    // Caur telegram_test.py mums vēl nav trade.telegramMsgId saglabāts, bet 
                    // Ja tā ieliksiet, tad pārbaudīs. Šobrīd pagaidu variants: 
                    // Ja epic atbilst signāls replyTo... Mums gan vajag msg_id reģistrēt atvēršanā.
                    if (trade.telegramMsgId === msg.reply_to && trade.sl !== newSl) {
                        trade.sl = newSl;
                        console.log(`🎯 [ATJAUNINĀJUMS] Pārnesu SL uz \${newSl} instrumentam \${epic} (pēc msg \${msg.id})!`);
                        modified = true;
                        
                        try {
                            const { execSync } = require('child_process');
                            execSync(`openclaw message send --target "395239117" --channel "telegram" --message "⚠️ **StopLoss Pārcelts!**\n\nInstruments: ${epic}\nJaunais SL: ${newSl}\nPamatojums: Felix Update (${msg.id})"`);
                        } catch(e) {}
                    }
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
    }
}

// Kad palaiž skriptu, pārbauda uzkrātos jaunākos update
checkUpdates();

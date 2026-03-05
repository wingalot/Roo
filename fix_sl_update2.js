const fs = require('fs');

function checkUpdates() {
    if (!fs.existsSync('latest_signals.json')) return;
    const signals = JSON.parse(fs.readFileSync('latest_signals.json', 'utf8'));
    
    let activeTrades = {};
    if (fs.existsSync('active_trades.json')) activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));

    let modified = false;

    // Visiem signāliem no pēdējā laikā, kam ir reply_to id
    for (const msg of signals) {
        if (!msg.text || !msg.reply_to) continue;
        
        // Pārbaudam uzrakstu "Move stoploss to" vai "move sl to"
        const txt = msg.text.toLowerCase().replace(/sl:/g, "stoploss").replace(/ /g, "");
        const match = txt.match(/movestoploss[a-z]*([0-9.]+)/i) || txt.match(/moveslto([0-9.]+)/i) || msg.text.toLowerCase().match(/move stoploss to ([0-9.]+)/) || msg.text.toLowerCase().match(/move sl to ([0-9.]+)/);

        if (match && match[1]) {
            const parsedSl = parseFloat(match[1]);

            // Pārbauda Active orderus (Kuriem ir fiksēts telegramMsgId no atvēršanas mirkļa)
            for (const [epic, trade] of Object.entries(activeTrades)) {
                
                // pagaidu hacks – ja mums NAV replyId, bet esam zeltā fāzē 1: viņš varētu auto-paķert. 
                // Bet drošāk ir izmantot message.reply_to === trade.telegramMsgId stingro pārbaudi!
                // Mūsu tikko atvērtam DIAAAAWSFFESZBA vēl nav šāda telegramMsgId, jo es to rocinīgi ieliku!
                
                if ((trade.telegramMsgId === msg.reply_to || !trade.telegramMsgId) && trade.sl !== parsedSl && epic.includes("GOLD")) {
                    trade.sl = parsedSl;
                    trade.telegramMsgId = msg.reply_to; // piesiets!
                    console.log(`🎯 [ATJAUNINĀJUMS] Pārnesu SL uz ${parsedSl} instrumentam ${epic} (balstoties uz msg ${msg.id})!`);
                    modified = true;
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log("active_trades.json atjaunināts!");
    }
}
checkUpdates();

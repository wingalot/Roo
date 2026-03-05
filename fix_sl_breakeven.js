const fs = require('fs');
let code = fs.readFileSync('sync_watcher.js', 'utf8');

const strReplacement = `
                const txt = msg.text.toLowerCase().replace(/sl:/g, "stoploss").replace(/ /g, "");
                
                // Mēģinām atrast Breakeven (BE) komandas (1. mērķis sasniegts, nes uz BE)
                if (txt.includes('stoplosstobreakeven') || txt.includes('sltobreakeven') || txt.includes('move sl to be')) {
                    // Pārbaudām Active Trades uz Breakeven pārcelšanu
                    for (const [epic, trade] of Object.entries(activeTrades)) {
                        if (trade.telegramMsgId === msg.reply_to || !trade.telegramMsgId) { // Vai arī ja mums msg id nesakrīt bet reāls Zelts, vēlams sasaistīt
                            // Breakeven === trade.entryPrice
                            if(trade.sl !== trade.entryPrice) {
                                logMsg(\`📲 TELEGRAM UPDATE saņemts: Pārcelts SL uz BREAKEVEN (\${trade.entryPrice}) instrumentam \${epic}\`);
                                trade.sl = trade.entryPrice;
                                localTradesModified = true;
                                modificationsMade = true;
                                
                                try {
                                    const { execSync } = require('child_process');
                                    execSync(\`openclaw message send --target "395239117" --channel "telegram" --message "🛡️ **StopLoss Pārcelts uz Breakeven!**\\n\\nInstruments: \${epic}\\nJaunais SL: \${trade.entryPrice}\\nPamatojums: Felix Update"\`);
                                } catch(e) {}
                            }
                        }
                    }
                }
                
                // Vecā Stoploss specifiskā numura meklēšana
                const match = txt.match(/movestoploss[a-z]*([0-9.]+)/i) || 
                              txt.match(/moveslto([0-9.]+)/i);
`;

code = code.replace(/const txt = msg.text.toLowerCase\(\)[\s\S]+?const match = txt.match\(\/movestoploss/, 'const txt = msg.text.toLowerCase().replace(/sl:/g, "stoploss").replace(/ /g, "");\n\n                // Mēģinām atrast Breakeven (BE) komandas\n                if (txt.includes(\'stoplosstobreakeven\') || txt.includes(\'sltobreakeven\') || txt.includes(\'move sl to be\') || msg.text.toLowerCase().includes(\'move stoploss to breakeven\')) {\n                    for (const [epic, trade] of Object.entries(activeTrades)) {\n                        if (trade.telegramMsgId === msg.reply_to || !trade.telegramMsgId) {\n                            if(trade.sl !== trade.entryPrice) {\n                                logMsg(`📲 TELEGRAM UPDATE saņemts: Pārcelts SL uz BREAKEVEN (${trade.entryPrice}) instrumentam ${epic}`);\n                                trade.sl = trade.entryPrice;\n                                trade.telegramMsgId = msg.reply_to; // piesiets\n                                localTradesModified = true;\n                                modificationsMade = true;\n                                \n                                try {\n                                    const { execSync } = require(\'child_process\');\n                                    execSync(`openclaw message send --target "395239117" --channel "telegram" --message "🛡️ **StopLoss Pārcelts uz Breakeven (Entry Price)!**\\n\\nInstruments: ${epic}\\nJaunais SL: ${trade.entryPrice}\\nPamatojums: Felix Update"`);\n                                } catch(e) {}\n                            }\n                        }\n                    }\n                }\n\n                const match = txt.match(/movestoploss/');

fs.writeFileSync('sync_watcher.js', code);

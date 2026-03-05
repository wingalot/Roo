const fs = require('fs');

const path = 'sync_watcher.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/execSync\(`openclaw message send --target "395239117" --channel "telegram" --message "🛡️ \*\*StopLoss Pārcelts uz Breakeven \(Entry Price\)!.*\n\nInstruments: \${epic}\\nJaunais SL: \${trade\.entryPrice}\\nPamatojums: Felix Update"`\);/g, '// Paziņojums izslēgts');
content = content.replace(/execSync\(`openclaw message send --target "395239117" --channel "telegram" --message "🔄 \*\*StopLoss Automātiski Pārcelts!.*\n\nInstruments: \${epic}\\nJaunais SL: \${parsedSl}\\nPamatojums: Saņemts atjauninājums no Felix"`\);/g, '// Paziņojums izslēgts');
content = content.replace(/execSync\(`openclaw message send --target "395239117" --channel "telegram" --message "🔄 \*\*Limit Orderim StopLoss Pārcelts!.*\n\nInstruments: \${pData\.epic}\\nJaunais SL: \${parsedSl}"`\);/g, '// Paziņojums izslēgts');

// We also need to add a processed flag to the signals to not re-process them.
// A simpler way: just disable the notifications in sync_watcher.
// The issue is it's processing the signal again and again because it uses msg_reply_to and tests "sl !== parsedSl". Wait, if it sets `trade.sl = parsedSl`, the next time `trade.sl !== parsedSl` is false, so it shouldn't trigger!

fs.writeFileSync(path, content, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('sync_watcher.js', 'utf8');

// Replace the Breakeven execSync directly by finding the string
code = code.replace(/execSync\(`openclaw message send --target "395239117" --channel "telegram" --message "🛡️ \*\*StopLoss Pārcelts uz Breakeven \(Entry Price\)!\\n\\nInstruments: \${epic}\\nJaunais SL: \${trade\.entryPrice}\\nPamatojums: Felix Update"`\);/g, '// Paziņojums izslēgts');
code = code.replace(/execSync\(`openclaw message send --target "395239117" --channel "telegram" --message "🔄 \*\*StopLoss Automātiski Pārcelts!\\n\\nInstruments: \${epic}\\nJaunais SL: \${parsedSl}\\nPamatojums: Saņemts atjauninājums no Felix"`\);/g, '// Paziņojums izslēgts');
code = code.replace(/execSync\(`openclaw message send --target "395239117" --channel "telegram" --message "🔄 \*\*Limit Orderim StopLoss Pārcelts!\\n\\nInstruments: \${pData\.epic}\\nJaunais SL: \${parsedSl}"`\);/g, '// Paziņojums izslēgts');

// Ensure that we also only apply BE if trade.sl !== trade.entryPrice (it already does, but we shouldn't keep overwriting it and causing modificationsMade=true which triggers writeFileSync constantly)
fs.writeFileSync('sync_watcher.js', code);
console.log("Patched sync_watcher.js");

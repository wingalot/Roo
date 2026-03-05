const fs = require('fs');
let code = fs.readFileSync('sync_watcher.js', 'utf8');
code = code.replace(/console\.log\(`✅ Pievienoju... Paziņoju Telegramam.`\);/g, 'console.log(`✅ Pievienoju... Paziņoju sistēmai (Telegram notifications disabled)`);');
fs.writeFileSync('sync_watcher.js', code);

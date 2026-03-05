const fs = require('fs');
let content = fs.readFileSync('sync_watcher.js', 'utf8');
content = content.replace(/execSync\(`openclaw message send --target "395239117".*?\);/g, '// Paziņojums izdzēsts un apklusināts');
fs.writeFileSync('sync_watcher.js', content);
console.log("Deleted notification lines.");

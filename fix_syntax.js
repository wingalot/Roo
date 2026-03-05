const fs = require('fs');
let fileStr = fs.readFileSync('signal_router.js', 'utf8');

fileStr = fileStr.replaceAll('signal.text.match(/(BUY|SELL)s+LIMITs+([A-Z]+)s+([0-9.]+)/i)', 'signal.text.match(/(BUY|SELL)\\s+LIMIT\\s+([A-Z]+)\\s+([0-9.]+)/i)');
fileStr = fileStr.replaceAll('signal.text.match(/(BUY|SELL)s+([A-Z]+)s+([0-9.]+)/i)', 'signal.text.match(/(BUY|SELL)\\s+([A-Z]+)\\s+([0-9.]+)/i)');

fs.writeFileSync('signal_router.js', fileStr);

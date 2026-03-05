const fs = require('fs');
fs.writeFileSync('active_trades.json', JSON.stringify([]));
console.log('Cleared trades json');

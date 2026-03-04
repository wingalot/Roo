const fs = require('fs');
let activeTrades = JSON.parse(fs.readFileSync('active_trades.json'));
let newTrades = {};
for(const k in activeTrades) {
  if(!k.includes('_SIM')) newTrades[k] = activeTrades[k];
}
fs.writeFileSync('active_trades.json', JSON.stringify(newTrades, null, 2));

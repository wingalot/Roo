const fs = require('fs');
let activeTrades = JSON.parse(fs.readFileSync('active_trades.json'));

let newTrades = {};
// Patiesie, kas tagad palika uz IG:
const allowed = ['DIAAAAWR6NCWXAK', 'DIAAAAWR6NAVLBG'];

for(const k in activeTrades) {
    if(allowed.includes(activeTrades[k].dealId)) {
        newTrades[k] = activeTrades[k];
    }
}
fs.writeFileSync('active_trades.json', JSON.stringify(newTrades, null, 2));

const fs = require('fs');
let str = fs.readFileSync('signal_router.js', 'utf8');
str = str.replace(
/let activeTrades = {};[\s\S]*?const tradeKey = epic;\s*activeTrades\[tradeKey\] = /g,
`let activeTrades = [];
                if (fs.existsSync('active_trades.json')) {
                    try {
                        activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
                        if (!Array.isArray(activeTrades)) {
                            // conver to array if it is object natively
                            activeTrades = Object.values(activeTrades);
                        }
                    } catch(e) {}
                }
                
                activeTrades.push(`
);
fs.writeFileSync('signal_router.js', str);
console.log("Re-applied Array fix properly.");

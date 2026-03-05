const fs = require('fs');

let fileStr = fs.readFileSync('signal_router.js', 'utf8');

// Replace the active_trades update logic with an array-based one.
fileStr = fileStr.replace(
/let activeTrades = {};\s*if \(fs\.existsSync\('active_trades\.json'\)\) {\s*activeTrades = JSON\.parse\(fs\.readFileSync\('active_trades\.json', 'utf8'\)\);\s*}\s*const tradeKey = epic;\s*activeTrades\[tradeKey\] = {([\s\S]*?)};\s*fs\.writeFileSync\('active_trades\.json', JSON\.stringify\(activeTrades, null, 2\)\);/g,
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
                
                activeTrades.push({$1});
                
                fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));`
);

fs.writeFileSync('signal_router.js', fileStr);
console.log("Fixed Array format");

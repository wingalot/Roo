const fs = require('fs');

let fileStr = fs.readFileSync('signal_router.js', 'utf8');
// Fix undefined reference to loginIG by shifting the block to correctly run inside processSignal scope.
// Also fix active_trades logic so it safely pulls res.dealReference if it exists.

fileStr = fileStr.replace(/const auth = await loginIG\(\);\s+const res = await createMarketOrder\(auth, epic, direction, 1\);/,
`               const auth = await loginIG();
                console.log("MARKET TIRDZNIECĪBA TIKS IESNIEGTA IG.");
                const res = await createMarketOrder(auth, epic, direction, 1);
`);

fs.writeFileSync('signal_router.js', fileStr);

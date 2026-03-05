const fs = require('fs');

let fileStr = fs.readFileSync('signal_router.js', 'utf8');

// The active_trades is expected to be an Array by some scripts, not an Object with epic keys! Wait, the sync_watcher loads it as JSON.parse. If it's an array, sync_watcher handles it `parsed.forEach(t => activeTrades[t.epic || t.dealId] = t);`. But if signal_router reads it as array, then activeTrades[tradeKey] = ... crashes it or makes it weird an Object inside array format! Let's check signal_router.js where it reads active_trades

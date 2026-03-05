const fs = require('fs');

let fileStr = fs.readFileSync('signal_router.js', 'utf8');

// The code sets activeTrades[epic] = { ..., dealId: res.dealReference } instead of dealReference maybe?
fileStr = fileStr.replace(/dealReference: res\.dealReference/, "dealId: res.dealReference");

fs.writeFileSync('signal_router.js', fileStr);

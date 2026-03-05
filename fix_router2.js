const fs = require('fs');
let code = fs.readFileSync('signal_router.js', 'utf8');

// The replacement was partially wrong because of scope issues inside the try block (dealReference, etc).
// We need to fix the deal reference object destructuring.

code = code.replace(
    /\/\/ Mēs taisām size 1 kā baseline, vēlāk to var piesaistīt risk\/SL\. \s*const res = await createMarketOrder\(auth, epic, direction, 1\);\s*console\.log\("MARKET TIRDZNIECĪBA IESNIEGTA IG\. Deal:", res\.dealReference\);([\s\S]*?)dealReference: res\.dealReference/,
`// Mēs taisām size 1 kā baseline, vēlāk to var piesaistīt risk/SL. 
                const res = await createMarketOrder(auth, epic, direction, 1);
                
                console.log("MARKET TIRDZNIECĪBA IESNIEGTA IG. Deal:", res.dealReference);
$1dealReference: res.dealReference`
);

fs.writeFileSync('signal_router.js', code);

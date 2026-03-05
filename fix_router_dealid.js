const fs = require('fs');

let code = fs.readFileSync('signal_router.js', 'utf8');
// Izlabojam dealId: res.dealReference (kas atgriež pagaidu reference) uz reālo IG dealId paņemšanu vai palikšanu reference, ja sinhronizators nespēj atrast pašu dealID. 
// Ah, the sync_watcher looks at `dealId`, and if it's the `dealReference` it won't match the `dealId` that IG positions endpoint returns (DIAAAAWSTEPGLA7).
// Let's modify signal_router.js to actively query the confirm endpoint to get the real dealId before saving!

code = code.replace(/console\.log\("MARKET TIRDZNIECĪBA IESNIEGTA IG\. Deal:", res\.dealReference\);/g,
`console.log("MARKET TIRDZNIECĪBA IESNIEGTA IG. DealRef:", res.dealReference);
                
                // Pagaidām dažas sekundes, lai IG apstrādā orderi un iedod īsto Deal ID (kas sākas ar DIAAAA...)
                await new Promise(r => setTimeout(r, 2000));
                
                let realDealId = res.dealReference;
                try {
                    const confRes = await axios.get(\`\${process.env.IG_API_URL}/confirms/\${res.dealReference}\`, {
                        headers: { 
                            'X-IG-API-KEY': process.env.IG_API_KEY, 
                            'CST': auth.cst, 
                            'X-SECURITY-TOKEN': auth.secToken, 
                            'Version': '1' 
                        }
                    });
                    if (confRes.data && confRes.data.dealId) {
                        realDealId = confRes.data.dealId;
                        console.log("Izgūts reālais Deal ID: " + realDealId);
                    }
                } catch(e) { console.log("Neizdevās iegūt īsto dealId, izmantosim reference"); }
`
);

code = code.replace(/dealId: res\.dealReference/g, 'dealId: realDealId'); // Replace the hardcoded res.dealReference with the realDealId we fetched

fs.writeFileSync('signal_router.js', code);
console.log("Fixed deal ID issue mapping from Reference to real dealId.");

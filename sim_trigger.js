const { processSignal } = require('./signal_router.js');

// 10 izplatītākie "Felix" un ikdienas Forex testēšanas signāli
const signals = [
  { id: 'Tsim1', text: 'BUY EURUSD @ 1.0500\nSL 1.0450\nTP1 1.0550\nTP2 1.0600', reply_to_msg_id: null },
  { id: 'Tsim2', text: 'SELL GBPJPY @ 195.00\nSL 196.00\nTP1 194.00\nTP2 193.00', reply_to_msg_id: null },
  { id: 'Tsim3', text: 'BUY LIMIT AUDUSD @ 0.6500\nSL 0.6450\nTP1 0.6550\nTP2 0.6600', reply_to_msg_id: null },
  { id: 'Tsim4', text: 'SELL LIMIT USDCAD @ 1.3500\nSL 1.3550\nTP1 1.3450\nTP2 1.3400', reply_to_msg_id: null },
  { id: 'Tsim5', text: 'BUY XAUUSD @ 2300.00\nSL 2290.00\nTP1 2310.00\nTP2 2320.00', reply_to_msg_id: null },
  { id: 'Tsim6', text: 'SELL NZDUSD @ 0.6000\nSL 0.6050\nTP1 0.5950\nTP2 0.5900', reply_to_msg_id: null },
  { id: 'Tsim7', text: 'BUY LIMIT EURGBP @ 0.8500\nSL 0.8450\nTP1 0.8550\nTP2 0.8600', reply_to_msg_id: null },
  { id: 'Tsim8', text: 'SELL LIMIT USDJPY @ 150.00\nSL 151.00\nTP1 149.00\nTP2 148.00', reply_to_msg_id: null },
  { id: 'Tsim9', text: 'BUY EURJPY @ 160.00\nSL 159.00\nTP1 161.00\nTP2 162.00', reply_to_msg_id: null },
  { id: 'Tsim10', text: 'SELL LIMIT AUDCAD @ 0.9000\nSL 0.9050\nTP1 0.8950\nTP2 0.8900', reply_to_msg_id: null },
  // Papildus testējams rets formāts un slēgšana
  { id: 'Tsim11', text: '⭐️ USDCHF ⭐️\n📈 BUY NOW: 0.8870\n⛔ STOP LOSS: 0.8830', reply_to_msg_id: null }
];

async function run() {
    for (let s of signals) {
        console.log(`\n--- TESTING ${s.id} ---`);
        await processSignal(s);
        // Pauze starp simulētiem orderiem lai brokeris nenoķer rate limit
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("TESTING COMPLETE");
    process.exit(0);
}
run();

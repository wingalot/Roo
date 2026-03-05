require('dotenv').config();
const fs = require('fs');

if (fs.existsSync('latest_signals.json')) {
    let arr = JSON.parse(fs.readFileSync('latest_signals.json'));
    
    // Create a fake LIMIT signal
    arr.unshift({
        id: 99999,
        text: "SIGNAL ALERT\n\nBUY LIMIT GBPUSD 1.2500\n\n🤑TP1: 1.2520\n🔴SL: 1.2400 (100 pips)",
        timestamp: new Date().toISOString(),
        reply_to: null
    });
    fs.writeFileSync('latest_signals.json', JSON.stringify(arr, null, 2));
    console.log("Injected fake LIMIT GBPUSD signal to test limit order syntax!!");
}

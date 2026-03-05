const fs = require('fs');

if (fs.existsSync('processed_signals.json')) {
    let arr = JSON.parse(fs.readFileSync('processed_signals.json'));
    // Let's trigger a single signal we know: 8463 GBPUSD BUY
    arr = arr.filter(id => id !== 8463);
    fs.writeFileSync('processed_signals.json', JSON.stringify(arr));
    console.log("Restored signal 8463 to test MARKET ORDER LOGIC!");
}

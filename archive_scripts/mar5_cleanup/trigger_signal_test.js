const fs = require('fs');

if (fs.existsSync('processed_signals.json')) {
    let arr = JSON.parse(fs.readFileSync('processed_signals.json'));
    // Let's trigger a single signal we know: 8496 or 8493
    arr = arr.filter(id => id !== 8496 && id !== 8493 && id !== 8490);
    fs.writeFileSync('processed_signals.json', JSON.stringify(arr));
    console.log("Restored signal 8496, 8493 and 8490 to test MARKET ORDER LOGIC!");
}

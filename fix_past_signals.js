const fs = require('fs');

if (fs.existsSync('processed_signals.json')) {
    // let's remove the test processed signals from our array just to trigger the very last signal and verify
    let arr = JSON.parse(fs.readFileSync('processed_signals.json'));
    // 8464 was GBPJPY BUY
    arr = arr.filter(id => id !== 8464);
    fs.writeFileSync('processed_signals.json', JSON.stringify(arr));
    console.log("Restored signal 8464 to test logic!");
}

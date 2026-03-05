const fs = require('fs');

if (fs.existsSync('processed_signals.json')) {
    let arr = JSON.parse(fs.readFileSync('processed_signals.json'));
    // let's try GBPUSD LIMIT dummy again
    arr = arr.filter(id => id !== 99999);
    fs.writeFileSync('processed_signals.json', JSON.stringify(arr));
    console.log("Restored signal 99999 to test logic!");
}

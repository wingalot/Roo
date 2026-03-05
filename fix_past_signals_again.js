const fs = require('fs');
let arr = JSON.parse(fs.readFileSync('processed_signals.json'));
arr = arr.filter(id => id !== 99999);
fs.writeFileSync('processed_signals.json', JSON.stringify(arr));
console.log("Restored signal 99999 again!");

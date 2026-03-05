const fs = require('fs');
let code = fs.readFileSync('close_gbpjpy.js', 'utf8');
code = code.replace(/size: 0\.1/, "size: 1");
fs.writeFileSync('close_gbpjpy.js', code);

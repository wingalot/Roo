const fs = require('fs');

const lines = fs.readFileSync('signal_router.js', 'utf8').split('\n');
let count = 0;
for(let i=0; i<lines.length; i++) {
    for(let c=0; c<lines[i].length; c++) {
        if(lines[i][c] === '{') count++;
        if(lines[i][c] === '}') count--;
    }
    if(count < 0) { console.log("Missing { at ", i+1); break; }
}
console.log("Final balance:", count);

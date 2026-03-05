const fs = require('fs');

try {
    new Function(fs.readFileSync('signal_router.js', 'utf8'));
    console.log("No syntax errors");
} catch(e) {
    if (e instanceof SyntaxError) {
        console.error(e.message, Object.keys(e));
        // let's run esprima
    }
}

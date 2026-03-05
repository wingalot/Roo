const fs = require('fs');

let code = fs.readFileSync('signal_router.js', 'utf8');
code = code.replace(
/if\(match\) \{\s*isLimit = true;\s*\} else \{\s*match = signal\.text\.match\(\/\(BUY\|SELL\)\\s\+\(\[A-Z\]\+\)\\s\+\(\[0-9\.\]\+\)\/i\);\s*\}/,
`if(match) {
        isLimit = true;
    } else {
        match = signal.text.match(/(BUY|SELL)\\s+([A-Z]+)\\s+([0-9.]+)/i);
    }
`
);
fs.writeFileSync('signal_router.js', code);

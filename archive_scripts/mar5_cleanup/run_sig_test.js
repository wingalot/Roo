const fs = require('fs');
const PROCESSED_FILE = 'processed_signals.json';
const SIGNALS_FILE = 'latest_signals.json';

let processedIds = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));

let match = false;
try {
    const signals = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
    for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        if (sig.id && !processedIds.includes(sig.id)) {
            console.log(`FOUND UNPROCESSED: ${sig.id}`);
            match = true;
        }
    }
} catch (e) {
    console.error(e);
}
if(!match) console.log("NO UNPROCESSED SIGNALS FOUND");

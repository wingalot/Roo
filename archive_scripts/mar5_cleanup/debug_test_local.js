const regex1 = /(BUY|SELL)\s*([A-Za-z\@\s\*]*)(LIMIT|STOP)?[\s\*@]*([A-Z]{6})[\s\*@A-Za-z:-]*([0-9.]+)/i;
const regex2 = /([A-Z]{6})\s+(BUY|SELL)\s+([A-Za-z\@\s\*]*)(LIMIT|STOP)?[\s\*@]*([0-9.]+)/i;

const signals = require('./latest_signals.json');
const signal = signals[0];

console.log("TESTING: ", signal.text);
let match = signal.text.match(regex1) || signal.text.match(regex2);
console.log("MATCH: ", match);

if (match && !signal.text.toLowerCase().includes('cancel') && !signal.text.toLowerCase().includes('hit')) {
    console.log("Matches secondary condition!");
} else {
    console.log("Fails secondary condition");
}

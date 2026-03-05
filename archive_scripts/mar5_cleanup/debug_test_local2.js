const regex1 = /(BUY|SELL)\s*([A-Za-z\@\s\*]*)(LIMIT|STOP)?[\s\*@]*([A-Z]{6})[\s\*@A-Za-z:-]*([0-9.]+)/i;
const regex2 = /([A-Z]{6})\s+(BUY|SELL)\s+([A-Za-z\@\s\*]*)(LIMIT|STOP)?[\s\*@]*([0-9.]+)/i;

let match = "EURUSD BUY NOW 1.16367\nSet SL 15 Pips".match(regex1) || "EURUSD BUY NOW 1.16367\nSet SL 15 Pips".match(regex2);
let pair, direction, price;

if(match[0].match(/^[A-Z]{6}/i)) {
    pair = match[1].toUpperCase();
    direction = match[2].toUpperCase();
    price = parseFloat(match[5]);
} else {
    direction = match[1].toUpperCase();
    pair = match[4].toUpperCase();
    price = parseFloat(match[5]);
}

console.log(pair, direction, price);

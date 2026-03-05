const signals = [
  "BUY EURUSD @ 1.0500",
  "SELL GBPJPY @ 195.00",
  "BUY LIMIT AUDUSD @ 0.6500",
  "SELL LIMIT USDCAD @ 1.3500",
  "BUY XAUUSD @ 2300.00",
  "SELL NZDUSD @ 0.6000",
  "BUY LIMIT EURGBP @ 0.8500",
  "SELL LIMIT USDJPY @ 150.00",
  "BUY EURJPY @ 160.00",
  "SELL LIMIT AUDCAD @ 0.9000",
  "⭐️ USDCHF ⭐️\n📈 BUY NOW: 0.8870\n⛔ STOP LOSS: 0.8830"
];

const regex1 = /(BUY|SELL)\s*([A-Za-z\@\s\*]*)(LIMIT|STOP)?[\s\*@]*([A-Z]{4,6})[\s\*@A-Za-z:-]*([0-9.]+)/i;
const regex2 = /([A-Z]{4,6})\s+(BUY|SELL)\s+([A-Za-z\@\s\*]*)(LIMIT|STOP)?[\s\*@]*([0-9.]+)/i;

signals.forEach(text => {
  let match = text.match(regex1) || text.match(regex2);
  console.log(`Text: ${text}`);
  if (match) {
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
    console.log(`-> Direction: ${direction}, Pair: ${pair}, Price: ${price}`);
  } else {
    console.log("-> NO MATCH");
  }
});

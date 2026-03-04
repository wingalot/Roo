const fs = require('fs');

let signals = [];
if (fs.existsSync('latest_signals.json')) {
    signals = JSON.parse(fs.readFileSync('latest_signals.json', 'utf8'));
}

// Format the date properly like telegram_listener does with timestamp
const dateString = new Date().toISOString().substring(0,10);
const timeString = new Date().toLocaleTimeString('lv-LV', { timeZone: 'Europe/Riga', hour12: false });
const formattedTime = dateString + ' ' + timeString + ' GMT+2';

if(signals.length > 0) {
    signals[0].time = formattedTime; 
    signals[0].text = "#EURUSD BUY NOW 1.16367\nSet SL 15 Pips";
} else {
    signals.unshift({
        time: formattedTime,
        text: "#EURUSD BUY NOW 1.16367\nSet SL 15 Pips",
        isNew: true
    });
}
fs.writeFileSync('latest_signals.json', JSON.stringify(signals, null, 2));

console.log("Datums fiksēts:", formattedTime);

const fs = require('fs');

const mockSignals = [
    {
        id: 10001,
        text: "**BUY XAUUSD 2950.0**\nSL: 2940.0\nTP1: 2960.0",
        timestamp: new Date().toISOString()
    },
    {
        id: 10002,
        text: "SELL LIMIT GBPUSD @ 1.2500\nSL: 1.2600\nTP1: 1.2400",
        timestamp: new Date().toISOString()
    },
    {
        id: 10003,
        text: "**🔴**** BUY EURUSD @ 1.0800**\nSL: 1.0750\n🤑TP1: 1.0850",
        timestamp: new Date().toISOString()
    },
    {
        id: 10004,
        text: "SELL EURAUD 1.6500\nSL: 1.6600\nTP1: 1.6400",
        timestamp: new Date().toISOString()
    },
    {
        // Nestandarta / netīrs formāts - pārbaudīsim vai regex tiks galā ar vārdiem starp pāri un cenu
        id: 10005,
        text: "🚨 BUY LIMIT GBPJPY entry: 190.50 🚀\nSL: 189.00\nTP1: 191.00",
        timestamp: new Date().toISOString()
    }
];

let currentSignals = [];
if (fs.existsSync('latest_signals.json')) {
    try {
        currentSignals = JSON.parse(fs.readFileSync('latest_signals.json', 'utf8'));
    } catch(e){}
}

// Ieliekam mock signālus sākumā
currentSignals = [...mockSignals.reverse(), ...currentSignals].slice(0, 20);

fs.writeFileSync('latest_signals.json', JSON.stringify(currentSignals, null, 4));
console.log("Mock signāli veiksmīgi ielādēti latest_signals.json failā!");

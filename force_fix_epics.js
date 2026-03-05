const fs = require('fs');
let code = fs.readFileSync('signal_router.js', 'utf8');

const regexToReplace = /else if \(pair === 'GBPJPY'\) epic = 'CS\.D\.GBPJPY\.CFD\.IP';\s*else if \(pair === 'EURUSD'\) epic = 'CS\.D\.EURUSD\.CFD\.IP';\s*else if \(pair === 'EURAUD'\) epic = 'CS\.D\.EURAUD\.CFD\.IP';\s*else if \(pair === 'EURJPY'\) epic = 'CS\.D\.EURJPY\.CFD\.IP';\s*else if \(pair === 'BTCUSD'\) epic = 'CS\.D\.BITCOIN\.CFD\.IP';\s*else console\.log\(\`⚠️ Nezināms pāris: \$\{pair\}\`\);/g;

code = code.replace(regexToReplace, "else if (pair === 'BTCUSD') epic = 'CS.D.BITCOIN.CFD.IP'; else epic = `CS.D.${pair}.CFD.IP`; // Dinamiskā Epic piešķiršana testam");

fs.writeFileSync('signal_router.js', code);
console.log('Force Fixed Epics RegExp Replace');

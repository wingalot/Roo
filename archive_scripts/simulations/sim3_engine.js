const fs = require('fs');
let act = JSON.parse(fs.readFileSync('active_trades.json'));

let htmlLog = "";

function stepPrice(epicKey, currentPrice) {
    let trade = act[epicKey];
    if(!trade) return;
    
    htmlLog += `\n[${trade.dealType} ${trade.direction} ${epicKey.split('_SIM')[0]}] Simulētā cena: ${currentPrice}\n`;

    // Ja limits - pārbaudam order fill
    if(trade.dealType === 'LIMIT' && trade.status === 'PENDING') {
      if(trade.direction === 'BUY' && currentPrice <= trade.tp1 - 0.01) { trade.status = 'PHASE_1'; htmlLog += `✅ LIMIT BUY IZPILDĪTS!\n`; }
      if(trade.direction === 'SELL' && currentPrice >= trade.tp1 + 0.01) { trade.status = 'PHASE_1'; htmlLog += `✅ LIMIT SELL IZPILDĪTS!\n`; }
    }

    if (trade.status === 'PHASE_1') {
        // Stop Loss check
        if(trade.direction === 'BUY' && currentPrice <= trade.sl) { htmlLog += `🚨 SL IZGĀZA: - Zaudējums fiksēts\n`; delete act[epicKey]; return; }
        if(trade.direction === 'SELL' && currentPrice >= trade.sl) { htmlLog += `🚨 SL IZGĀZA: - Zaudējums fiksēts\n`; delete act[epicKey]; return; }

        // TP1 un TP2 check
        if (trade.direction === 'BUY' && currentPrice >= trade.tp2) {
            htmlLog += `🔥 TP2 SASNIEGTS (${currentPrice})! Pārslēdzu lokālo Trailing uz TP1 (${trade.tp1}).\n`;
            trade.status = 'PHASE_2';
            trade.sl = trade.tp1; // Pārslēdzas uz TP1
        } 
        else if (trade.direction === 'SELL' && currentPrice <= trade.tp2) {
            htmlLog += `🔥 TP2 SASNIEGTS (${currentPrice})! Pārslēdzu lokālo Trailing uz TP1 (${trade.tp1}).\n`;
            trade.status = 'PHASE_2';
            trade.sl = trade.tp1; // Pārslēdzas uz TP1
        }
        else if (trade.direction === 'BUY' && currentPrice >= trade.tp1) {
            htmlLog += `✅ TP1 Sasniegts! Gaidu TP2.\n`;
        }
        else if (trade.direction === 'SELL' && currentPrice <= trade.tp1) {
            htmlLog += `✅ TP1 Sasniegts! Gaidu TP2.\n`;
        }
    } 
    else if (trade.status === 'PHASE_2') {
        if (trade.direction === 'BUY') {
            if (currentPrice >= trade.tp3) {
                 htmlLog += `💰 TP3 SASNIEGTS - Pilna Peļņa nofiksēta! (Aizveru)\n`; delete act[epicKey];
            } else if (currentPrice <= (trade.tp2 - trade.fallbackDistance)) {
                 htmlLog += `🛡️ 10% KRITUMS ZEM TP2 - Lokālais Trailing TP izsists! (Aizveru)\n`; delete act[epicKey];
            }
        } 
        else if (trade.direction === 'SELL') {
            if (currentPrice <= trade.tp3) {
                 htmlLog += `💰 TP3 SASNIEGTS - Pilna Peļņa nofiksēta! (Aizveru)\n`; delete act[epicKey];
            } else if (currentPrice >= (trade.tp2 + trade.fallbackDistance)) {
                 htmlLog += `🛡️ 10% KĀPUMS VIRS TP2 - Lokālais Trailing TP izsists! (Aizveru)\n`; delete act[epicKey];
            }
        }
    }
}

// Simulējam cenas:
// 1. EURUSD BUY: sasniedz TP1 un nokrīt uz SL
stepPrice('CS.D.EURUSD.CFD.IP_SIM_0', 1.09); // starta zona
stepPrice('CS.D.EURUSD.CFD.IP_SIM_0', 1.101); // aizsit TP1
stepPrice('CS.D.EURUSD.CFD.IP_SIM_0', 1.07);  // izsit SL

// 2. GBPUSD SELL: sasniedz TP2 un nofiksējas 10% pullback (TP1 trailing)
stepPrice('CS.D.GBPUSD.CFD.IP_SIM_1', 1.244); // aizsit TP2 (1.245)
stepPrice('CS.D.GBPUSD.CFD.IP_SIM_1', 1.246); // uzkāpj virs (tp2 + 10% buffers = 1.2455) -> slēdzas

// 3. GOLD BUY (SIM_2): 2050 -> 2060 -> 2075 (TP3)
stepPrice('CS.D.CFDGOLD.CFDGC.IP_SIM_2', 2051); // TP1
stepPrice('CS.D.CFDGOLD.CFDGC.IP_SIM_2', 2061); // TP2
stepPrice('CS.D.CFDGOLD.CFDGC.IP_SIM_2', 2076); // TP3

// 4. US30 SELL (SIM_3): 38500 -> 38300 -> 38000
stepPrice('IX.D.DOW.DAILY.IP_SIM_3', 38200); // Sit pušu TP2 (38300) uzreiz 
stepPrice('IX.D.DOW.DAILY.IP_SIM_3', 37900); // Sit pušu TP3 uzreiz

// 5. EURUSD SELL LIMIT (SIM_8) pildās un aiziet uz TP3
stepPrice('CS.D.EURUSD.CFD.IP_SIM_8', 1.07); // limits bija BUY @ 1.05
stepPrice('CS.D.EURUSD.CFD.IP_SIM_8', 1.04); // pildās BUY
stepPrice('CS.D.EURUSD.CFD.IP_SIM_8', 1.071); // tp3

console.log(htmlLog);

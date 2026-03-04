// Papildinājums trading_engine.js failam: Orderu atvēršanas un aizvēršanas REST API loģika.
// Šīs funkcijas ir izmantojamas caur Roo (AI) komandām vai iekšēji.
const axios = require('axios');

async function createMarketOrder(authData, epic, direction, size) {
    console.log(`🚀 Sūtu atvērt MARKET orderi: ${direction} ${size} lotes uz ${epic}...`);
    try {
        const response = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            epic: epic,
            expiry: "-",
            direction: direction,
            size: size,
            orderType: "MARKET",
            timeInForce: "EXECUTE_AND_ELIMINATE",
            guaranteedStop: false,
            currencyCode: "USD",
            // Nonemam default currency 
            currencyCode: "USD",
            forceOpen: true
        }, {
            headers: { 
                'X-IG-API-KEY': process.env.IG_API_KEY, 
                'CST': authData.cst, 
                'X-SECURITY-TOKEN': authData.secToken, 
                'Version': '2',
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Orderis Atvērts! DealReference: ${response.data.dealReference}`);
        return response.data;
    } catch (err) {
        console.error("❌ Kļūda atverot orderi:", err.response ? JSON.stringify(err.response.data) : err.message);
        throw err;
    }
}

async function createLimitOrder(authData, epic, direction, size, limitPrice) {
    console.log(`⏱️ Sūtu atvērt LIMIT orderi: ${direction} ${size} lotes uz ${epic} mērķējot uz ${limitPrice}...`);
    try {
        const response = await axios.post(`${process.env.IG_API_URL}/workingorders/otc`, {
            epic: epic,
            expiry: "-",
            direction: direction,
            size: size,
            level: limitPrice,
            type: "LIMIT",
            timeInForce: "GOOD_TILL_CANCELLED",
            guaranteedStop: false,
            currencyCode: "USD"
            // Nav currency auto force
        }, {
            headers: { 
                'X-IG-API-KEY': process.env.IG_API_KEY, 
                'CST': authData.cst, 
                'X-SECURITY-TOKEN': authData.secToken, 
                'Version': '2',
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Limit Orderis Reģistrēts! DealReference: ${response.data.dealReference}`);
        return response.data;
    } catch (err) {
        console.error("❌ Kļūda atverot limit orderi:", err.response ? JSON.stringify(err.response.data) : err.message);
        throw err;
    }
}

async function closePositionAPI(authData, dealId, epic, direction, size) {
    console.log(`🛑 Slēdzu reālo pozīciju IG platformā (Deal ID: ${dealId})...`);
    // Lai aizvērtu, virziens jāpagriež otrādi
    const closeDirection = direction === "BUY" ? "SELL" : "BUY";
    try {
        const response = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            dealId: dealId,
            epic: epic,
            expiry: "-",
            direction: closeDirection,
            size: size,
            orderType: "MARKET",
            timeInForce: "EXECUTE_AND_ELIMINATE"
        }, {
            headers: { 
                'X-IG-API-KEY': process.env.IG_API_KEY, 
                'CST': authData.cst, 
                'X-SECURITY-TOKEN': authData.secToken, 
                'X-HTTP-Method-Override': 'DELETE', 
                '_method': 'DELETE', // Fallback
                'Version': '1',
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Pozīcija sekmīgi aizvērta IG platformā!`);
        return true;
    } catch (err) {
        console.error("❌ Kļūda aizverot orderi:", err.response ? JSON.stringify(err.response.data) : err.message);
        return false;
    }
}

module.exports = {
    createMarketOrder,
    createLimitOrder,
    closePositionAPI
};
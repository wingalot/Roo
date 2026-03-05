// Papildinājums trading_engine.js failam: Orderu atvēršanas un aizvēršanas REST API loģika.
// Šīs funkcijas ir izmantojamas caur Roo (AI) komandām vai iekšēji.
const axios = require('axios');

async function createMarketOrder(authData, epic, direction, size) {
    console.log(`🚀 Sūtu atvērt MARKET orderi: ${direction} ${size} lotes uz ${epic}...`);
    
    // Auto-detect currency based on EPIC
    let currencyCode = "USD";
    if (epic.includes("JPY")) currencyCode = "JPY";
    else if (epic.includes("AUD")) currencyCode = "AUD";
    else if (epic.includes("GBP") && !epic.includes("GBPUSD")) currencyCode = "GBP"; // EURGBP
    else if (epic.includes("EUR") && !epic.includes("EURUSD") && !epic.includes("EURAUD") && !epic.includes("EURGBP")) currencyCode = "EUR"; 
    
    try {
        const response = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            epic: epic,
            expiry: "-",
            direction: direction,
            size: size,
            orderType: "MARKET",
            timeInForce: "EXECUTE_AND_ELIMINATE",
            guaranteedStop: false,
            forceOpen: true,
            currencyCode: currencyCode
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

    let currencyCode = "USD";
    if (epic.includes("JPY")) currencyCode = "JPY";
    else if (epic.includes("AUD")) currencyCode = "AUD";
    else if (epic.includes("GBP") && !epic.includes("GBPUSD")) currencyCode = "GBP"; 
    else if (epic.includes("EUR") && !epic.includes("EURUSD") && !epic.includes("EURAUD") && !epic.includes("EURGBP")) currencyCode = "EUR"; 

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
            forceOpen: true,
            currencyCode: currencyCode
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

async function closePositionAPI(authData, dealId, epic, originalDirection, originalSize) {
    console.log(`🛑 Slēdzu reālo pozīciju IG platformā (Deal ID: ${dealId})...`);
    // Lai aizvērtu, virziens jāpagriež otrādi un jābūt precīzam size
    const closeDirection = originalDirection === "BUY" ? "SELL" : "BUY";
    // Automātiska pārliecināšanās, ka mēs pasniedzam pareizo formātu decimāldaļās (piem. 0.1) String vai float
    const exactSize = typeof originalSize === "string" ? parseFloat(originalSize) : originalSize;
    // Papildus: ja "size" netiek izvilkts no originalSize kā objekts
    const closeSize = originalSize.size ? originalSize.size : exactSize;
    try {
        const response = await axios.post(`${process.env.IG_API_URL}/positions/otc`, {
            dealId: dealId,
            direction: closeDirection,
            size: parseFloat(exactSize),
            orderType: "MARKET"
        }, {
            headers: { 
                'X-IG-API-KEY': process.env.IG_API_KEY, 
                'CST': authData.cst, 
                'X-SECURITY-TOKEN': authData.secToken, 
                '_method': 'DELETE',
                'Version': '1',
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Pozīcija sekmīgi aizvērta IG platformā! (DealRef: ${response.data.dealReference})`);
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
const fs = require('fs');

const { createLimitOrder } = require('./ig_rest_api');
// mēs fiksēsim ig_rest_api lai limitos arī tiktu likts currencyCode
const code = fs.readFileSync('ig_rest_api.js', 'utf8');
const fixedCode = code.replace(
    /type: 'LIMIT',\s+epic/g,
    `type: 'LIMIT',\n            currencyCode: process.env.IG_CURRENCY || 'USD',\n            epic`
);
fs.writeFileSync('ig_rest_api.js', fixedCode);


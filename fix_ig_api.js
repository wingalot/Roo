const fs = require('fs');
let code = fs.readFileSync('ig_rest_api.js', 'utf8');

const regexToReplace = /const response = await axios\.post\(\`\$\{process\.env\.IG_API_URL\}\/positions\/otc\`, \{\s*dealId: dealId,\s*direction: closeDirection,\s*size: closeSize,\s*orderType: "MARKET"\s*\}, \{/gm;
const regexToReplace2 = /const response = await axios\.post\(\`\$\{process\.env\.IG_API_URL\}\/positions\/otc\`, \{\s*dealId: dealId,\s*direction: closeDirection,\s*size: exactSize\.toString\(\),\s*orderType: "MARKET"\s*\}, \{/gm;

const newCode = `const response = await axios.post(\`\${process.env.IG_API_URL}/positions/otc\`, {
            dealId: dealId,
            direction: closeDirection,
            size: closeSize.toString(),
            orderType: "MARKET"
        }, {`;

code = code.replace(regexToReplace, newCode);
code = code.replace(regexToReplace2, newCode);

fs.writeFileSync('ig_rest_api.js', code);

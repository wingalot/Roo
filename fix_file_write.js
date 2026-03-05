const fs = require('fs');

function writeSafeSync(filePath, data) {
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
}
module.exports = { writeSafeSync };

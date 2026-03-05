const fs = require('fs');
function writeSafeSync(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Kļūda saglabājot failu: ${filePath}`, err.message);
    return false;
  }
}
module.exports = { writeSafeSync };

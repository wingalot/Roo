const { execSync } = require('child_process');
try {
    console.log(execSync('pm2 restart signal_router').toString());
} catch(e) {
    console.error(e.message);
}

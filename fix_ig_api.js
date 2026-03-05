const axios = require('axios');
const fs = require('fs');

async function safeApiCall(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const status = error.response ? error.response.status : null;
            if (status === 429 || status >= 500) {
                console.log(`Ig Api Kļūda ${status}, retry... (${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, 2000 * (i + 1))); // Exponentialish backoff
            } else {
                throw error;
            }
        }
    }
    throw new Error('IG API zvanam beidzies retry limits!');
}

module.exports = { safeApiCall };

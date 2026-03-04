const express = require('express');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config({ path: '/home/roo/.openclaw/workspace/.env' });
const axios = require('axios');

const app = express();
const PORT = 3050;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const workspace = '/home/roo/.openclaw/workspace';

let lastBalance = { equity: 0, available: 0, margin: 0, pnl: 0 };
let igAuth = null;

async function refreshIGToken() {
    try {
        const response = await axios.post(`${process.env.IG_API_URL}/session`, {
            identifier: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD
        }, {
            headers: { 'X-IG-API-KEY': process.env.IG_API_KEY, 'Version': '2' }
        });
        igAuth = {
            cst: response.headers['cst'],
            secToken: response.headers['x-security-token']
        };
        console.log("IG Token refreshed API for Mission Control");
    } catch (e) {
        console.error("IG Token error:", e.message);
    }
}

async function fetchLiveBalance() {
    if (!igAuth) return lastBalance;
    try {
        const h1 = { 'X-IG-API-KEY': process.env.IG_API_KEY, 'CST': igAuth.cst, 'X-SECURITY-TOKEN': igAuth.secToken, 'Version': '1' };
        const res = await axios.get(`${process.env.IG_API_URL}/accounts`, { headers: h1 });
        const cfdAccount = res.data.accounts.find(a => a.accountType === 'CFD' && a.preferred);
        if (cfdAccount) {
            // IG format:
            // balance.balance = equity + pnl (total cash) or just available ?
            // The JSON from IG was: balance: { available: 10000.0, balance: 10000.0, deposit: 0, profitLoss: 0 }
            lastBalance = {
                equity: cfdAccount.balance.balance,
                available: cfdAccount.balance.available,
                margin: cfdAccount.balance.deposit,
                pnl: cfdAccount.balance.profitLoss
            };
        }
    } catch (e) {
        if (e.response && e.response.status === 401) {
             igAuth = null; // trigger re-auth next cycle
        }
    }
    return lastBalance;
}

// Polling for balance every 10 seconds to not hit limits aggressively
setInterval(async () => {
    if(!igAuth) await refreshIGToken();
    else await fetchLiveBalance();
}, 10000);

// Init
refreshIGToken().then(fetchLiveBalance);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Control running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    
    const sendUpdates = () => {
        try {
            // 1. Read Active Trades
            let tradesObj = {};
            let tradesList = [];
            try {
                if (fs.existsSync(path.join(workspace, 'active_trades.json'))) {
                    tradesObj = JSON.parse(fs.readFileSync(path.join(workspace, 'active_trades.json'), 'utf8'));
                    tradesList = Object.values(tradesObj);
                }
            } catch (e) {}

            // 2. Read Latest Signals
            let signalsList = [];
            try {
                if (fs.existsSync(path.join(workspace, 'latest_signals.json'))) {
                    signalsList = JSON.parse(fs.readFileSync(path.join(workspace, 'latest_signals.json'), 'utf8'));
                }
            } catch (e) {}
            
            // Send
            ws.send(JSON.stringify({ 
                type: 'update', 
                data: { 
                    trades: tradesList, 
                    balance: lastBalance, 
                    signals: signalsList
                } 
            }));
        } catch (error) {
            console.error('Error sending updates:', error);
        }
    };

    sendUpdates();
    const interval = setInterval(sendUpdates, 2000);

    ws.on('close', () => clearInterval(interval));
});

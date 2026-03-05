const { processSignal } = require('./signal_router.js');
async function test() {
    await processSignal({ id: 'Tsim1', text: 'BUY EURUSD @ 1.0500\nSL 1.0450\nTP1 1.0550\nTP2 1.0600', reply_to_msg_id: null });
}
test();

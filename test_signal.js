const axios = require('axios');

const payload = {
    update_id: 123456789,
    message: {
        message_id: 9999,
        from: { id: 12345, is_bot: false, first_name: "Test", username: "test_user" },
        chat: { id: -10012345678, title: "Felix Signals", type: "channel" },
        date: Math.floor(Date.now() / 1000),
        text: "BUY XAUUSD @ 2025.50\nSL: 2020.00\nTP1: 2030.00\nTP2: 2035.00"
    }
};

axios.post('http://localhost:3000/webhook', payload) // Assuming telegram_listener runs on port 3000
    .then(res => console.log('Signal sent successfully:', res.data))
    .catch(err => console.error('Error sending signal:', err.message));

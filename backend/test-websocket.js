const WebSocket = require('ws');

// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('🔌 Connected to SAPP WebSocket Server');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received message:', JSON.stringify(message, null, 2));
    } catch (error) {
        console.log('📨 Received raw message:', data.toString());
    }
});

ws.on('close', () => {
    console.log('🔌 Disconnected from WebSocket Server');
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

// Keep the script running
process.on('SIGINT', () => {
    console.log('\n🛑 Closing WebSocket connection...');
    ws.close();
    process.exit(0);
});

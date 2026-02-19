require('dotenv').config();
const net = require('net');
const url = require('url');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

try {
    const parsed = new url.URL(dbUrl);
    const host = parsed.hostname;
    const port = parsed.port || 5432;

    console.log(`Testing TCP connection to ${host}:${port}...`);
    console.log(`URL: ${dbUrl.replace(/:[^:@]*@/, ':****@')}`); // Hide password

    const socket = new net.Socket();
    socket.setTimeout(10000); // 10s timeout

    socket.on('connect', () => {
        console.log('✅ TCP Connection successful! Network is reachable.');
        socket.end();
        process.exit(0);
    });

    socket.on('timeout', () => {
        console.error('❌ Connection timed out. The server is not reachable.');
        console.error('Possible causes:');
        console.error('1. Firewall blocking outbound port 5432');
        console.error('2. Incorrect hostname');
        console.error('3. Database is down/sleeping (Render free tier takes time to wake up)');
        socket.destroy();
        process.exit(1);
    });

    socket.on('error', (err) => {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    });

    socket.connect(port, host);
} catch (error) {
    console.error("Invalid URL format:", error.message);
}

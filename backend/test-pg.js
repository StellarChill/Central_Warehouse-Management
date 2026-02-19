
require('dotenv').config();
const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

// Strip existing query params for clean testing
const connectionString = dbUrl.split('?')[0];

console.log(`Connecting to: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);

async function testConnection(sslConfig, label) {
    console.log(`\n--- Test: ${label} ---`);

    const client = new Client({
        connectionString: connectionString,
        ssl: sslConfig,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log('✅ Connected successfully!');
        console.log('Query result:', res.rows[0]);
        await client.end();
        return true;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        try { await client.end(); } catch (e) { }
        return false;
    }
}

async function run() {
    // Test 1: SSL rejectUnauthorized: false (Equivalent to sslmode=no-verify)
    let success = await testConnection({ rejectUnauthorized: false }, 'SSL (Self-Signed Allowed)');
    if (success) {
        console.log('\n✅ Recommendation: Set ?sslmode=no-verify in DATABASE_URL');
        process.exit(0);
    }

    // Test 2: SSL rejectUnauthorized: true (Equivalent to sslmode=require)
    success = await testConnection(true, 'SSL (Strict Verification)');
    if (success) {
        console.log('\n✅ Recommendation: Set ?sslmode=require in DATABASE_URL');
        process.exit(0);
    }

    // Test 3: No SSL (Unlikely for Render external)
    success = await testConnection(false, 'No SSL');
    if (success) {
        console.log('\n✅ Recommendation: Remove sslmode parameter');
        process.exit(0);
    }

    console.log('\n❌ All connection attempts failed.');
    process.exit(1);
}

run();

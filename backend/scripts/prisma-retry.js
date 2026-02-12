#!/usr/bin/env node
const { execSync } = require('child_process');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWithRetry(command, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[Attempt ${i + 1}/${retries}] Running: ${command}`);
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ Success on attempt ${i + 1}`);
            return;
        } catch (error) {
            console.error(`❌ Attempt ${i + 1} failed:`, error.message);

            if (i < retries - 1) {
                console.log(`⏳ Waiting ${RETRY_DELAY_MS / 1000}s before retry...`);
                await sleep(RETRY_DELAY_MS);
            } else {
                console.error(`💥 All ${retries} attempts failed. Giving up.`);
                process.exit(1);
            }
        }
    }
}

async function main() {
    console.log('🚀 Starting Prisma migration with retry logic...');

    // Run migrate deploy with retries
    await runWithRetry('npx prisma migrate deploy');

    // Run generate (usually doesn't fail, but keep it safe)
    await runWithRetry('npx prisma generate');

    console.log('✨ All Prisma operations completed successfully!');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

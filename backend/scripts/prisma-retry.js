#!/usr/bin/env node
const { execSync } = require('child_process');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 15000; // 15 seconds - give database time to wake up

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function wakeDatabase() {
    console.log('🔔 Attempting to wake up database...');

    for (let i = 0; i < 5; i++) {
        try {
            console.log(`[Wake attempt ${i + 1}/5] Pinging database...`);

            // Simple connection test using Prisma
            execSync('npx prisma db execute --stdin <<< "SELECT 1 as wake_up"', {
                stdio: 'pipe',
                timeout: 30000
            });

            console.log('✅ Database is awake and responsive!');
            console.log('⏳ Waiting 3 seconds to ensure stability...');
            await sleep(3000);
            return true;
        } catch (error) {
            console.log(`⏰ Database still sleeping or unreachable (attempt ${i + 1}/5)`);

            if (i < 4) {
                console.log('⏳ Waiting 10 seconds before next wake attempt...');
                await sleep(10000);
            }
        }
    }

    console.log('⚠️  Could not confirm database wake-up, but proceeding anyway...');
    return false;
}

async function runWithRetry(command, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[Attempt ${i + 1}/${retries}] Running: ${command}`);
            execSync(command, { stdio: 'inherit', timeout: 60000 });
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
    console.log('🚀 Starting Prisma setup with database wake-up logic...');
    console.log('📊 Configuration: MAX_RETRIES=5, RETRY_DELAY=15s');

    // Step 1: Wake up the database first
    await wakeDatabase();

    // Step 2: Run migrate deploy with retries
    console.log('\n📦 Running Prisma migrations...');
    await runWithRetry('npx prisma migrate deploy');

    // Step 3: Generate Prisma Client
    console.log('\n🔧 Generating Prisma Client...');
    await runWithRetry('npx prisma generate');

    console.log('\n✨ All Prisma operations completed successfully!');
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});

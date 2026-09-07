/**
 * DataForge - Rime Hackathon Preflight Validation Script
 * Verifies environment variables, model/speaker compatibility,
 * and live Rime API connectivity.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env file manually if dotenv is not present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function logPass(msg) {
  console.log(`${colors.green}  ✓ [PASS]${colors.reset} ${msg}`);
}
function logFail(msg) {
  console.log(`${colors.red}  ✗ [FAIL]${colors.reset} ${msg}`);
}
function logInfo(msg) {
  console.log(`${colors.cyan}  ℹ [INFO]${colors.reset} ${msg}`);
}

async function runPreflight() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}  DataForge .pathway x rime - Preflight Validation${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);

  let allPassed = true;

  // 1. Check Configuration Hygiene (.env.example exists and .env is not empty)
  const examplePath = path.resolve(__dirname, '../.env.example');
  if (fs.existsSync(examplePath)) {
    logPass('.env.example template is present with placeholder variables.');
  } else {
    logFail('.env.example template is missing.');
    allPassed = false;
  }

  // 2. Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('supabase.co')) {
    logPass(`NEXT_PUBLIC_SUPABASE_URL is configured (${supabaseUrl}).`);
  } else {
    logFail('NEXT_PUBLIC_SUPABASE_URL is missing or invalid in .env.');
    allPassed = false;
  }

  if (supabaseAnonKey && supabaseAnonKey.trim().length > 10) {
    logPass('NEXT_PUBLIC_SUPABASE_ANON_KEY is configured.');
  } else {
    logFail('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid in .env.');
    allPassed = false;
  }

  if (serviceRoleKey && serviceRoleKey.trim().length > 10) {
    logPass('SUPABASE_SERVICE_ROLE_KEY is configured.');
  } else {
    logInfo('SUPABASE_SERVICE_ROLE_KEY not configured; admin operations will fail.');
  }

  // 3. Validate DATABASE_URL points to a PostgreSQL/Supabase host
  const databaseUrl = process.env.DATABASE_URL || '';
  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    logPass(`DATABASE_URL is configured for PostgreSQL (${databaseUrl.split('@')[1] || 'local'}).`);
  } else {
    logFail('DATABASE_URL must point to a PostgreSQL database (Supabase or self-hosted).');
    allPassed = false;
  }

  // 4. Test Live Rime API Connectivity and Model Compatibility
  const rimeKey = process.env.RIME_API_KEY;
  if (rimeKey && rimeKey.trim().length > 10) {
    const masked = rimeKey.substring(0, 4) + '...' + rimeKey.substring(rimeKey.length - 4);
    logPass(`RIME_API_KEY is configured in environment (${masked}).`);
  } else {
    logFail('RIME_API_KEY is missing or invalid in .env.');
    allPassed = false;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 10) {
    const masked = geminiKey.substring(0, 4) + '...' + geminiKey.substring(geminiKey.length - 4);
    logPass(`GEMINI_API_KEY is configured in environment (${masked}).`);
  } else {
    logInfo('GEMINI_API_KEY not configured; fallback exam questions will be used.');
  }

  // 5. Test Live Rime Synthesis Endpoint
  const modelId = process.env.RIME_MODEL || 'arcana';
  const speaker = process.env.RIME_SPEAKER || 'astra';

  console.log(`\n${colors.bold}Testing Live Rime Synthesis Endpoint:${colors.reset}`);
  logInfo(`Target: https://users.rime.ai/v1/rime-tts | Model: "${modelId}" | Speaker: "${speaker}"`);

  const testPayload = JSON.stringify({
    speaker: speaker,
    text: 'DataForge preflight validation check. Rime voice synthesis online.',
    modelId: modelId,
    speedAlpha: 1.0,
  });

  const startTime = Date.now();

  try {
    const response = await fetch('https://users.rime.ai/v1/rime-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rimeKey.trim()}`,
        Accept: 'audio/mp3',
      },
      body: testPayload,
    });

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      logPass(`Rime API responded HTTP ${response.status} OK in ${elapsed}ms.`);
      logPass(`Received valid audio payload (${buffer.length} bytes, format: audio/mp3).`);
    } else {
      const errText = await response.text();
      logFail(`Rime API returned status ${response.status}: ${errText}`);
      allPassed = false;
    }
  } catch (err) {
    logFail(`Rime network connection failed: ${err.message}`);
    allPassed = false;
  }

  // Summary
  console.log(`\n${colors.cyan}----------------------------------------------------------------${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.bold}${colors.green}  ✓ PREFLIGHT PASSED: System ready for Rime Hackathon evaluation.${colors.reset}`);
    console.log(`${colors.cyan}----------------------------------------------------------------${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}  ✗ PREFLIGHT FAILED: Check missing credentials or configuration.${colors.reset}`);
    console.log(`${colors.cyan}----------------------------------------------------------------${colors.reset}\n`);
    process.exit(1);
  }
}

runPreflight();
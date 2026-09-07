/**
 * Apply Supabase Row Level Security (RLS) policies from supabase/rls.sql.
 *
 * Usage: node scripts/apply-rls.js
 *
 * Requires the SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 * environment variables to be set (loaded from .env).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env
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
        if (!process.env[key]) process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sqlPath = path.resolve(__dirname, '../supabase/rls.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('RLS SQL file not found at', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

// Project ref extracted from the URL, e.g. https://abc.supabase.co -> abc
const projectRef = supabaseUrl.replace(/^https?:\/\//, '').replace(/\.supabase\.co.*$/, '');
const dbHost = `db.${projectRef}.supabase.com`;

const payload = JSON.stringify({ query: sql });

const options = {
  hostname: dbHost,
  port: 443,
  path: '/rest/v1/rpc/execute_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Length': Buffer.byteLength(payload),
  },
};

console.log(`Applying RLS policies from supabase/rls.sql to ${supabaseUrl} ...`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✓ RLS policies applied successfully.');
      process.exit(0);
    } else {
      console.error(`✗ RLS apply failed (HTTP ${res.statusCode}):`, data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('✗ RLS apply request error:', err.message);
  process.exit(1);
});

req.write(payload);
req.end();
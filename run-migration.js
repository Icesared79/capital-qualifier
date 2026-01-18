const https = require('https');

const sql = 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS overall_score INTEGER;';

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'gwrpijvfxjppncpmamfp.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cnBpanZmeGpwcG5jcG1hbWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU1NTMwMCwiZXhwIjoyMDg0MTMxMzAwfQ.oDSFw5xhX67Gt8pxHRwcUQyMTqvzfWiuJDXqoMlpYs0',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cnBpanZmeGpwcG5jcG1hbWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU1NTMwMCwiZXhwIjoyMDg0MTMxMzAwfQ.oDSFw5xhX67Gt8pxHRwcUQyMTqvzfWiuJDXqoMlpYs0',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();

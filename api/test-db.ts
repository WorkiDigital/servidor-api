import { query } from './src/lib/db';

async function run() {
  const res = await query('SELECT client_id, count(*), min(created_at), max(created_at) FROM events_log GROUP BY client_id');
  console.log('Events Log summary:');
  console.log(res.rows);

  const res2 = await query('SELECT id, tracking_domain, subdomain FROM clients');
  console.log('Clients:');
  console.log(res2.rows);

  process.exit(0);
}

run();

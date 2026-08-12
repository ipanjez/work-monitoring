const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_u1vj4wSEgHok@ep-noisy-violet-a1k05cch-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(() => {
  client.query('SELECT "subTasksJson" FROM "Task" WHERE "subTasksJson" LIKE \'%pic%\' LIMIT 1').then(res => console.log(res.rows)).catch(console.error).finally(() => client.end());
});

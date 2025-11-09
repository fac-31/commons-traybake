import 'dotenv/config';
import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI!;
const user = process.env.NEO4J_USER!;
const password = process.env.NEO4J_PASSWORD!;

console.log(`Connecting to: ${uri}`);
console.log(`User: ${user}`);

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

try {
  const result = await session.run('RETURN 1 AS num');
  console.log('✅ Connected successfully!');
  console.log('Result:', result.records[0].get('num').toInt());
} catch (error: any) {
  console.error('❌ Failed:', error.message);
  console.error('Code:', error.code);
} finally {
  await session.close();
  await driver.close();
}

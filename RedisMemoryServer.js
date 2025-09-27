const { RedisMemoryServer } = require('redis-memory-server');
const redis = require('redis');

async function startRedis() {
  const redisServer = new RedisMemoryServer();
  const port = await redisServer.getPort();
  const host = await redisServer.getHost();

  const client = redis.createClient({ url: `redis://${host}:${port}` });
  await client.connect();

  console.log(`Internal Redis started at ${host}:${port}`);
  return client;
}

let client;
startRedis().then(c => { client = c; });

ipcMain.handle('redis-set', async (event, key, value) => {
  await client.set(key, value);
  return 'OK';
});

ipcMain.handle('redis-get', async (event, key) => {
  const value = await client.get(key);
  return value;
});

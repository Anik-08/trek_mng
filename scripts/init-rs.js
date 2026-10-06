const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27018/');
  try {
    await client.connect();
    const result = await client.db('admin').command({ replSetInitiate: {} });
    console.log('Replica set initiated:', JSON.stringify(result));
  } catch (e) {
    if (e.codeName === 'AlreadyInitialized') {
      console.log('Replica set already initialized.');
    } else {
      console.error('Error:', e.message);
    }
  } finally {
    await client.close();
  }
}

run();

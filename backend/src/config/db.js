import { MongoClient } from 'mongodb';

export async function connectDatabase({ mongoUri, databaseName }) {
  const client = new MongoClient(mongoUri, { maxPoolSize: 8, serverSelectionTimeoutMS: 7000 });
  try {
    await client.connect();
    const collection = client.db(databaseName).collection('stories');
    await collection.createIndex({ clientStoryId: 1 }, { unique: true });
    await collection.createIndex({ publishedAt: -1 });
    return { client, collection };
  } catch (error) {
    await client.close();
    throw error;
  }
}

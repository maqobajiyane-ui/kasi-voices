import 'dotenv/config';
import { readConfiguration } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { createApp } from './app.js';

const config = readConfiguration();
const { client, collection } = await connectDatabase(config);
const app = await createApp({
  collection,
  secret: config.secret,
  mediaDir: config.mediaDir,
  serveFrontend: config.production,
});
const server = app.listen(config.port, config.host, () => {
  console.info('KasiVoices API listening on http://' + config.host + ':' + config.port);
});

async function shutdown() {
  server.close(async () => {
    await client.close();
    process.exit(0);
  });
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

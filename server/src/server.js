import { app } from './app.js';
import { config } from './config/env.js';
import { readDb } from './repositories/jsonRepository.js';
import { startTelegram } from './telegram/bot.js';
if(config.nodeEnv==='production'&&!config.jwtSecret){console.error('Production muhitida JWT_SECRET majburiy.');process.exit(1);}
try { await readDb(); } catch(e) { console.error(e.message); process.exit(1); }
const server=app.listen(config.port,()=>{console.info(`Smart Warehouse API: http://localhost:${config.port}/api`);startTelegram();});
const stop=()=>server.close(()=>process.exit(0));process.on('SIGINT',stop);process.on('SIGTERM',stop);

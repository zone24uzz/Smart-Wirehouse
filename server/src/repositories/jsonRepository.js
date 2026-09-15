import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';

const empty = () => Object.fromEntries(['users','products','categories','warehouses','objects','orders','orderItems','inventoryMovements','reservations','shortages','supplyRequests','suppliers','invoices','transportRequests','vehicles','drivers','shipments','notifications','aiConversations','auditLogs','settings'].map(k => [k, []]));
let queue = Promise.resolve();
async function ensure() { await fs.mkdir(path.dirname(config.databasePath), { recursive: true }); try { await fs.access(config.databasePath); } catch { await fs.writeFile(config.databasePath, JSON.stringify(empty(), null, 2)); } }
export async function readDb() { await ensure(); try { return JSON.parse(await fs.readFile(config.databasePath, 'utf8')); } catch (e) { throw new Error(`Database JSON o'qilmadi: ${e.message}`); } }
export async function mutateDb(mutator) {
  const task = queue.then(async () => { const db = await readDb(); const result = await mutator(db); const temp = `${config.databasePath}.${process.pid}.tmp`; await fs.writeFile(temp, JSON.stringify(db, null, 2)); await fs.rename(temp, config.databasePath); return result; });
  queue = task.catch(() => {}); return task;
}
export async function backupDb() { const db = await readDb(); const dir = path.resolve(path.dirname(config.databasePath), '../backups'); await fs.mkdir(dir, { recursive: true }); const file = path.join(dir, `db-${new Date().toISOString().replace(/[:.]/g, '-')}.json`); await fs.writeFile(file, JSON.stringify(db, null, 2)); return path.basename(file); }

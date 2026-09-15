import fs from 'node:fs/promises';
import { config } from '../src/config/env.js';
import { seedData } from '../src/services/seedData.js';
await fs.mkdir(new URL('../data/', import.meta.url),{recursive:true});
await fs.writeFile(config.databasePath,JSON.stringify(await seedData(),null,2));
console.log(`Seed muvaffaqiyatli: ${config.databasePath}`);

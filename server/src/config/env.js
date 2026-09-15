import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
dotenv.config();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
export const config = {
  port: Number(process.env.PORT || 5000), nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-secret-change-before-deploy'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  aiProvider: process.env.AI_PROVIDER || '', aiApiKey: process.env.AI_API_KEY || '', aiModel: process.env.AI_MODEL || '',
  databasePath: path.resolve(root, process.env.DATABASE_PATH || './data/db.json'),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '', telegramMode: process.env.TELEGRAM_MODE || 'polling', telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '', telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '', telegramWebAppUrl: process.env.TELEGRAM_WEB_APP_URL || '',
  telegramAdmins: (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean)
};

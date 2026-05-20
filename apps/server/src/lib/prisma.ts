import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../generated/client.js';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../prisma/dev.db');

const adapter = new PrismaLibSql({ url: pathToFileURL(dbPath).href });
export const prisma = new PrismaClient({ adapter });

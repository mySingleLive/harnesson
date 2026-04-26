import { Hono } from 'hono';
import { pickFolder } from '../lib/native-dialog.js';

export const openFolderRoute = new Hono();

openFolderRoute.post('/api/open-folder', (c) => {
  try {
    const folderPath = pickFolder();
    if (!folderPath) {
      return c.json({ cancelled: true }, 200);
    }
    return c.json({ path: folderPath }, 200);
  } catch (err: any) {
    return c.json({ error: err.message ?? 'Failed to open folder dialog' }, 500);
  }
});

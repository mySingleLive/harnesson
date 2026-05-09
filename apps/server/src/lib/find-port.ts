import { createServer } from 'node:net';

export function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function tryPort(port: number) {
      const server = createServer();
      server.unref();
      server.on('error', (err: NodeJS.ErrnoException) => {
        if ((err.code === 'EADDRINUSE' || err.code === 'ERR_SOCKET_BAD_PORT') && port < 65535) {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error(`No available port found after ${maxAttempts} attempts (tried ${startPort}-${port})`));
          } else {
            tryPort(port + 1);
          }
        } else {
          reject(err);
        }
      });
      server.listen(port, () => {
        server.close(() => resolve(port));
      });
    }

    tryPort(startPort);
  });
}

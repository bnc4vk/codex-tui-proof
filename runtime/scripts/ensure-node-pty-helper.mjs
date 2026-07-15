import fs from 'node:fs';
import path from 'node:path';

const prebuilds = path.resolve('node_modules/node-pty/prebuilds');
if (process.platform === 'darwin' && fs.existsSync(prebuilds)) {
  for (const platform of fs.readdirSync(prebuilds)) {
    const helper = path.join(prebuilds, platform, 'spawn-helper');
    if (fs.existsSync(helper)) fs.chmodSync(helper, 0o755);
  }
}

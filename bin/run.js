#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const oclif = await import('@oclif/core');
  await oclif.execute({ development: false, dir: __dirname });
})();

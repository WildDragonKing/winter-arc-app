#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const binDir = join(process.cwd(), 'node_modules', '.bin');
const cliName = isWindows ? 'vercel.cmd' : 'vercel';
const localCli = join(binDir, cliName);

const run = (command, args) =>
  spawnSync(command, args, {
    stdio: 'inherit',
    shell: isWindows,
    env: process.env,
  });

const ensureResult = (result) => {
  if (result.error) {
    console.error(`[vercel:build] Failed to execute command: ${result.error.message}`);
    process.exit(result.status ?? 1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`[vercel:build] Command exited with status ${result.status}.`);
    process.exit(result.status);
  }
};

let result;
if (existsSync(localCli)) {
  result = run(localCli, ['build', '--yes', '--no-clipboard']);
} else {
  console.warn(
    '[vercel:build] Local Vercel CLI not found. Falling back to `npx vercel`. Add `vercel` as a devDependency for faster runs.'
  );
  const npxBinary = isWindows ? 'npx.cmd' : 'npx';
  result = run(npxBinary, ['--yes', 'vercel', 'build', '--yes', '--no-clipboard']);
}

ensureResult(result);

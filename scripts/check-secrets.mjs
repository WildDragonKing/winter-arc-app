#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  'node_modules',
  'dist',
  'coverage',
  '.vercel',
]);

const MAX_FILE_BYTES = 1024 * 1024; // 1MB safety cap

const SECRET_PATTERNS = [
  {
    id: 'rsa-private-key',
    test(content) {
      const blockPattern = /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----([\s\S]+?)-----END \1 PRIVATE KEY-----/g;
      for (const match of content.matchAll(blockPattern)) {
        const body = match[2]?.replace(/\s+/g, '') ?? '';
        if (body.length >= 80 && /^[A-Za-z0-9+/=]+$/.test(body)) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: 'generic-private-key',
    test(content) {
      const blockPattern = /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/g;
      for (const match of content.matchAll(blockPattern)) {
        const body = match[1]?.replace(/\s+/g, '') ?? '';
        if (body.length >= 80 && /^[A-Za-z0-9+/=]+$/.test(body)) {
          return true;
        }
      }
      return false;
    },
  },
  { id: 'aws-access-key', test: (content) => /AKIA[0-9A-Z]{16}/.test(content) },
  {
    id: 'aws-secret-key',
    test(content) {
      const candidatePattern = /(?<![A-Za-z0-9/+])[A-Za-z0-9/+]{40}(?![A-Za-z0-9/+])/g;
      for (const match of content.matchAll(candidatePattern)) {
        const value = match[0];
        if (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) {
          return true;
        }
      }
      return false;
    },
  },
  { id: 'google-api-key', test: (content) => /AIza[0-9A-Za-z\-_]{35}/.test(content) },
  { id: 'slack-token', test: (content) => /xox[baprs]-[0-9A-Za-z\-]{10,48}/.test(content) },
  { id: 'github-token', test: (content) => /gh[pousr]_[0-9A-Za-z]{36}/.test(content) },
  {
    id: 'heroku-api-key',
    test(content) {
      const candidatePattern = /[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}/g;
      for (const match of content.matchAll(candidatePattern)) {
        const index = match.index ?? 0;
        const prefix = content.slice(Math.max(0, index - 24), index);
        const normalized = prefix.replace(/\s+/g, '').toLowerCase();
        if (
          normalized.endsWith('"id":"') ||
          normalized.endsWith('"previd":"') ||
          normalized.endsWith('"nextid":"') ||
          normalized.endsWith('"migrationid":"')
        ) {
          continue;
        }
        return true;
      }
      return false;
    },
  },
  {
    id: 'google-client-secret',
    test: (content) => /[0-9A-Za-z-_]{24}\.[0-9A-Za-z-_]{6}\.[0-9A-Za-z-_]{27}/.test(content),
  },
  {
    id: 'potential-password',
    test: (content) => /password\s*[:=]\s*['\"][^'"\n]{6,}['\"]/i.test(content),
  },
];

const TEXT_ENCODINGS = ['utf8', 'utf16le', 'latin1'];

async function* walk(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    if (IGNORED_DIRECTORIES.has(dirent.name)) {
      continue;
    }
    const resolved = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walk(resolved);
    } else if (dirent.isFile()) {
      yield resolved;
    }
  }
}

function isBinary(buffer) {
  const textSample = buffer.slice(0, 256);
  for (const byte of textSample) {
    if (byte === 0) {
      return true;
    }
  }
  return false;
}

async function readTextFile(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size === 0 || stat.size > MAX_FILE_BYTES) {
    return null;
  }
  const buffer = await fs.readFile(filePath);
  if (isBinary(buffer)) {
    return null;
  }
  for (const encoding of TEXT_ENCODINGS) {
    try {
      return buffer.toString(encoding);
    } catch {
      /* continue trying */
    }
  }
  return null;
}

async function scanFile(filePath) {
  const content = await readTextFile(filePath);
  if (!content) {
    return [];
  }
  const matches = [];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      matches.push(pattern.id);
    }
  }
  return matches;
}

async function main() {
  const repoRoot = process.cwd();
  const findings = [];

  for await (const filePath of walk(repoRoot)) {
    const matches = await scanFile(filePath);
    if (matches.length > 0) {
      findings.push({ file: path.relative(repoRoot, filePath), matches });
    }
  }

  if (findings.length > 0) {
    console.error('\nSecret scan failed: potential secrets detected.');
    for (const { file, matches } of findings) {
      console.error(` - ${file}: ${matches.join(', ')}`);
    }
    console.error('\nResolve the findings before committing. If false positives, update the checker to whitelist intentionally committed values.');
    process.exit(1);
  }

  console.log('✅ Secret scan passed: no obvious secrets detected.');
}

main().catch((error) => {
  console.error('Secret scan error:', error);
  process.exit(1);
});

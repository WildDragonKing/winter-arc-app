#!/usr/bin/env node

/**
 * Documentation Hygiene Checker
 *
 * Checks for:
 * - Docs older than 6 months with no updates
 * - Broken internal links
 * - References to archived/deleted files
 * - Files exceeding 800 lines
 * - Duplicate content (fuzzy match headings)
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const MAX_FILE_SIZE = 800; // lines
const MAX_AGE_MONTHS = 6;
const FIX_MODE = process.argv.includes('--fix');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getMarkdownFiles(dir, fileList = []) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(dir, file.name);

    // Skip node_modules, .git, dist, etc.
    if (
      file.name === 'node_modules' ||
      file.name === '.git' ||
      file.name === 'dist' ||
      file.name === '.next' ||
      file.name === 'coverage'
    ) {
      continue;
    }

    if (file.isDirectory()) {
      getMarkdownFiles(filePath, fileList);
    } else if (file.name.endsWith('.md')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function getFileAge(filePath) {
  try {
    // Try to get last commit date from git
    const cmd = `git log -1 --format=%ct "${filePath}"`;
    const timestamp = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (timestamp) {
      const commitDate = new Date(parseInt(timestamp) * 1000);
      const monthsOld =
        (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return { date: commitDate, monthsOld };
    }
  } catch (error) {
    // Ignore git errors, fall through to filesystem
  }

  // Fallback to file system mtime
  const stats = statSync(filePath);
  const monthsOld =
    (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return { date: stats.mtime, monthsOld };
}

function getFileLineCount(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function extractLinks(content) {
  // Match markdown links: [text](url) or [text](url "title")
  const linkRegex = /\[([^\]]+)\]\(([^)]+?)(?: ".*?")?\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, url] = match;
    // Only check relative/local links (not http/https)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      links.push({ text, url });
    }
  }

  return links;
}

function checkBrokenLinks(filePath, content) {
  const links = extractLinks(content);
  const broken = [];
  const fileDir = join(ROOT_DIR, filePath, '..');

  for (const { url, text } of links) {
    // Remove anchor (#heading)
    const [path] = url.split('#');
    if (!path) continue; // Just an anchor

    try {
      const targetPath = join(fileDir, path);
      statSync(targetPath);
    } catch (error) {
      broken.push({ text, url });
    }
  }

  return broken;
}

function extractHeadings(content) {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].toLowerCase().trim());
  }

  return headings;
}

function findDuplicateHeadings(files) {
  const headingsMap = new Map();

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const headings = extractHeadings(content);

    for (const heading of headings) {
      if (!headingsMap.has(heading)) {
        headingsMap.set(heading, []);
      }
      headingsMap.get(heading).push(relative(ROOT_DIR, file));
    }
  }

  // Find headings that appear in multiple files
  const duplicates = [];
  for (const [heading, files] of headingsMap.entries()) {
    if (files.length > 1) {
      duplicates.push({ heading, files });
    }
  }

  return duplicates;
}

function checkArchivedReferences(content, filePath) {
  const issues = [];

  // Check for references to archived docs
  if (content.includes('docs/archive/')) {
    // This is OK if the file itself is in archive or explicitly references archive
    if (
      !filePath.includes('archive') &&
      !content.includes('[HISTORICAL') &&
      !content.includes('archived')
    ) {
      issues.push('File references archived documentation without context');
    }
  }

  // Check for references to deleted files
  const deletedFiles = [
    '1PASSWORD_SETUP.md',
    '1PASSWORD_QUICKSTART.md',
    '1PASSWORD_INTEGRATION.md',
    'development-guidelines.md',
    'BACKEND_QUICKSTART.md',
  ];

  for (const deletedFile of deletedFiles) {
    if (content.includes(deletedFile)) {
      issues.push(`References deleted file: ${deletedFile}`);
    }
  }

  return issues;
}

async function main() {
  log('\n🔍 Documentation Hygiene Check\n', 'blue');

  const files = getMarkdownFiles(ROOT_DIR);
  const issues = {
    stale: [],
    tooLarge: [],
    brokenLinks: [],
    archivedRefs: [],
  };

  // Check each file
  for (const file of files) {
    const relativePath = relative(ROOT_DIR, file);
    const content = readFileSync(file, 'utf-8');
    const lineCount = getFileLineCount(file);
    const { monthsOld, date } = getFileAge(file);

    // Check file age
    if (monthsOld > MAX_AGE_MONTHS && !file.includes('archive')) {
      issues.stale.push({
        file: relativePath,
        monthsOld: Math.round(monthsOld),
        lastModified: date.toISOString().split('T')[0],
      });
    }

    // Check file size
    if (lineCount > MAX_FILE_SIZE) {
      issues.tooLarge.push({
        file: relativePath,
        lines: lineCount,
        excess: lineCount - MAX_FILE_SIZE,
      });
    }

    // Check broken links
    const brokenLinks = checkBrokenLinks(file, content);
    if (brokenLinks.length > 0) {
      issues.brokenLinks.push({
        file: relativePath,
        links: brokenLinks,
      });
    }

    // Check archived references
    const archivedRefs = checkArchivedReferences(content, relativePath);
    if (archivedRefs.length > 0) {
      issues.archivedRefs.push({
        file: relativePath,
        issues: archivedRefs,
      });
    }
  }

  // Check duplicate headings
  const duplicates = findDuplicateHeadings(files);

  // Report issues
  let hasIssues = false;

  if (issues.stale.length > 0) {
    hasIssues = true;
    log('\n⚠️  Stale Documentation (>6 months old):', 'yellow');
    for (const { file, monthsOld, lastModified } of issues.stale) {
      log(
        `  • ${file} (${monthsOld} months old, last modified: ${lastModified})`,
        'gray'
      );
    }
    log(
      '\n  💡 Consider: Archive to docs/archive/ or update with recent changes\n',
      'blue'
    );
  }

  if (issues.tooLarge.length > 0) {
    hasIssues = true;
    log('\n⚠️  Files Exceeding Size Limit (>800 lines):', 'yellow');
    for (const { file, lines, excess } of issues.tooLarge) {
      log(`  • ${file} (${lines} lines, ${excess} over limit)`, 'gray');
    }
    log(
      '\n  💡 Consider: Split into logical sub-documents or consolidate redundant sections\n',
      'blue'
    );
  }

  if (issues.brokenLinks.length > 0) {
    hasIssues = true;
    log('\n❌ Broken Internal Links:', 'red');
    for (const { file, links } of issues.brokenLinks) {
      log(`  • ${file}:`, 'gray');
      for (const { text, url } of links) {
        log(`    - [${text}](${url})`, 'gray');
      }
    }
    log('\n  💡 Fix: Update links to correct paths or remove if obsolete\n', 'blue');
  }

  if (issues.archivedRefs.length > 0) {
    hasIssues = true;
    log('\n⚠️  References to Archived/Deleted Files:', 'yellow');
    for (const { file, issues: fileIssues } of issues.archivedRefs) {
      log(`  • ${file}:`, 'gray');
      for (const issue of fileIssues) {
        log(`    - ${issue}`, 'gray');
      }
    }
    log(
      '\n  💡 Fix: Update references to current documentation or add archival context\n',
      'blue'
    );
  }

  if (duplicates.length > 3) {
    // Only report if significant duplicates
    hasIssues = true;
    log('\n⚠️  Potential Duplicate Content:', 'yellow');
    const topDuplicates = duplicates.slice(0, 5);
    for (const { heading, files } of topDuplicates) {
      log(`  • "${heading}" appears in:`, 'gray');
      for (const file of files) {
        log(`    - ${file}`, 'gray');
      }
    }
    log(
      `\n  💡 Found ${duplicates.length} duplicate headings. Consider consolidating similar content.\n`,
      'blue'
    );
  }

  // Summary
  if (!hasIssues) {
    log('\n✅ Documentation hygiene check passed!', 'green');
    log(`   Checked ${files.length} markdown files\n`, 'gray');
  } else {
    log('\n📊 Summary:', 'blue');
    log(`   Total files checked: ${files.length}`, 'gray');
    log(`   Stale files: ${issues.stale.length}`, 'gray');
    log(`   Oversized files: ${issues.tooLarge.length}`, 'gray');
    log(`   Broken links: ${issues.brokenLinks.length}`, 'gray');
    log(`   Archived references: ${issues.archivedRefs.length}`, 'gray');
    log(`   Duplicate headings: ${duplicates.length}\n`, 'gray');

    if (FIX_MODE) {
      log('🔧 Fix mode not yet implemented', 'yellow');
      log('   Please address issues manually based on recommendations\n', 'gray');
    } else {
      log('💡 Run with --fix to attempt automatic fixes\n', 'blue');
    }

    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});

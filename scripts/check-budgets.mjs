#!/usr/bin/env node
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Performance budgets (in KB, gzipped)
const BUDGETS = {
  total: 500, // Total JS bundle size
  initial: 180, // Initial JS chunk
  css: 50, // CSS files
};

async function getFileSize(filePath) {
  const stats = await stat(filePath);
  // Approximate gzip ratio (typically 3-4x compression for text)
  return Math.round(stats.size / 3.5 / 1024); // Convert to KB
}

async function getFilesRecursive(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function checkBudgets() {
  const distDir = join(__dirname, '..', 'dist');

  try {
    const allFiles = await getFilesRecursive(distDir);
    const jsFiles = allFiles.filter((f) => f.endsWith('.js'));
    const cssFiles = allFiles.filter((f) => f.endsWith('.css'));

    let totalJsSize = 0;
    let initialChunkSize = 0;
    let totalCssSize = 0;

    console.log('\n📊 Performance Budget Check\n');
    console.log('JavaScript Files:');

    for (const file of jsFiles) {
      const size = await getFileSize(file);
      const fileName = file.split('dist/')[1];
      totalJsSize += size;

      console.log(`  ${fileName}: ${size}KB (gzipped est.)`);

      // Identify initial chunk (usually index-*.js)
      if (fileName.includes('index-') || fileName.includes('main-')) {
        initialChunkSize = Math.max(initialChunkSize, size);
      }
    }

    console.log('\nCSS Files:');
    for (const file of cssFiles) {
      const size = await getFileSize(file);
      const fileName = file.split('dist/')[1];
      totalCssSize += size;
      console.log(`  ${fileName}: ${size}KB (gzipped est.)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Budget vs Actual:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const checks = [
      { name: 'Total JS', actual: totalJsSize, budget: BUDGETS.total },
      { name: 'Initial Chunk', actual: initialChunkSize, budget: BUDGETS.initial },
      { name: 'Total CSS', actual: totalCssSize, budget: BUDGETS.css },
    ];

    let hasViolations = false;

    for (const check of checks) {
      const percentage = Math.round((check.actual / check.budget) * 100);
      const status = check.actual <= check.budget ? '✅' : '❌';
      const color = check.actual <= check.budget ? '' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(
        `${status} ${check.name}: ${color}${check.actual}KB${reset} / ${check.budget}KB (${percentage}%)`
      );

      if (check.actual > check.budget) {
        hasViolations = true;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (hasViolations) {
      console.error('❌ Performance budget exceeded!');
      console.error('Consider:');
      console.error('  - Code splitting additional routes');
      console.error('  - Lazy loading heavy components');
      console.error('  - Removing unused dependencies');
      console.error('  - Optimizing imports (use tree-shaking)\n');
      process.exit(1);
    } else {
      console.log('✅ All performance budgets met!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking budgets:', error.message);
    console.error('Make sure to run `npm run build` first.\n');
    process.exit(1);
  }
}

checkBudgets();

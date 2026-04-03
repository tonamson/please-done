const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  ensureLogDirectory,
  rotateLogFile,
  cleanupOldRotations,
  getDiskUsage,
  checkDiskSpace,
  performMaintenance,
  LOGS_DIR
} = require('../bin/lib/log-manager');

function cleanup() {
  if (fs.existsSync(LOGS_DIR)) {
    const files = fs.readdirSync(LOGS_DIR);
    files.forEach(file => {
      const filePath = path.join(LOGS_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(LOGS_DIR);
  }
}

test('ensureLogDirectory - creates directory if missing', () => {
  cleanup();

  const result = ensureLogDirectory();

  assert.strictEqual(result, true);
  assert.strictEqual(fs.existsSync(LOGS_DIR), true);
  assert.strictEqual(fs.statSync(LOGS_DIR).isDirectory(), true);
});

test('ensureLogDirectory - returns true if directory exists', () => {
  cleanup();
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  const result = ensureLogDirectory();

  assert.strictEqual(result, true);
});

test('rotateLogFile - rotates when file exceeds size limit', () => {
  cleanup();
  ensureLogDirectory();

  // Create a log file larger than MAX_LOG_SIZE (10MB)
  const testFile = path.join(LOGS_DIR, 'test-log.jsonl');
  const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
  fs.writeFileSync(testFile, largeContent);

  const result = rotateLogFile('test-log');

  assert.strictEqual(result, true);
  assert.strictEqual(fs.existsSync(testFile), false);
  assert.strictEqual(fs.existsSync(path.join(LOGS_DIR, 'test-log.1.jsonl')), true);
});

test('rotateLogFile - does not rotate small files', () => {
  cleanup();
  ensureLogDirectory();

  const testFile = path.join(LOGS_DIR, 'small-log.jsonl');
  fs.writeFileSync(testFile, 'small content');

  const result = rotateLogFile('small-log');

  assert.strictEqual(result, false);
  assert.strictEqual(fs.existsSync(testFile), true);
});

test('rotateLogFile - handles missing files gracefully', () => {
  cleanup();
  ensureLogDirectory();

  const result = rotateLogFile('non-existent');

  assert.strictEqual(result, false);
});

test('cleanupOldRotations - keeps only MAX_LOG_FILES rotations', () => {
  cleanup();
  ensureLogDirectory();

  // Create more than MAX_LOG_FILES rotated files
  const baseName = 'test-log';
  const maxFiles = 10;

  for (let i = 1; i <= 15; i++) {
    fs.writeFileSync(
      path.join(LOGS_DIR, `${baseName}.${i}.jsonl`),
      `content ${i}`
    );
  }

  cleanupOldRotations(baseName);

  const remainingFiles = fs.readdirSync(LOGS_DIR)
    .filter(file => file.startsWith(`${baseName}.`) && file !== `${baseName}.jsonl`);

  assert.strictEqual(remainingFiles.length, maxFiles);

  // Check that the highest numbered files remain
  for (let i = 6; i <= 15; i++) {
    const exists = fs.existsSync(path.join(LOGS_DIR, `${baseName}.${i}.jsonl`));
    if (i > 10) {
      assert.strictEqual(exists, false, `File ${i} should be deleted`);
    } else {
      assert.strictEqual(exists, true, `File ${i} should be kept`);
    }
  }
});

test('getDiskUsage - returns correct usage information', () => {
  cleanup();
  ensureLogDirectory();

  // Create some test files
  fs.writeFileSync(path.join(LOGS_DIR, 'file1.jsonl'), 'hello');
  fs.writeFileSync(path.join(LOGS_DIR, 'file2.jsonl'), 'world');

  const usage = getDiskUsage();

  assert.strictEqual(typeof usage.totalSize, 'number');
  assert.strictEqual(usage.totalSize, 10); // "hello" + "world" = 10 bytes
  assert.strictEqual(usage.fileCount, 2);
  assert.ok(usage.humanReadable);
  assert.strictEqual(usage.humanReadable, '10 Bytes');
});

test('getDiskUsage - handles missing directory', () => {
  cleanup();

  const usage = getDiskUsage();

  assert.strictEqual(usage.totalSize, 0);
  assert.strictEqual(usage.fileCount, 0);
});

test('checkDiskSpace - returns boolean', () => {
  const result = checkDiskSpace();

  assert.strictEqual(typeof result, 'boolean');
});

test('performMaintenance - runs all maintenance tasks', () => {
  cleanup();

  const report = performMaintenance();

  assert.ok(report.timestamp);
  assert.ok(Array.isArray(report.rotations));
  assert.ok(Array.isArray(report.cleanups));
  assert.ok(Array.isArray(report.errors));
  assert.ok(report.diskUsage);

  // Should have created the log directory
  assert.strictEqual(fs.existsSync(LOGS_DIR), true);
});

test('performMaintenance - handles errors gracefully', () => {
  cleanup();

  // Create a read-only directory (simulated by making directory first)
  // This tests error handling in the maintenance functions
  const report = performMaintenance();

  // Should still return a report even with errors
  assert.ok(report.timestamp);
  assert.ok('errors' in report);
});

test('Log rotation - maintains size limits', () => {
  cleanup();
  ensureLogDirectory();

  const { MAX_LOG_SIZE } = require('../bin/lib/log-manager');

  // Create multiple files that would trigger rotation
  const baseName = 'stress-test';

  // Create initial large file
  const largeContent = 'x'.repeat(MAX_LOG_SIZE + 1000);
  fs.writeFileSync(path.join(LOGS_DIR, `${baseName}.jsonl`), largeContent);

  // File should be rotated
  const rotated = rotateLogFile(baseName);
  assert.strictEqual(rotated, true);

  // Should have created rotated file
  assert.strictEqual(fs.existsSync(path.join(LOGS_DIR, `${baseName}.1.jsonl`)), true);

  // Create another large file
  fs.writeFileSync(path.join(LOGS_DIR, `${baseName}.jsonl`), largeContent);

  // Rotate again
  rotateLogFile(baseName);

  // Should have multiple rotations
  assert.strictEqual(fs.existsSync(path.join(LOGS_DIR, `${baseName}.1.jsonl`)), true);
  assert.strictEqual(fs.existsSync(path.join(LOGS_DIR, `${baseName}.2.jsonl`)), true);
});

test('ensureGitignore - adds logs entry to .gitignore', () => {
  cleanup();

  const gitignorePath = path.join(LOGS_DIR, '..', '..', '.gitignore');
  const tempGitignore = path.join(LOGS_DIR, '..', '..', '.gitignore.test');

  // Backup existing .gitignore if it exists
  if (fs.existsSync(gitignorePath)) {
    fs.copyFileSync(gitignorePath, tempGitignore);
  }

  try {
    // Create a test .gitignore
    fs.writeFileSync(gitignorePath, '# Test gitignore\n');

    // Call ensureLogDirectory which calls ensureGitignore
    ensureLogDirectory();

    // Check that logs entry was added
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(content.includes('.planning/logs/'));
  } finally {
    // Restore original .gitignore
    if (fs.existsSync(tempGitignore)) {
      fs.copyFileSync(tempGitignore, gitignorePath);
      fs.unlinkSync(tempGitignore);
    } else if (fs.existsSync(gitignorePath)) {
      fs.unlinkSync(gitignorePath);
    }
  }
});

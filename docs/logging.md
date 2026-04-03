# Logging System Documentation

## Overview

The Please Done logging system provides structured error logging across all PD skills, enabling better debugging, monitoring, and error recovery. Logs are written in JSONL format to `.planning/logs/agent-errors.jsonl`.

## Architecture

### Components

1. **Log Writer** (`bin/lib/log-writer.js`)
   - Core logging utility with `writeLog()` and `createLogBuilder()`
   - Writes JSONL format logs with timestamp, level, phase, step, agent, error, and context
   - Pure functions for testability

2. **Skill Error Logger** (`bin/lib/skill-error-logger.js`)
   - Centralized error logging for PD skills
   - Registry-based tracking of skill executions
   - Error context enrichment and re-throwing

3. **Enhanced Error Handlers** (`bin/lib/enhanced-error-handler.js`)
   - Rich context for 5 critical skills: fix-bug, plan, write-code, test, audit
   - Skill-specific metadata capture

4. **Basic Error Handler** (`bin/lib/basic-error-handler.js`)
   - Simple error logging for remaining 11 skills
   - Consistent interface across all skills

5. **Log Manager** (`bin/lib/log-manager.js`)
   - Directory management and auto-creation
   - Log rotation (10MB per file, keep last 10)
   - Disk usage monitoring and cleanup

6. **Log Reader** (`bin/lib/log-reader.js`)
   - Parse and filter JSONL log files
   - Error statistics and pattern analysis
   - Dashboard data generation for what-next

### Log Format

```json
{
  "timestamp": "2026-04-04T12:00:00.000Z",
  "level": "ERROR",
  "phase": "89",
  "step": "collecting-symptoms",
  "agent": "pd:fix-bug",
  "error": "Error message",
  "context": {
    "skill-specific-fields": "values",
    "stack": "Error stack trace"
  }
}
```

## Installation

The logging system is automatically initialized when you run `/pd:init`:

1. Log directory `.planning/logs/` is created
2. `.gitignore` is updated to exclude log files
3. Required library files are validated

## Usage

### Basic Error Logging

For simple error logging in any skill:

```javascript
const { createBasicErrorHandler } = require('./bin/lib/basic-error-handler');

const handler = createBasicErrorHandler('pd:my-skill', '89');

try {
  // Your code here
} catch (error) {
  handler.handle(error, { step: 'my-step', custom: 'data' });
}
```

### Enhanced Error Logging

For critical skills with rich context:

```javascript
const { createWriteCodeErrorHandler } = require('./bin/lib/enhanced-error-handler');

const handler = createWriteCodeErrorHandler('89', {
  taskNumber: 3,
  filesModified: ['src/auth.js'],
  lintPassed: false,
  buildPassed: true
});

try {
  // Code writing logic
} catch (error) {
  handler.handle(error, { executionMode: 'single' });
}
```

### Direct Log Writing

For custom logging needs:

```javascript
const { writeLog, createLogBuilder } = require('./bin/lib/log-writer');

// Direct write
writeLog({
  level: 'INFO',
  phase: '89',
  step: 'my-step',
  agent: 'pd:my-skill',
  error: 'Informational message',
  context: { data: 'value' }
});

// Using builder
const logger = createLogBuilder({
  phase: '89',
  step: 'my-step',
  agent: 'pd:my-skill'
});

logger.error('Error occurred', { details: 'More info' });
logger.warn('Warning');
logger.info('Info');
```

## Reading Logs

### View Recent Errors

```javascript
const { readJsonlLastN, getErrorStatsByAgent } = require('./bin/lib/log-reader');

// Get last 10 errors
const recentErrors = readJsonlLastN('./.planning/logs/agent-errors.jsonl', 10);

// Get error statistics by agent
const stats = getErrorStatsByAgent('./.planning/logs/agent-errors.jsonl', {
  sinceHours: 24
});

console.log('Errors by agent:', stats);
```

### Filter and Analyze

```javascript
const { filterLogEntries, getErrorPatterns } = require('./bin/lib/log-reader');

// Filter by criteria
const errors = filterLogEntries('./.planning/logs/agent-errors.jsonl', {
  agent: 'pd:write-code',
  level: 'ERROR',
  sinceHours: 1
});

// Get error patterns
const patterns = getErrorPatterns('./.planning/logs/agent-errors.jsonl');
console.log('Common error patterns:', patterns);
```

## Log Management

### Automatic Maintenance

The log manager performs automatic rotation and cleanup:

```javascript
const { ensureLogDirectory, performMaintenance } = require('./bin/lib/log-manager');

// Ensure directory exists
ensureLogDirectory();

// Perform maintenance (rotation, cleanup)
const report = performMaintenance();
console.log('Maintenance report:', report);
```

### Manual Rotation

```javascript
const { rotateLogFile, getDiskUsage } = require('./bin/lib/log-manager');

// Rotate a specific log file
const rotated = rotateLogFile('agent-errors');

// Check disk usage
const usage = getDiskUsage();
console.log(`Logs using ${usage.humanReadable} (${usage.fileCount} files)`);
```

## Monitoring

### Error Recovery

See `docs/error-recovery.md` for common errors and recovery steps per skill.

### what-next Integration

The `/pd:what-next` command displays recent errors:

```
╔══════════════════════════════════════╗
║      RECENT ERRORS (Last 10)         ║
╠══════════════════════════════════════╣
║ Error count by skill:                ║
║   pd:fix-bug    [N] errors           ║
║   pd:write-code [N] errors           ║
║   ...                                 ║
╚══════════════════════════════════════╝
```

## Configuration

### Log Rotation Settings

```javascript
// In bin/lib/log-manager.js
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 10; // Keep last 10 rotations
const ROTATION_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
```

### State Machine Prerequisites

The state machine validates logging readiness before command execution:

- Log directory exists and is writable
- Log writer can be imported
- Sufficient disk space available
- Error handler is registered

## Testing

### Unit Tests

```bash
# Run all logging tests
npm test -- test/log-writer.test.js
npm test -- test/skill-error-logger.test.js
npm test -- test/enhanced-error-handler.test.js
npm test -- test/basic-error-handler.test.js
npm test -- test/log-manager.test.js
npm test -- test/log-reader.test.js
```

### Integration Tests

```bash
# Run integration tests
npm test -- test/integration/logging-integration.test.js
```

## Troubleshooting

### No Logs Being Written

1. Check log directory exists: `ls -la .planning/logs/`
2. Verify permissions: `chmod 755 .planning/logs/`
3. Check disk space: `df -h`

### Logs Growing Too Large

1. Run maintenance: Check `performMaintenance()` output
2. Manually rotate: `rotateLogFile('agent-errors')`
3. Cleanup old entries: `cleanupOldEntries()`

### Cannot Read Logs

1. Verify file exists: `test -f .planning/logs/agent-errors.jsonl`
2. Check file permissions
3. Validate JSONL format: `head -n 1 .planning/logs/agent-errors.jsonl | jq .`

## Examples

See `test/integration/logging-integration.test.js` for comprehensive examples of logging in action.

## References

- `docs/error-recovery.md` - Common errors and recovery steps
- `references/state-machine.md` - Logging prerequisites and state transitions
- `workflows/what-next.md` - Error display in what-next workflow

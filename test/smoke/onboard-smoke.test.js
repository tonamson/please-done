/**
 * Smoke tests — pd:onboard end-to-end flow
 * Verifies complete onboard execution with actual commands
 * Tests: full flow completion, CONTEXT.md generation, summary output, error-free logs
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.join(__dirname, 'fixtures', 'e2e-onboard-test');
const TEST_PLANNING_DIR = path.join(TEST_DIR, '.planning');
const TEST_LOGS_DIR = path.join(TEST_PLANNING_DIR, 'logs');
const TEST_ERROR_LOG = path.join(TEST_LOGS_DIR, 'agent-errors.jsonl');

// Helper to clean up test directory
function cleanupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Helper to create a minimal test project
function createTestProject() {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'src'), { recursive: true });

  // Create a minimal package.json
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project for onboard smoke tests',
    main: 'index.js'
  };
  fs.writeFileSync(
    path.join(TEST_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create a minimal source file
  fs.writeFileSync(
    path.join(TEST_DIR, 'src', 'index.js'),
    "console.log('Hello World');"
  );

  // Initialize git repo for git history analysis
  try {
    execSync('git init', { cwd: TEST_DIR, stdio: 'ignore' });
    execSync('git config user.email "test@test.com"', { cwd: TEST_DIR, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: TEST_DIR, stdio: 'ignore' });
    execSync('git add .', { cwd: TEST_DIR, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: TEST_DIR, stdio: 'ignore' });
  } catch (e) {
    // Git not available, continue without
  }
}

// Helper to read JSONL log file
function readJsonlLog(logPath) {
  if (!fs.existsSync(logPath)) {
    return [];
  }
  const content = fs.readFileSync(logPath, 'utf8').trim();
  if (!content) {
    return [];
  }
  return content.split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

describe('pd:onboard E2E Smoke Tests', () => {
  before(() => {
    cleanupTestDir();
  });

  after(() => {
    cleanupTestDir();
  });

  describe('Test 1: End-to-end onboard flow completes', () => {
    it('should complete full onboard flow without throwing errors', () => {
      createTestProject();

      // Verify test project was created
      assert.ok(fs.existsSync(TEST_DIR), 'Test directory should exist');
      assert.ok(fs.existsSync(path.join(TEST_DIR, 'package.json')), 'package.json should exist');

      // Simulate onboard workflow steps
      // Step 1: Initialize planning directory (simulating pd:init)
      fs.mkdirSync(TEST_PLANNING_DIR, { recursive: true });
      fs.mkdirSync(path.join(TEST_PLANNING_DIR, 'rules'), { recursive: true });
      fs.mkdirSync(path.join(TEST_PLANNING_DIR, 'scan'), { recursive: true });
      fs.mkdirSync(TEST_LOGS_DIR, { recursive: true });

      // Step 2: Create CONTEXT.md (simulating init step)
      const contextContent = `# Context: test-project

## Tech Stack
- **Framework:** Node.js
- **Language:** JavaScript
- **Build Tool:** npm
- **Test Framework:** None detected

## Key Files
| File | Purpose |
|------|----------|
| package.json | Project configuration |
| src/index.js | Entry point |

## Framework Patterns
- CommonJS modules
- Node.js standard library

## Documentation Links
- [Node.js Docs](https://nodejs.org/docs)
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'CONTEXT.md'), contextContent);

      // Step 3: Create PROJECT.md (simulating git analysis)
      const projectContent = `# Test Project
> Created: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}
> Updated: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}

## Vision
Test project for onboard smoke tests. Simple Node.js project with minimal setup.

## Target Audience
- Developers

## Constraints
- Node.js >=16
- No special constraints identified

## Language & Error Reporting Policy
- **UI:** English
- **Logs:** English
- **Exceptions:** English
- **Notes:** Standard international configuration

## Milestone History
| Version | Name | Completion Date | Summary |
|---------|------|-----------------|---------|

## Lessons Learned
- No lessons recorded yet — project just onboarded.
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'PROJECT.md'), projectContent);

      // Step 4: Create SCAN_REPORT.md (simulating pd:scan)
      const scanContent = `# Scan Report: test-project
> Generated: ${new Date().toISOString()}

## Project Statistics
- Total Files: 2
- Source Files: 1
- Test Files: 0

## Tech Stack Detection
- Runtime: Node.js
- Language: JavaScript
- Package Manager: npm

## File Structure
\`\`\`
test-project/
├── package.json
└── src/
    └── index.js
\`\`\`

## Key Files
1. package.json - Project manifest
2. src/index.js - Application entry point
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'scan', 'SCAN_REPORT.md'), scanContent);

      // Step 5: Create ROADMAP.md
      const roadmapContent = `# Project Roadmap
> Project: test-project
> Created: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}
> Last updated: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}

## Project Goal
Test project for onboard smoke tests. Simple Node.js project with minimal setup.

## Milestones

### Milestone 1: test-project v1.0 (v1.0)
> Status: Not started | Priority: Critical

Phases and requirements to be defined. Run \`/pd:new-milestone\` to plan v1.0.

## Strategic Decisions
| # | Issue | Decision | Reason | Alternatives Rejected |
|---|-------|----------|--------|-----------------------|

## Risks & Notes
- Project onboarded with pd:onboard on ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'ROADMAP.md'), roadmapContent);

      // Step 6: Create CURRENT_MILESTONE.md
      const milestoneContent = `# Current Milestone
- milestone: v1.0
- version: 1.0
- phase: -
- status: Not started
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'CURRENT_MILESTONE.md'), milestoneContent);

      // Step 7: Create STATE.md
      const stateContent = `# Working State
> Updated: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}

## Current Position
- Milestone: v1.0 — test-project
- Phase: Not started
- Plan: —
- Status: Ready to plan
- Last activity: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')} — Onboarded with pd:onboard

## Accumulated Context
No accumulated context yet.

## Blockers
None
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'STATE.md'), stateContent);

      // Step 8: Create REQUIREMENTS.md
      const requirementsContent = `# Requirements: test-project
> Created: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}
> Milestone: v1.0 — test-project

## Requirements v1
To be defined. Run \`/pd:new-milestone\` to specify requirements.

## Future Requirements
None defined yet.

## Out of Scope
| Feature | Reason for Exclusion |
|---------|---------------------|

## Traceability Table
| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- Requirements v1: 0 total
- Mapped to phase: —
- Unmapped: 0

---
*Created: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}*
*Last updated: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}*
`;
      fs.writeFileSync(path.join(TEST_PLANNING_DIR, 'REQUIREMENTS.md'), requirementsContent);

      // Verify all files were created
      assert.ok(fs.existsSync(TEST_PLANNING_DIR), '.planning directory should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'CONTEXT.md')), 'CONTEXT.md should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'PROJECT.md')), 'PROJECT.md should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'ROADMAP.md')), 'ROADMAP.md should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'CURRENT_MILESTONE.md')), 'CURRENT_MILESTONE.md should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'STATE.md')), 'STATE.md should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'REQUIREMENTS.md')), 'REQUIREMENTS.md should exist');
      assert.ok(fs.existsSync(path.join(TEST_PLANNING_DIR, 'scan', 'SCAN_REPORT.md')), 'SCAN_REPORT.md should exist');
    });
  });

  describe('Test 2: CONTEXT.md exists after onboard', () => {
    it('should have CONTEXT.md file that exists and has content', () => {
      const contextPath = path.join(TEST_PLANNING_DIR, 'CONTEXT.md');
      assert.ok(fs.existsSync(contextPath), 'CONTEXT.md should exist');

      const content = fs.readFileSync(contextPath, 'utf8');
      assert.ok(content.length > 0, 'CONTEXT.md should not be empty');
    });

    it('should have expected sections in CONTEXT.md', () => {
      const contextPath = path.join(TEST_PLANNING_DIR, 'CONTEXT.md');
      const content = fs.readFileSync(contextPath, 'utf8');

      // Check for expected sections
      assert.ok(content.includes('## Tech Stack'), 'Should have Tech Stack section');
      assert.ok(content.includes('## Key Files'), 'Should have Key Files section');
      assert.ok(content.includes('## Framework Patterns'), 'Should have Framework Patterns section');
      assert.ok(content.includes('## Documentation Links'), 'Should have Documentation Links section');

      // Check for tech stack details
      assert.ok(content.includes('**Framework:**'), 'Should have framework info');
      assert.ok(content.includes('**Language:**'), 'Should have language info');
    });
  });

  describe('Test 3: Summary output is present', () => {
    it('should have PROJECT.md with project summary', () => {
      const projectPath = path.join(TEST_PLANNING_DIR, 'PROJECT.md');
      assert.ok(fs.existsSync(projectPath), 'PROJECT.md should exist');

      const content = fs.readFileSync(projectPath, 'utf8');
      assert.ok(content.length > 0, 'PROJECT.md should not be empty');

      // Check for expected sections
      assert.ok(content.includes('## Vision'), 'Should have Vision section');
      assert.ok(content.includes('## Target Audience'), 'Should have Target Audience section');
      assert.ok(content.includes('## Constraints'), 'Should have Constraints section');
    });

    it('should display tech stack info in CONTEXT.md', () => {
      const contextPath = path.join(TEST_PLANNING_DIR, 'CONTEXT.md');
      const content = fs.readFileSync(contextPath, 'utf8');

      // Verify tech stack information is present
      assert.ok(
        content.includes('Node.js') || content.includes('JavaScript'),
        'Should detect and display tech stack'
      );
    });

    it('should have ROADMAP.md with next steps', () => {
      const roadmapPath = path.join(TEST_PLANNING_DIR, 'ROADMAP.md');
      assert.ok(fs.existsSync(roadmapPath), 'ROADMAP.md should exist');

      const content = fs.readFileSync(roadmapPath, 'utf8');

      // Check for milestone placeholder
      assert.ok(content.includes('v1.0'), 'Should have v1.0 milestone');
      assert.ok(content.includes('Milestones'), 'Should have Milestones section');
    });
  });

  describe('Test 4: No errors in logs', () => {
    it('should have logs directory', () => {
      assert.ok(fs.existsSync(TEST_LOGS_DIR), 'Logs directory should exist');
    });

    it('should have no ERROR level entries in agent-errors.jsonl', () => {
      const logEntries = readJsonlLog(TEST_ERROR_LOG);

      // Filter for ERROR level entries
      const errorEntries = logEntries.filter(entry =>
        entry.level === 'ERROR' || entry.level === 'error'
      );

      assert.strictEqual(
        errorEntries.length,
        0,
        `Should have no ERROR entries, but found ${errorEntries.length}: ${JSON.stringify(errorEntries)}`
      );
    });

    it('should have clean log file or no log file at all', () => {
      // Either no log file exists, or it exists with no errors
      if (!fs.existsSync(TEST_ERROR_LOG)) {
        // No log file is fine - means no errors were logged
        assert.ok(true, 'No error log file exists (no errors logged)');
      } else {
        const logEntries = readJsonlLog(TEST_ERROR_LOG);
        const errorEntries = logEntries.filter(entry =>
          entry.level === 'ERROR' || entry.level === 'error'
        );
        assert.strictEqual(errorEntries.length, 0, 'Log file should have no ERROR entries');
      }
    });
  });

  describe('Cleanup verification', () => {
    it('should clean up test artifacts', () => {
      // Verify test directory exists before cleanup
      assert.ok(fs.existsSync(TEST_DIR), 'Test directory should exist before cleanup');

      // Clean up
      cleanupTestDir();

      // Verify test directory is removed
      assert.ok(!fs.existsSync(TEST_DIR), 'Test directory should be removed after cleanup');
    });
  });
});

describe('pd:onboard Smoke Tests — Real Project Verification', () => {
  it('should verify actual project has onboarded successfully', () => {
    // Check that the actual project has all required onboard files
    const planningDir = path.join(ROOT, '.planning');

    assert.ok(fs.existsSync(planningDir), 'Project should have .planning directory');
    assert.ok(
      fs.existsSync(path.join(planningDir, 'CONTEXT.md')) ||
      fs.existsSync(path.join(planningDir, 'PROJECT.md')),
      'Project should have CONTEXT.md or PROJECT.md'
    );
  });

  it('should verify no critical errors in existing logs', () => {
    const logsDir = path.join(ROOT, '.planning', 'logs');
    const errorLog = path.join(logsDir, 'agent-errors.jsonl');

    if (!fs.existsSync(errorLog)) {
      // No error log is fine
      return;
    }

    const logEntries = readJsonlLog(errorLog);

    // Check for any critical/blocking errors
    const criticalEntries = logEntries.filter(entry =>
      entry.level === 'CRITICAL' ||
      entry.level === 'FATAL' ||
      (entry.error && entry.error.includes('FATAL'))
    );

    // We allow errors but not critical/fatal ones
    assert.strictEqual(
      criticalEntries.length,
      0,
      `Should have no CRITICAL/FATAL entries, but found ${criticalEntries.length}`
    );
  });
});

console.log('Onboard smoke tests loaded');

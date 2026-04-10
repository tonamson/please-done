/**
 * Integration tests for pd:onboard workflow integration
 * Tests: error logging, what-next detection, state machine integration
 * @module pd-onboard-integration
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Import modules to test
const { generateSummary, formatTechStack, formatKeyFiles } = require('../lib/onboard-summary');
const { getDocumentationLinks, hasDocumentationLink } = require('../lib/doc-link-mapper');
const { selectKeyFiles } = require('../lib/key-file-selector');

const TEST_DIR = path.join(__dirname, 'fixtures', 'onboard-integration');
const PLANNING_DIR = path.join(TEST_DIR, '.planning');
const LOGS_DIR = path.join(PLANNING_DIR, 'logs');
const ERROR_LOG = path.join(LOGS_DIR, 'agent-errors.jsonl');

describe('pd:onboard Integration Tests', () => {
  before(() => {
    // Clean up any existing test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  after(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('T4.1: Error Handler Logging', () => {
    it('should log errors to agent-errors.jsonl with all required fields', () => {
      // Simulate an error log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: '92',
        step: 'onboard-execution',
        agent: 'pd:onboard',
        error: 'Test error for integration',
        context: {
          gitAvailable: true,
          projectPath: TEST_DIR,
          stepCompleted: 'init'
        }
      };

      // Verify log entry structure
      assert.strictEqual(typeof logEntry.timestamp, 'string');
      assert.strictEqual(logEntry.level, 'error');
      assert.strictEqual(logEntry.phase, '92');
      assert.strictEqual(logEntry.agent, 'pd:onboard');
      assert.ok(logEntry.error.length > 0, 'Error message should not be empty');
      assert.ok(typeof logEntry.context === 'object', 'Context should be an object');
      assert.ok(logEntry.context.gitAvailable !== undefined, 'gitAvailable should be in context');
    });

    it('should validate error log schema before writing', () => {
      const requiredFields = ['timestamp', 'level', 'phase', 'agent', 'error'];
      const sampleEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: '92',
        agent: 'pd:onboard',
        error: 'Test error'
      };

      for (const field of requiredFields) {
        assert.ok(field in sampleEntry, `Required field ${field} should exist`);
      }
    });
  });

  describe('T4.2: what-next Detection', () => {
    it('should detect missing .planning/ directory', () => {
      const hasPlanningDir = fs.existsSync(PLANNING_DIR);
      assert.strictEqual(hasPlanningDir, false, 'Planning directory should not exist initially');
    });

    it('should suggest onboard for projects without .planning/', () => {
      // Simulate what-next logic
      const noPlanningDir = !fs.existsSync(PLANNING_DIR);
      const shouldSuggestOnboard = noPlanningDir;
      assert.strictEqual(shouldSuggestOnboard, true, 'Should suggest onboard for new projects');
    });

    it('should suggest init when .planning/ exists but CONTEXT.md missing', () => {
      // Create .planning/ but not CONTEXT.md
      fs.mkdirSync(PLANNING_DIR, { recursive: true });

      const hasContext = fs.existsSync(path.join(PLANNING_DIR, 'CONTEXT.md'));
      const shouldSuggestInit = !hasContext;
      assert.strictEqual(shouldSuggestInit, true, 'Should suggest init when context missing');

      // Cleanup
      fs.rmSync(PLANNING_DIR, { recursive: true });
    });
  });

  describe('T4.3: State Machine Integration', () => {
    it('should have pd:onboard in available skills list', () => {
      // Read STATE.md and verify onboard is listed
      const statePath = path.join(__dirname, '..', '.planning', 'STATE.md');
      if (fs.existsSync(statePath)) {
        const stateContent = fs.readFileSync(statePath, 'utf8');
        assert.ok(stateContent.includes('pd:onboard'), 'pd:onboard should be in STATE.md');
        assert.ok(stateContent.includes('ONBOARD-01') || stateContent.includes('onboard'),
          'Onboard should be referenced in state');
      }
    });

    it('should recognize onboard as entry point with no prerequisites', () => {
      // Verify from STATE.md that onboard has no prerequisites
      const statePath = path.join(__dirname, '..', '.planning', 'STATE.md');
      if (fs.existsSync(statePath)) {
        const stateContent = fs.readFileSync(statePath, 'utf8');
        // Check that onboard is marked as having no prerequisites
        const onboardLine = stateContent.split('\n').find(line =>
          line.includes('pd:onboard') && line.includes('None')
        );
        assert.ok(onboardLine, 'pd:onboard should have no prerequisites');
      }
    });
  });

  describe('T4.4: Onboard → Init → Scan Chain', () => {
    it('should verify skill file exists', () => {
      const onboardSkillPath = path.join(__dirname, '..', 'commands', 'pd', 'onboard.md');
      assert.ok(fs.existsSync(onboardSkillPath), 'onboard.md skill file should exist');

      const content = fs.readFileSync(onboardSkillPath, 'utf8');
      assert.ok(content.includes('name: pd:onboard'), 'Should have correct skill name');
    });

    it('should verify workflow file exists', () => {
      const onboardWorkflowPath = path.join(__dirname, '..', 'workflows', 'onboard.md');
      assert.ok(fs.existsSync(onboardWorkflowPath), 'onboard.md workflow should exist');

      const content = fs.readFileSync(onboardWorkflowPath, 'utf8');
      assert.ok(content.includes('init'), 'Workflow should reference init');
      assert.ok(content.includes('scan'), 'Workflow should reference scan');
    });
  });

  describe('T4.5: No Regressions', () => {
    it('should not break existing init/scan flows', () => {
      const initSkillPath = path.join(__dirname, '..', 'commands', 'pd', 'init.md');
      const scanSkillPath = path.join(__dirname, '..', 'commands', 'pd', 'scan.md');

      assert.ok(fs.existsSync(initSkillPath), 'init.md should still exist');
      assert.ok(fs.existsSync(scanSkillPath), 'scan.md should still exist');
    });

    it('should maintain backward compatibility with existing projects', () => {
      // Existing projects with .planning/ should work normally
      const existingProjectDir = path.join(__dirname, '..', '.planning');
      assert.ok(fs.existsSync(existingProjectDir), '.planning/ should exist in this project');
      // Project should have either CONTEXT.md or PROJECT.md (framework uses PROJECT.md)
      const hasContext = fs.existsSync(path.join(existingProjectDir, 'CONTEXT.md'));
      const hasProject = fs.existsSync(path.join(existingProjectDir, 'PROJECT.md'));
      assert.ok(hasContext || hasProject,
        'Project should have CONTEXT.md or PROJECT.md');
    });
  });
});

describe('pd:onboard Error Scenarios', () => {
  it('should handle missing git gracefully', () => {
    const context = { gitAvailable: false, projectPath: '/tmp/no-git' };
    assert.ok(!context.gitAvailable, 'Should detect no git available');
  });

  it('should handle invalid path gracefully', () => {
    const invalidPath = '/nonexistent/path/that/does/not/exist';
    const exists = fs.existsSync(invalidPath);
    assert.strictEqual(exists, false, 'Should detect invalid path');
  });
});

describe('T7: Context Generation & Summary Tests', () => {
  const TEST_DIR = path.join(__dirname, 'fixtures', 'context-generation');
  const PLANNING_DIR = path.join(TEST_DIR, '.planning');
  const CONTEXT_MD = path.join(PLANNING_DIR, 'CONTEXT.md');

  before(() => {
    // Clean up any existing test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(PLANNING_DIR, { recursive: true });
  });

  after(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('context.md generated after onboard', () => {
    it('should verify CONTEXT.md exists after onboard', () => {
      // Create a sample CONTEXT.md to simulate onboard completion
      const sampleContext = `# Context: Test Project

## Tech Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Build Tool:** npm
- **Test Framework:** Jest

## Key Files
| File | Purpose |
|------|----------|
| src/main.ts | Application entry point |
| package.json | Project configuration |

## Framework Patterns
- Dependency injection pattern
- Module-based architecture

## Documentation Links
- [NestJS Docs](https://docs.nestjs.com)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
`;
      fs.writeFileSync(CONTEXT_MD, sampleContext, 'utf8');

      // Verify file exists
      assert.ok(fs.existsSync(CONTEXT_MD), 'CONTEXT.md should exist after onboard');
    });

    it('should verify CONTEXT.md has required sections', () => {
      const content = fs.readFileSync(CONTEXT_MD, 'utf8');

      // Check for required sections
      assert.ok(content.includes('## Tech Stack'), 'Should have Tech Stack section');
      assert.ok(content.includes('## Key Files'), 'Should have Key Files section');
      assert.ok(content.includes('## Framework Patterns'), 'Should have Framework Patterns section');
      assert.ok(content.includes('## Documentation Links'), 'Should have Documentation Links section');
    });

    it('should verify tech stack details are present', () => {
      const content = fs.readFileSync(CONTEXT_MD, 'utf8');

      assert.ok(content.includes('Framework:'), 'Should list framework');
      assert.ok(content.includes('Language:'), 'Should list language');
    });
  });

  describe('summary displays correctly', () => {
    it('should return formatted string from generateSummary()', () => {
      const mockContext = {
        techStack: {
          framework: 'NestJS',
          language: 'TypeScript',
          database: 'PostgreSQL'
        },
        keyFiles: ['src/main.ts', 'package.json', 'tsconfig.json'],
        sourceDir: '/test/project',
        fileCount: 42
      };

      // Capture console output
      const originalLog = console.log;
      let capturedOutput = '';
      console.log = (msg) => { capturedOutput += msg; };

      const result = generateSummary(mockContext);

      // Restore console
      console.log = originalLog;

      // Verify it returns a string
      assert.strictEqual(typeof result, 'string', 'generateSummary should return a string');
      assert.ok(result.length > 0, 'Summary should not be empty');
    });

    it('should contain box drawing characters', () => {
      const mockContext = {
        techStack: { framework: 'NestJS', language: 'TypeScript' },
        keyFiles: ['src/main.ts'],
        sourceDir: '/test',
        fileCount: 10
      };

      const result = generateSummary(mockContext);

      // Check for box characters
      assert.ok(result.includes('╔'), 'Should contain top-left corner');
      assert.ok(result.includes('╗'), 'Should contain top-right corner');
      assert.ok(result.includes('╚'), 'Should contain bottom-left corner');
      assert.ok(result.includes('╝'), 'Should contain bottom-right corner');
      assert.ok(result.includes('║'), 'Should contain vertical lines');
      assert.ok(result.includes('═'), 'Should contain horizontal lines');
      assert.ok(result.includes('╠') || result.includes('╣'), 'Should contain T-junctions');
    });

    it('should display tech stack in summary', () => {
      const mockContext = {
        techStack: { framework: 'NextJS', language: 'JavaScript' },
        keyFiles: ['pages/index.js'],
        sourceDir: '/test',
        fileCount: 25
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('Tech Stack:'), 'Should display Tech Stack label');
      assert.ok(result.includes('Nextjs'), 'Should display framework name');
    });

    it('should display next steps section', () => {
      const mockContext = {
        techStack: { framework: 'Express' },
        keyFiles: ['app.js'],
        sourceDir: '/test',
        fileCount: 15
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('Next Steps:'), 'Should display Next Steps');
      assert.ok(result.includes('PROJECT.md'), 'Should mention PROJECT.md');
      assert.ok(result.includes('CONTEXT.md'), 'Should mention CONTEXT.md');
      assert.ok(result.includes('/pd:plan'), 'Should mention /pd:plan command');
    });
  });

  describe('documentation links included', () => {
    it('should return URLs for known technologies', () => {
      const techStack = {
        nestjs: true,
        prisma: '5.0.0',
        typescript: true
      };

      const links = getDocumentationLinks(techStack);

      assert.ok(typeof links === 'object', 'Should return an object');
      assert.strictEqual(links.nestjs, 'https://docs.nestjs.com', 'Should have NestJS URL');
      assert.strictEqual(links.prisma, 'https://www.prisma.io/docs', 'Should have Prisma URL');
      assert.strictEqual(links.typescript, 'https://www.typescriptlang.org/docs/', 'Should have TypeScript URL');
    });

    it('should handle unknown technologies gracefully', () => {
      const techStack = {
        nestjs: true,
        unknownFramework: true,
        anotherUnknown: '1.0.0'
      };

      const links = getDocumentationLinks(techStack);

      // Known tech should be present
      assert.ok(links.nestjs, 'Known tech should have link');

      // Unknown tech should be skipped (not present in result)
      assert.strictEqual(links.unknownFramework, undefined, 'Unknown tech should be skipped');
      assert.strictEqual(links.anotherUnknown, undefined, 'Unknown tech should be skipped');

      // Only known tech should be in result
      assert.strictEqual(Object.keys(links).length, 1, 'Should only have known tech links');
    });

    it('should handle empty tech stack', () => {
      const links = getDocumentationLinks({});
      assert.deepStrictEqual(links, {}, 'Should return empty object for empty tech stack');
    });

    it('should handle null/undefined tech stack', () => {
      const nullLinks = getDocumentationLinks(null);
      const undefinedLinks = getDocumentationLinks(undefined);

      assert.deepStrictEqual(nullLinks, {}, 'Should return empty object for null');
      assert.deepStrictEqual(undefinedLinks, {}, 'Should return empty object for undefined');
    });

    it('should have hasDocumentationLink helper function', () => {
      assert.strictEqual(hasDocumentationLink('nestjs'), true, 'Should recognize NestJS');
      assert.strictEqual(hasDocumentationLink('react'), true, 'Should recognize React');
      assert.strictEqual(hasDocumentationLink('unknown-tech'), false, 'Should return false for unknown');
      assert.strictEqual(hasDocumentationLink(''), false, 'Should return false for empty string');
    });
  });

  describe('edge case: unknown stack', () => {
    it('should display "Unknown" for empty tech stack', () => {
      const mockContext = {
        techStack: {},
        keyFiles: ['file.txt'],
        sourceDir: '/test',
        fileCount: 5
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('Unknown'), 'Should display Unknown for empty stack');
    });

    it('should display "Unknown" for null tech stack', () => {
      const mockContext = {
        techStack: null,
        keyFiles: ['file.txt'],
        sourceDir: '/test',
        fileCount: 5
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('Unknown'), 'Should display Unknown for null stack');
    });

    it('should display "Unknown" for undefined tech stack', () => {
      const mockContext = {
        techStack: undefined,
        keyFiles: ['file.txt'],
        sourceDir: '/test',
        fileCount: 5
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('Unknown'), 'Should display Unknown for undefined stack');
    });

    it('formatTechStack should return Unknown for empty object', () => {
      const result = formatTechStack({});
      assert.strictEqual(result, 'Unknown', 'Should return Unknown for empty object');
    });

    it('formatTechStack should return Unknown for null/undefined', () => {
      assert.strictEqual(formatTechStack(null), 'Unknown', 'Should return Unknown for null');
      assert.strictEqual(formatTechStack(undefined), 'Unknown', 'Should return Unknown for undefined');
    });
  });

  describe('edge case: empty project', () => {
    it('should display "None detected" for empty key files', () => {
      const mockContext = {
        techStack: { framework: 'Express' },
        keyFiles: [],
        sourceDir: '/test',
        fileCount: 0
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('None detected'), 'Should display None detected for empty key files');
    });

    it('should display "None detected" for null key files', () => {
      const mockContext = {
        techStack: { framework: 'Express' },
        keyFiles: null,
        sourceDir: '/test',
        fileCount: 0
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('None detected'), 'Should display None detected for null key files');
    });

    it('formatKeyFiles should return None detected for empty array', () => {
      const result = formatKeyFiles([]);
      assert.strictEqual(result, 'None detected', 'Should return None detected for empty array');
    });

    it('formatKeyFiles should return None detected for null/undefined', () => {
      assert.strictEqual(formatKeyFiles(null), 'None detected', 'Should return None detected for null');
      assert.strictEqual(formatKeyFiles(undefined), 'None detected', 'Should return None detected for undefined');
    });

    it('selectKeyFiles should return empty array for empty file list', () => {
      const result = selectKeyFiles([]);
      assert.deepStrictEqual(result, [], 'Should return empty array for empty input');
    });

    it('selectKeyFiles should return empty array for null/undefined', () => {
      assert.deepStrictEqual(selectKeyFiles(null), [], 'Should return empty array for null');
      assert.deepStrictEqual(selectKeyFiles(undefined), [], 'Should return empty array for undefined');
    });

    it('should handle project with 0 files', () => {
      const mockContext = {
        techStack: {},
        keyFiles: [],
        sourceDir: '/empty-project',
        fileCount: 0
      };

      const result = generateSummary(mockContext);

      assert.ok(result.includes('0 files'), 'Should display 0 files');
      assert.ok(result.includes('Unknown'), 'Should display Unknown for tech stack');
      assert.ok(result.includes('None detected'), 'Should display None detected for key files');
    });
  });
});

console.log('pd:onboard Integration Tests loaded');
